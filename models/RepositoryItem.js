const mongoose = require('mongoose');

const repositoryItemSchema = new mongoose.Schema({
  scope: {
    type: String,
    enum: ['common', 'private'],
    default: 'common',
    required: true
  },
  folderName: {
    type: String,
    required: true,
    trim: true,
    default: 'General'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    default: 'document'
  },
  fileSize: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdByName: {
    type: String,
    default: 'Staff'
  },
  targetStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

module.exports = mongoose.model('RepositoryItem', repositoryItemSchema);
