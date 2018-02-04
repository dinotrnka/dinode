const mongoose = require('mongoose');

const GoogleSchema = new mongoose.Schema({
  _owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  _google_id: {
    type: String,
    required: true,
  },
}, { usePushEach: true });

const Google = mongoose.model('Google', GoogleSchema);

module.exports = { Google };
