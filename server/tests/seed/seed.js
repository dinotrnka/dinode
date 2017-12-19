const { ObjectID } = require('mongodb');

const { User } = require('../../models/user');
const { Note } = require('../../models/note');

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

const noteOneId = new ObjectID();
const noteTwoId = new ObjectID();
const seedNotes = [{
  _id: noteOneId,
  text: 'I rock!',
}, {
  _id: noteTwoId,
  text: 'You are da man!',
}];

const populateUsers = (done) => {
  User.remove({}).then(() => {
    const userOne = new User(seedUsers[0]).save();
    const userTwo = new User(seedUsers[1]).save();

    return Promise.all([userOne, userTwo]);
  }).then(() => done());
};

const populateNotes = (done) => {
  Note.remove({}).then(() => {
    const noteOne = new Note(seedNotes[0]).save();
    const noteTwo = new Note(seedNotes[1]).save();

    return Promise.all([noteOne, noteTwo]);
  }).then(() => done());
};

module.exports = {
  seedUsers,
  populateUsers,
  seedNotes,
  populateNotes,
};
