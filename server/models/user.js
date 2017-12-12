const mongoose = require('mongoose');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique: true,
    validate: {
      validator: value => validator.isEmail(value),
      message: '{VALUE} is not a valid email',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
}, { usePushEach: true });

UserSchema.statics.emailExists = async function (email) {
  const User = this;

  const user = await User.findOne({ email });
  if (user) {
    return Promise.reject;
  }

  return Promise.resolve;
};

const User = mongoose.model('User', UserSchema);

module.exports = { User };
