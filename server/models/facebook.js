const mongoose = require('mongoose');

const FacebookSchema = new mongoose.Schema({
  _owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  _facebook_id: {
    type: String,
    required: true,
  },
}, { usePushEach: true });

const Facebook = mongoose.model('Facebook', FacebookSchema);

module.exports = { Facebook };
