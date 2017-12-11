const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

require('./db/mongoose');
const { User } = require('./models/user');

const app = express();
const port = 3001;

app.use(bodyParser.json());

app.listen(port, () => {
  console.log(`Started on port ${port}.`);
});

app.post('/register', async (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);
  const user = new User(body);

  try {
    const emailTaken = await User.findOne({ email: user.email });
    if (emailTaken) {
      throw new Error(`User with email ${user.email} already exists`);
    }

    await user.save();
    res.send(body);
  } catch (e) {
    let errorMessage;

    if (e.errors && e.errors.email && e.errors.email.message) {
      errorMessage = e.errors.email.message;
    } else if (e.errors && e.errors.password && e.errors.password.message) {
      errorMessage = e.errors.password.message;
    } else if (e.message) {
      errorMessage = e.message;
    } else {
      errorMessage = 'Error while creating user';
    }

    // res.status(400).send(e);
    res.status(400).send({ errorMessage });
  }
});

app.post('/login', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);
  res.send(body);
});

module.exports = { app };
