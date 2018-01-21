const mongoose = require('mongoose');

const { User } = require('./user');

const FacebookSchema = new mongoose.Schema({
  _owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
}, { usePushEach: true });

const Facebook = mongoose.model('Facebook', FacebookSchema);

module.exports = { Facebook };
