const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ACCESS_TOKEN_LIFETIME, REFRESH_TOKEN_LIFETIME } = require('../config/constants');
const _ = require('lodash');

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
  tokens: [{
    type: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
  }],
}, { usePushEach: true });

UserSchema.methods.generateToken = function (type) {
  const user = this;
  let expiresIn = 0;

  if (type === 'access') {
    expiresIn = ACCESS_TOKEN_LIFETIME;
  } else if (type === 'refresh') {
    expiresIn = REFRESH_TOKEN_LIFETIME;
  } else {
    throw new Error();
  }

  const secret = process.env.JWT_SECRET;
  const userId = user._id.toHexString();
  const token = jwt.sign({ userId }, secret, { expiresIn }).toString();

  user.tokens.push({ type, token });
  return user.save().then(() => token);
};

UserSchema.methods.removeToken = function (type, token) {
  const user = this;

  return user.update({
    $pull: { tokens: { type, token } },
  });
};

UserSchema.methods.removeAllTokens = function () {
  const user = this;

  return user.update({
    $set: { tokens: [] },
  });
};

UserSchema.statics.findByToken = async function (type, token) {
  const User = this;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return User.findOne({
      _id: decoded.userId,
      tokens: { $elemMatch: { type, token } },
    });
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      // Remove expired token from collection
      const { userId } = jwt.decode(token);
      const user = await User.findById(userId);
      if (user) {
        await user.removeToken(type, token);

        const errorMessage = `${_.startCase(type)} token expired`;
        return Promise.reject(new Error(errorMessage));
      }
    }

    return Promise.reject(new Error(`Invalid ${type} token`));
  }
};

UserSchema.statics.findByCredentials = function (email, password) {
  const User = this;

  return User.findOne({ email }).then((user) => {
    if (!user) {
      return Promise.reject(new Error('User not found'));
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject(new Error('Wrong password'));
        }
      });
    });
  });
};

UserSchema.pre('save', function (next) {
  const user = this;

  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (error, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = { User };
