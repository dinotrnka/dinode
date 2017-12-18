const { ObjectID } = require('mongodb');

const { User } = require('../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const seedUsers = [{
  _id: userOneId,
  email: 'dinaga@gmail.com',
  password: 'dinaga123',
}, {
  _id: userTwoId,
  email: 'kiryu@gmail.com',
  password: 'kiryu123',
}];

const populateUsers = (done) => {
  User.remove({}).then(() => {
    const userOne = new User(seedUsers[0]).save();
    const userTwo = new User(seedUsers[1]).save();

    return Promise.all([userOne, userTwo]);
  }).then(() => done());
};

module.exports = { seedUsers, populateUsers };
