const { ObjectID } = require('mongodb');

const { Note } = require('../../models/note');

const noteOneId = new ObjectID();
const noteTwoId = new ObjectID();
const seedNotes = [{
  _id: noteOneId,
  text: 'I rock!',
}, {
  _id: noteTwoId,
  text: 'You are da man!',
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
