const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { User } = require('../../models/user');
const { ACCESS_TOKEN_LIFETIME, REFRESH_TOKEN_LIFETIME } = require('../../config/constants');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const userOneAccessToken = {
  type: 'access',
  token: jwt
    .sign(
      { userId: userOneId },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_LIFETIME },
    ).toString(),
};

const userOneRefreshToken = {
  type: 'refresh',
  token: jwt
    .sign(
      { userId: userOneId },
      process.env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_LIFETIME },
    ).toString(),
};

const userTwoAccessToken = {
  type: 'access',
  token: jwt
    .sign(
      { userId: userTwoId },
      process.env.JWT_SECRET,
      { expiresIn: 0 }, // Simulating expired token
    ).toString(),
};

const userTwoRefreshToken = {
  type: 'refresh',
  token: jwt
    .sign(
      { userId: userTwoId },
      process.env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_LIFETIME },
    ).toString(),
};

const seedUsers = [{
  _id: userOneId,
  email: 'dinaga@gmail.com',
  password: 'dinaga123',
  tokens: [userOneAccessToken, userOneRefreshToken],
}, {
  _id: userTwoId,
  email: 'kiryu@gmail.com',
  password: 'kiryu123',
  tokens: [userTwoAccessToken, userTwoRefreshToken],
}];

const populateUsers = (done) => {
  User.remove({}).then(() => {
    const userOne = new User(seedUsers[0]).save();
    const userTwo = new User(seedUsers[1]).save();

    return Promise.all([userOne, userTwo]);
  }).then(() => done());
};

module.exports = {
  seedUsers,
  populateUsers,
};
