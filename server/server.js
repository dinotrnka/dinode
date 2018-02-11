require('./config/config');
require('./db/mongoose');

const express = require('express');
const body_parser = require('body-parser');
const file_upload = require('express-fileupload');

const routes = require('./controllers');

const app = express();
const port = process.env.PORT;

app.use(body_parser.json());
app.use(file_upload());
app.use('/api/v1', routes);
app.listen(port, () => {
  console.log(`Started on port ${port}.`);
});

module.exports = { app };
