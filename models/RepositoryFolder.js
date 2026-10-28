const mongoose = require('mongoose');

const repositoryFolderSchema = new mongoose.Schema({
  folderName: {
    type: String,
    required: true,
    trim: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepositoryFolder',
    default: null
  },
  parentFolderName: {
    type: String,
    default: null,
    trim: true
  },
  scope: {
    type: String,
    enum: ['common', 'private'],
    default: 'common'
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
  description: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Compound index for uniqueness per folder, parent, scope and user
repositoryFolderSchema.index({ folderName: 1, parentFolderName: 1, scope: 1, createdBy: 1 });

module.exports = mongoose.model('RepositoryFolder', repositoryFolderSchema);
