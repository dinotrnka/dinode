const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { User } = require('../../models/user');
const { ACCESS_TOKEN_LIFETIME, REFRESH_TOKEN_LIFETIME } = require('../../config/constants');

const user_one_id = new ObjectID();
const user_two_id = new ObjectID();

const user_one_access_token = {
  type: 'access',
  token: jwt
    .sign(
      { user_id: user_one_id },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_LIFETIME },
    ).toString(),
};

const user_one_refresh_token = {
  type: 'refresh',
  token: jwt
    .sign(
      { user_id: user_one_id },
      process.env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_LIFETIME },
    ).toString(),
};

const user_two_access_token = {
  type: 'access',
  token: jwt
    .sign(
      { user_id: user_two_id },
      process.env.JWT_SECRET,
      { expiresIn: 0 }, // Simulating expired token
    ).toString(),
};

const user_two_refresh_token = {
  type: 'refresh',
  token: jwt
    .sign(
      { user_id: user_two_id },
      process.env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_LIFETIME },
    ).toString(),
};

const seed_users = [{
  _id: user_one_id,
  email: 'dinaga@gmail.com',
  password: 'dinaga123',
  tokens: [user_one_access_token, user_one_refresh_token],
}, {
  _id: user_two_id,
  email: 'kiryu@gmail.com',
  password: 'kiryu123',
  tokens: [user_two_access_token, user_two_refresh_token],
}];

function populateUsers(done) {
  User.remove({}).then(() => {
    const user_one = new User(seed_users[0]).save();
    const user_two = new User(seed_users[1]).save();

    return Promise.all([user_one, user_two]);
  }).then(() => done());
}

module.exports = {
  seed_users,
  populateUsers,
};
