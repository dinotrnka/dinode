const express = require('express');
const _ = require('lodash');
const { check, validationResult } = require('express-validator/check');

const { Note } = require('../models/note');

const app = express();

app.post('/', [
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
    res.status(400).send({ error: 'Error while creating note' });
  }
});

module.exports = app;

