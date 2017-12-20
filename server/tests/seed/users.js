const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { User } = require('../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const userOneToken = jwt
  .sign({ userOneId }, process.env.JWT_SECRET)
  .toString();
const userTwoToken = jwt
  .sign({ userTwoId }, process.env.JWT_SECRET)
  .toString();

const seedUsers = [{
  _id: userOneId,
  email: 'dinaga@gmail.com',
  password: 'dinaga123',
  tokens: [userOneToken],
}, {
  _id: userTwoId,
  email: 'kiryu@gmail.com',
  password: 'kiryu123',
  tokens: [userTwoToken],
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
