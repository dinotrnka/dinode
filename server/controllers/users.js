const express = require('express');
const _ = require('lodash'); // eslint-disable-line more-naming-conventions/snake-case-variables
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator/check');

const { User } = require('../models/user');
const { Activation } = require('../models/activation');
const { authenticate } = require('../middleware/authenticate');

const app = express();

app.post('/', [
  check('email')
    .trim()
    .exists().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .custom(email => User.findOne({ email: email.toLowerCase() }).then((user) => {
      if (user) {
        throw new Error(`User with email ${email} already exists`);
      }
      return Promise.resolve;
    })),
  check('password')
    .exists().withMessage('Password is required')
    .isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ error: errors.array()[0].msg });
    }

    const body = _.pick(req.body, ['email', 'password']);

    const user = new User({
      email: body.email.toLowerCase(),
      password: body.password,
    });
    await user.save();

    // Registration automatically triggers sending first activation code
    const activation = new Activation({ _owner: user._id });
    await activation.save();

    res.send({ success: 'Registration successful' });
  } catch (e) {
    res.status(400).send({ error: 'Error while creating user' });
  }
});

app.post('/send_activation_code', [
  check('email')
    .trim()
    .exists().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .custom(email => User.findOne({ email: email.toLowerCase() }).then((user) => {
      if (!user) {
        throw new Error(`User with email ${email} does not exist`);
      }
      return Promise.resolve;
    })),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ error: errors.array()[0].msg });
  }
  const body = _.pick(req.body, ['email']);
  const email = body.email.toLowerCase();
  const user = await User.findOne({ email });

  const activation = await Activation.findOne({ _owner: user._id });
  if (!activation) {
    return res.status(400).send({ error: `User with email ${email} is already activated` });
  }

  await Activation.remove({ _owner: user._id }); // Remove previous activation code
  await new Activation({ _owner: user._id }).save();

  res.send({ success: `Activation code sent to ${email}` });
});

app.get('/activate/:code', async (req, res) => {
  const { code } = req.params;

  const activation = await Activation.findOne({ code });
  if (activation) {
    if (await activation.isValid()) {
      await activation.remove();
      return res.status(200).send({ success: 'Account successfully activated' });
    }

    return res.status(400).send({ error: 'Activation code expired' });
  }

  return res.status(400).send({ error: 'Invalid activation code' });
});

app.post('/login', [
  check('email')
    .trim()
    .exists().withMessage('Email is required'),
  check('password')
    .trim()
    .exists().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ error: errors.array()[0].msg });
  }

  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = await User.findByCredentials(body.email.toLowerCase(), body.password);

    const user_is_activated = await user.isActivated();
    if (!user_is_activated) {
      return res.status(400).send({ error: 'Account not activated' });
    }

    const access_token = await user.generateToken('access');
    const refresh_token = await user.generateToken('refresh');

    const decoded = jwt.verify(access_token, process.env.JWT_SECRET);

    res.send({ access_token, refresh_token, expires: decoded.exp });
  } catch (e) {
    res.status(400).send({ error: 'Invalid credentials' });
  }
});

app.post('/refresh_token', [
  check('refresh_token')
    .trim()
    .exists().withMessage('Refresh token is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ error: errors.array()[0].msg });
  }

  try {
    const body = _.pick(req.body, ['refresh_token']);
    const user = await User.findByToken('refresh', body.refresh_token);
    if (!user) {
      return res.status(401).send({ error: 'Invalid refresh token' });
    }

    // Invalidate old refresh token
    await user.removeToken('refresh', body.refresh_token);

    const access_token = await user.generateToken('access');
    const refresh_token = await user.generateToken('refresh');

    const decoded = jwt.verify(access_token, process.env.JWT_SECRET);

    res.send({ access_token, refresh_token, expires: decoded.exp });
  } catch (e) {
    res.status(400).send({ error: 'Invalid refresh token' });
  }
});

app.post('/change_password', authenticate, [
  check('old_password')
    .exists().withMessage('Old password is required'),
  check('new_password')
    .exists().withMessage('New password is required')
    .isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ error: errors.array()[0].msg });
  }

  try {
    const body = _.pick(req.body, ['old_password', 'new_password']);
    const success = await req.user.checkPassword(body.old_password);

    if (success) {
      req.user.password = body.new_password;
      await req.user.save();
      await req.user.removeAllTokens();
      res.status(200).send({ success: 'Password successfully changed' });
    } else {
      res.status(400).send({ error: 'Incorrect old password' });
    }
  } catch (e) {
    res.status(400).send({ error: 'Error while changing password' });
  }
});

app.post('/logout', authenticate, async (req, res) => {
  try {
    await req.user.removeToken('access', req.token);
    res.status(200).send({ success: 'Logged out' });
  } catch (e) {
    res.status(400).send({ error: 'Error while logging out' });
  }
});

module.exports = app;

