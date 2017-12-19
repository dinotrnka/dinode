require('./config/config');
require('./db/mongoose');

const express = require('express');
const bodyParser = require('body-parser');

const usersController = require('./controllers/users');
const notesController = require('./controllers/notes');

const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());
app.use('/users', usersController);
app.use('/notes', notesController);
app.listen(port, () => {
  console.log(`Started on port ${port}.`);
});

module.exports = { app };
