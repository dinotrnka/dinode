const express = require('express');
const _ = require('lodash'); // eslint-disable-line more-naming-conventions/snake-case-variables
const { check, validationResult } = require('express-validator/check');
const AWS = require('aws-sdk');

const { authenticate } = require('../middleware/authenticate');
const { Note } = require('../models/note');

const app = express();

AWS.config.loadFromPath('server/config/aws.json');
const s3_bucket = new AWS.S3({ params: { Bucket: 'dinode/avatars' } });

app.post('/upload', async (req, res) => {
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }

  const { file } = req.files;

  console.log('FAJL', file);

  const image = { Key: file.name, Body: file.data };
  s3_bucket.putObject(image, (err, data) => {
    if (err) {
      console.log('Error uploading data: ', err);
      return res.send(err);
    }

    console.log('succesfully uploaded the image!');
    return res.send(data);
  });
});

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
    return res.send(body);
  } catch (e) {
    return res.status(400).send({ error: 'Error while creating note' });
  }
});

module.exports = app;

