require('./config/config');
require('./db/mongoose');

const express = require('express');
const body_parser = require('body-parser');
const routes = require('./controllers');

const app = express();
const port = process.env.PORT;
app.use(body_parser.json());
app.use('/api/v1', routes);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Started on port ${port}.`);
});

module.exports = { app };
