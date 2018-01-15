const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const { User } = require('./user');

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

ActivationSchema.methods.isValid = async function () {
  const activation = this;

  const now = Math.floor(Date.now() / 1000);
  const activation_expiration = activation.code.split('_')[1];

  return new Promise(resolve => resolve(now < activation_expiration));
};

ActivationSchema.methods.sendEmail = async function () {
  const activation = this;

  const user = await User.findById(activation._owner);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.DINODEAPI_GMAIL_USERNAME,
      pass: process.env.DINODEAPI_GMAIL_PASSWORD,
    },
  });

  const mail_options = {
    to: user.email,
    subject: 'Welcome to Dinode',
    text: `This is your activation code: ${activation.code}`,
  };

  return transporter.sendMail(mail_options);
};

ActivationSchema.pre('save', function (next) {
  if (!this.code) {
    // If code is not provided (default case), it is generated with current timestamp
    this.code = `${makeRandomString(30)}_${makeTimestamp(ACTIVATION_CODE_LIFETIME)}`;
  }
  next();
});

const Activation = mongoose.model('Activation', ActivationSchema);

module.exports = { Activation };
