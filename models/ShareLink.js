const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile',
    required: true,
    index: true
  },
  documents: [{
    type: String
  }],
  createdByName: {
    type: String,
    default: 'Staff'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 365 // 1 year auto-expiry
  }
});

module.exports = mongoose.model('ShareLink', shareLinkSchema);
