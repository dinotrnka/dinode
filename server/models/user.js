const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
  },
}, { usePushEach: true });

const User = mongoose.model('User', UserSchema);

module.exports = { User };
