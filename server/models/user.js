const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { TOKEN_LIFETIME } = require('../config/constants');

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

UserSchema.methods.generateAuthToken = function () {
  const user = this;
  const type = 'auth';
  const userId = user._id.toHexString();
  const token = jwt
    .sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_LIFETIME },
    ).toString();
  user.tokens.push({ type, token });

  return user.save().then(() => token);
};

UserSchema.methods.removeToken = function (token) {
  const user = this;

  return user.update({
    $pull: {
      tokens: { token },
    },
  });
};

UserSchema.statics.findByToken = async function (token) {
  const User = this;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return User.findOne({
      _id: decoded.userId,
      'tokens.type': 'auth',
      'tokens.token': token,
    });
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      // Remove expired token from collection
      const { userId } = jwt.decode(token);
      const user = await User.findById(userId);
      if (user) {
        await user.removeToken(token);
        return Promise.reject(new Error('Access token expired'));
      }
    }

    return Promise.reject(new Error('Invalid access token'));
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
