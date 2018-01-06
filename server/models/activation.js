const mongoose = require('mongoose');

const { makeRandomString, makeTimestamp } = require('../utils');
const { ACTIVATION_CODE_LIFETIME } = require('../config/constants');

const ActivationSchema = new mongoose.Schema({
  _owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  code: {
    type: String,
  },
}, { usePushEach: true });

ActivationSchema.pre('save', function (next) {
  this.code = `${makeRandomString(30)}_${makeTimestamp(ACTIVATION_CODE_LIFETIME)}`;
  next();
});

const Activation = mongoose.model('Activation', ActivationSchema);

module.exports = { Activation };
