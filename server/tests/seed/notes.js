const { ObjectID } = require('mongodb');

const { Note } = require('../../models/note');
const { seedUsers } = require('./users');

const noteOneId = new ObjectID();
const noteTwoId = new ObjectID();
const seedNotes = [{
  _id: noteOneId,
  _owner: seedUsers[0]._id,
  text: 'Dinaga is king',
}, {
  _id: noteTwoId,
  _owner: seedUsers[1]._id,
  text: 'Kazumaaaa Kiryu chaaaan!',
}];

const populateNotes = (done) => {
  Note.remove({}).then(() => {
    const noteOne = new Note(seedNotes[0]).save();
    const noteTwo = new Note(seedNotes[1]).save();

    return Promise.all([noteOne, noteTwo]);
  }).then(() => done());
};

module.exports = {
  seedNotes,
  populateNotes,
};
