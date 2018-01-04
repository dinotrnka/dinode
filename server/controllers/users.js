const express = require('express');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator/check');

const { User } = require('../models/user');
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
    res.send({ success: 'Registration successful' });
  } catch (e) {
    res.status(400).send({ error: 'Error while creating user' });
  }
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
    const user = await User.findByCredentials(body.email, body.password);

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
    res.status(400).send({ error: 'Invalid credentials' });
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

