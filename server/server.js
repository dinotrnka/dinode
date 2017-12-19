require('./config/config');
require('./db/mongoose');

const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./controllers');

const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());
app.use('/api/v1', routes);
app.listen(port, () => {
  console.log(`Started on port ${port}.`);
});

module.exports = { app };
