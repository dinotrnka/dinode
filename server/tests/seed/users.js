const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { User } = require('../../models/user');
const { ACCESS_TOKEN_LIFETIME, REFRESH_TOKEN_LIFETIME } = require('../../config/constants');

const user_0_id = new ObjectID();
const user_1_id = new ObjectID();
const user_2_id = new ObjectID();

const user_0_access_token = {
  type: 'access',
  token: jwt.sign(
    { user_id: user_0_id },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_LIFETIME },
  ).toString(),
};

const user_0_refresh_token = {
  type: 'refresh',
  token: jwt.sign(
    { user_id: user_0_id },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_LIFETIME },
  ).toString(),
};

const user_1_access_token = {
  type: 'access',
  token: jwt.sign(
    { user_id: user_1_id },
    process.env.JWT_SECRET,
    { expiresIn: 0 },
  ).toString(),
};

const user_1_refresh_token = {
  type: 'refresh',
  token: jwt.sign(
    { user_id: user_1_id },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_LIFETIME },
  ).toString(),
};

const seed_users = [{
  _id: user_0_id,
  email: 'dinaga@gmail.com',
  password: 'dinaga123',
  tokens: [user_0_access_token, user_0_refresh_token],
}, {
  _id: user_1_id,
  email: 'kiryu@gmail.com',
  password: 'kiryu123',
  tokens: [user_1_access_token, user_1_refresh_token],
}, {
  _id: user_2_id,
  email: 'unborn@gmail.com',
  password: 'unborn123',
  tokens: [],
}];

function populateUsers(done) {
  User.remove({}).then(() => {
    const user_0 = new User(seed_users[0]).save(); // Activated and logged in, valid session
    const user_1 = new User(seed_users[1]).save(); // Activated and logged in, session expired
    const user_2 = new User(seed_users[2]).save(); // Not activated yet

    return Promise.all([user_0, user_1, user_2]);
  }).then(() => done());
}

module.exports = {
  seed_users,
  populateUsers,
};
