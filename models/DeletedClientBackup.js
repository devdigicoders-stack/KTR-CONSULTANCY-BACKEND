const mongoose = require('mongoose');

const deletedClientBackupSchema = new mongoose.Schema({
  originalClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile',
    required: true,
    index: true
  },
  // Key indexing fields for fast search in Super Admin portal
  fullName: { type: String, required: true, index: true },
  mobile: { type: String, index: true },
  email: { type: String },
  panNumber: { type: String, index: true },
  aadhaarNumber: { type: String },
  occupation: { type: String },
  loanAmount: { type: Number },
  caseType: { type: String },
  status: { type: String },

  // Complete snapshot of all client data at the moment of deletion
  clientSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Snapshots of associated data
  relatedCreditInfo: {
    type: mongoose.Schema.Types.Mixed
  },
  relatedCibilReports: [{
    type: mongoose.Schema.Types.Mixed
  }],

  // Deletion metadata & Audit Trail
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  deletedByName: {
    type: String,
    default: 'Staff/Admin'
  },
  deletedByRole: {
    type: String,
    default: 'staff'
  },
  deletedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  deletionReason: {
    type: String,
    default: 'Deleted via Staff Portal'
  },

  // Restoration tracking
  restored: {
    type: Boolean,
    default: false,
    index: true
  },
  restoredAt: {
    type: Date
  },
  restoredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  restoredByName: {
    type: String
  },
  restorationNotes: {
    type: String
  },

  // Audit history log of all operations on this backup
  auditTrail: [{
    action: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    actorName: { type: String },
    actorRole: { type: String },
    details: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Compound text search index for fast multi-field search by Super Admin
deletedClientBackupSchema.index({
  fullName: 'text',
  mobile: 'text',
  panNumber: 'text',
  deletedByName: 'text',
  deletionReason: 'text'
});

module.exports = mongoose.model('DeletedClientBackup', deletedClientBackupSchema);
