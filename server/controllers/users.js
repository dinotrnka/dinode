const express = require('express');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator/check');

const { User } = require('../models/user');

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
    res.send(body);
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

    const token = await user.generateAuthToken();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.send({ access_token: token, expires: decoded.exp });
  } catch (e) {
    // res.status(400).send({ error: e.message });
    res.status(400).send({ error: 'Invalid credentials' });
  }
});

module.exports = app;

