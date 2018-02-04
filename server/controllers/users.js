const express = require('express');
const _ = require('lodash'); // eslint-disable-line more-naming-conventions/snake-case-variables
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator/check');
const axios = require('axios');

const { User } = require('../models/user');
const { Activation } = require('../models/activation');
const { Facebook } = require('../models/facebook');
const { Google } = require('../models/google');
const { authenticate } = require('../middleware/authenticate');

const app = express();

app.post('/register', [
  check('email')
    .trim()
    .exists().withMessage('Email is required')
    .isEmail().withMessage('Email address is not valid')
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

    if (process.env.EMAIL_ACTIVATION === 'on') {
      const activation = await new Activation({ _owner: user._id }).save();
      activation.sendEmail(); // Not waiting, email is sent asynchronously
      return res.send({ success: 'Registration successful, activation email sent' });
    }

    return res.send({ success: 'Registration successful' });
  } catch (e) {
    return res.status(400).send({ error: 'Error while creating user' });
  }
});

app.post('/facebook_connect', [
  check('token').exists().withMessage('Facebook token is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ error: errors.array()[0].msg });
    }

    const response = await axios.get('https://graph.facebook.com/v2.11/me', {
      params: { fields: 'email', access_token: req.body.token },
    });

    const facebook_id = response.data.id;
    const facebook_email = response.data.email;
    if (!facebook_email) {
      return res.status(400).send({ error: 'Facebook email is not provided' });
    }

    let facebook = await Facebook.findOne({ _facebook_id: response.data.id });
    if (!facebook) {
      // User with this Facebook ID doesn't exist, register him first
      if (await User.findOne({ email: facebook_email })) {
        return res.status(400).send({ error: `User with email ${facebook_email} already exists` });
      }

      const user = await new User({ email: facebook_email }).save();
      facebook = await new Facebook({
        _owner: user._id,
        _facebook_id: facebook_id,
      }).save();
    }

    // Facebook login
    const user = await User.findById(facebook._owner);
    const access_token = await user.generateToken('access');
    const refresh_token = await user.generateToken('refresh');
    const decoded = jwt.verify(access_token, process.env.JWT_SECRET);

    return res.send({ access_token, refresh_token, expires: decoded.exp });
  } catch (e) {
    if (e.response) { // This means Facebook has useful response data about the error
      return res.status(400).send({ error: e.response.data.error.message });
    }
    return res.status(400).send({ error: 'Error while attempting Facebook connect' });
  }
});

app.post('/google_connect', [
  check('token').exists().withMessage('Google token is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ error: errors.array()[0].msg });
    }

    const response = await axios.get('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${req.body.token}` },
    });

    const google_id = response.data.id;
    const google_email = response.data.email;
    if (!google_email) {
      return res.status(400).send({ error: 'Google email is not provided' });
    }

    let google = await Google.findOne({ _google_id: response.data.id });
    if (!google) {
      // User with this Google ID doesn't exist, register him first
      if (await User.findOne({ email: google_email })) {
        return res.status(400).send({ error: `User with email ${google_email} already exists` });
      }

      const user = await new User({ email: google_email }).save();
      google = await new Google({
        _owner: user._id,
        _google_id: google_id,
      }).save();
    }

    // Google login
    const user = await User.findById(google._owner);
    const access_token = await user.generateToken('access');
    const refresh_token = await user.generateToken('refresh');
    const decoded = jwt.verify(access_token, process.env.JWT_SECRET);

    return res.send({ access_token, refresh_token, expires: decoded.exp });
  } catch (e) {
    if (e.response) { // This means Google has useful response data about the error
      return res.status(400).send({ error: e.response.data.error.message });
    }
    return res.status(400).send({ error: 'Error while attempting Google connect' });
  }
});

app.post('/send_activation_code', [
  check('email')
    .trim()
    .exists().withMessage('Email is required')
    .isEmail().withMessage('Email address is not valid')
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
  const new_activation = await new Activation({ _owner: user._id }).save();
  new_activation.sendEmail(); // Not waiting, email is sent asynchronously

  return res.send({ success: `Activation code sent to ${email}` });
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

app.get('/email_exists/:email', async (req, res) => {
  const email = req.params.email.toLowerCase();

  const user = await User.findOne({ email });
  return res.status(200).send({ exists: user !== null });
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

    const pending_activation = await Activation.findOne({ _owner: user._id });
    if (pending_activation !== null) {
      return res.status(400).send({ error: 'Account not activated' });
    }

    const access_token = await user.generateToken('access');
    const refresh_token = await user.generateToken('refresh');
    const decoded = jwt.verify(access_token, process.env.JWT_SECRET);

    return res.send({ access_token, refresh_token, expires: decoded.exp });
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

    return res.send({ access_token, refresh_token, expires: decoded.exp });
  } catch (e) {
    return res.status(400).send({ error: 'Invalid refresh token' });
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
      return res.status(200).send({ success: 'Password successfully changed' });
    }

    return res.status(400).send({ error: 'Incorrect old password' });
  } catch (e) {
    return res.status(400).send({ error: 'Error while changing password' });
  }
});

app.post('/logout', authenticate, async (req, res) => {
  try {
    await req.user.removeToken('access', req.token);
    return res.status(200).send({ success: 'Logged out' });
  } catch (e) {
    return res.status(400).send({ error: 'Error while logging out' });
  }
});

module.exports = app;

