const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  _owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  text: {
    type: String,
    required: true,
    minlength: 1,
  },
}, { usePushEach: true });

const Note = mongoose.model('Note', NoteSchema);

module.exports = { Note };
