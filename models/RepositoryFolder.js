const mongoose = require('mongoose');

const repositoryFolderSchema = new mongoose.Schema({
  folderName: {
    type: String,
    required: true,
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

// Compound index for uniqueness per scope and user (for private) or global (for common)
repositoryFolderSchema.index({ folderName: 1, scope: 1, createdBy: 1 }, { unique: true });

module.exports = mongoose.model('RepositoryFolder', repositoryFolderSchema);
