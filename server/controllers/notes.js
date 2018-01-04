const express = require('express');
const _ = require('lodash');
const { check, validationResult } = require('express-validator/check');

const { authenticate } = require('../middleware/authenticate');
const { Note } = require('../models/note');

const app = express();

app.post('/', authenticate, [
  check('text').exists().withMessage('Text is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ error: errors.array()[0].msg });
    }

    const body = _.pick(req.body, ['text']);
    const note = new Note({
      _owner: req.user._id,
      text: body.text,
    });

    await note.save();
    res.send(body);
  } catch (e) {
    res.status(400).send({ error: 'Error while creating note' });
  }
});

module.exports = app;

