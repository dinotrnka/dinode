const { ObjectID } = require('mongodb');

const { Note } = require('../../models/note');
const { seed_users } = require('./users');

const note_0_id = new ObjectID();
const note_1_id = new ObjectID();

const seed_notes = [{
  _id: note_0_id,
  _owner: seed_users[0]._id,
  text: 'Dinaga is king',
}, {
  _id: note_1_id,
  _owner: seed_users[1]._id,
  text: 'Kazumaaaa Kiryu chaaaan!',
}];

function populateNotes(done) {
  Note.remove({}).then(() => {
    const note_0 = new Note(seed_notes[0]).save();
    const note_1 = new Note(seed_notes[1]).save();

    return Promise.all([note_0, note_1]);
  }).then(() => done());
}

module.exports = {
  seed_notes,
  populateNotes,
};
