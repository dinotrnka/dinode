require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const { check, validationResult } = require('express-validator/check');

require('./db/mongoose');
const { User } = require('./models/user');
const { Note } = require('./models/note');

const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());

app.listen(port, () => {
  console.log(`Started on port ${port}.`);
});

app.post('/users/register', [
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
    res.status(400).send({ errorMessage: 'Error while creating user' });
  }
});

app.post('/users/login', (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.send({ errorMessage: errors.array()[0].msg });
  }

  const body = _.pick(req.body, ['email', 'password']);
  res.send(body);
});

app.post('/notes', [
  check('text').exists().withMessage('Text is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ error: errors.array()[0].msg });
    }

    const body = _.pick(req.body, ['text']);
    const note = new Note(body);

    await note.save();
    res.send(body);
  } catch (e) {
    res.status(400).send({ errorMessage: 'Error while creating note' });
  }
});

module.exports = { app };
