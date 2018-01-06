const { ObjectID } = require('mongodb');

const { Note } = require('../../models/note');
const { seed_users } = require('./users');

const note_one_id = new ObjectID();
const note_two_id = new ObjectID();

const seed_notes = [{
  _id: note_one_id,
  _owner: seed_users[0]._id,
  text: 'Dinaga is king',
}, {
  _id: note_two_id,
  _owner: seed_users[1]._id,
  text: 'Kazumaaaa Kiryu chaaaan!',
}];

const populate_notes = (done) => {
  Note.remove({}).then(() => {
    const note_one = new Note(seed_notes[0]).save();
    const note_two = new Note(seed_notes[1]).save();

    return Promise.all([note_one, note_two]);
  }).then(() => done());
};

module.exports = {
  seed_notes,
  populate_notes,
};
