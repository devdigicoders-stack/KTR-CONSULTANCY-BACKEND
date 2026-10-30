const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true, trim: true },
  value: { type: mongoose.Schema.Types.Mixed, default: '' },
  fieldType: { 
    type: String, 
    enum: ['text', 'textarea', 'number', 'currency', 'select', 'date', 'boolean'],
    default: 'text' 
  },
  options: [{ type: String }],
  isRequired: { type: Boolean, default: false },
  isConfidential: { type: Boolean, default: false }, // Internal staff only
  order: { type: Number, default: 0 }
}, { _id: false });

const caseDocumentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  fileTitle: { type: String },
  fileUrl: { type: String, required: true },
  fileType: { type: String, default: 'document' },
  fileSize: { type: Number, default: 0 },
  category: { type: String, default: 'General' },
  notes: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isConfidential: { type: Boolean, default: false },
  originalFileName: { type: String },
  replacedAt: { type: Date },
  replacedByName: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  uploadedByName: { type: String, default: 'Staff' }
}, { _id: false });

const queryAttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, default: 'document' },
  fileSize: { type: Number, default: 0 }
}, { _id: false });

const queryReplySchema = new mongoose.Schema({
  replyText: { type: String, required: true, trim: true },
  repliedByName: { type: String, default: 'Staff' },
  repliedByRole: { type: String, default: 'staff' },
  repliedAt: { type: Date, default: Date.now },
  attachments: [queryAttachmentSchema]
});

const caseDiscussionQuerySchema = new mongoose.Schema({
  authorName: { type: String, default: 'Banker / Expert' },
  authorRole: { 
    type: String, 
    enum: ['staff', 'banker', 'advocate', 'valuer', 'ca', 'client', 'other'],
    default: 'banker' 
  },
  source: {
    type: String,
    enum: ['portal', 'phone', 'email', 'meeting', 'internal'],
    default: 'portal'
  },
  authorPhone: { type: String, default: '' },
  authorEmail: { type: String, default: '' },
  bankName: { type: String, default: '' }, // For banker queries
  queryText: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['Open', 'In Progress', 'Awaiting Documents', 'Answered', 'Resolved', 'Closed'], 
    default: 'Open' 
  },
  attachments: [queryAttachmentSchema],
  replies: [queryReplySchema],
  // Legacy compatibility fields
  staffReply: { type: String, default: '' },
  repliedAt: { type: Date },
  repliedByName: { type: String },
  isPhoneQuery: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const editHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userName: { type: String, default: 'Staff' },
  action: { type: String, required: true },
  details: { type: String, default: '' },
  fieldName: { type: String },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const shareSettingsSchema = new mongoose.Schema({
  shareCode: { type: String, required: true },
  passcode: { type: String, default: '' },
  recipientName: { type: String, default: '' },
  recipientType: { 
    type: String, 
    enum: ['Banker', 'Advocate', 'Valuer', 'Chartered Accountant', 'Client', 'Other'],
    default: 'Banker' 
  },
  recipientPhone: { type: String, default: '' },
  recipientEmail: { type: String, default: '' },
  visibleSections: [{ type: String }], // 'fields', 'documents', 'queries'
  visibleFieldIds: [{ type: String }],
  visibleDocumentIds: [{ type: String }],
  allowQueries: { type: Boolean, default: true },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  viewsCount: { type: Number, default: 0 },
  lastViewedAt: { type: Date }
}, { _id: false });

const caseStudySchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  caseType: {
    type: String,
    enum: [
      'Property Legal Issues',
      'Title Verification',
      'Client Financial Profile',
      'Valuation',
      'Project Funding',
      'Loan Eligibility',
      'Documentation Problems',
      'Other'
    ],
    default: 'Property Legal Issues'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  clientName: {
    type: String,
    default: '',
    trim: true
  },
  // Generalized context / location
  propertyLocation: {
    type: String,
    default: '',
    trim: true
  },
  propertyType: {
    type: String,
    default: 'Residential'
  },
  estimatedLoanAmount: {
    type: Number,
    default: 0
  },
  caseIssue: {
    type: String,
    default: '',
    trim: true
  },
  legalComplications: {
    type: String,
    default: '',
    trim: true
  },
  // Strictly internal staff confidential notes
  discussionNotes: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: [
      'Open',
      'Under Discussion',
      'Awaiting Documents',
      'Awaiting Bank Response',
      'Resolved',
      'Closed',
      // Legacy enum values preserved for backwards compatibility
      'Draft',
      'Active Discussion',
      'Banker Review'
    ],
    default: 'Open'
  },
  resolutionSummary: {
    type: String,
    default: ''
  },
  closedAt: {
    type: Date
  },
  closedByName: {
    type: String
  },
  // Configurable dynamic fields
  customFields: [customFieldSchema],
  // Associated Case Documents
  documents: [caseDocumentSchema],
  // Case Discussions & Queries
  bankerQueries: [caseDiscussionQuerySchema],
  // Detailed audit trail / edit history
  editHistory: [editHistorySchema],
  // Granular Share Settings
  shareSettings: [shareSettingsSchema],
  // Primary shareCode for backward compatibility
  shareCode: {
    type: String,
    unique: true,
    index: true,
    sparse: true
  },
  isShareActive: {
    type: Boolean,
    default: true
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  // AI Case Intelligence & Recommendations (Confidential - Internal Staff Only)
  aiIntelligence: {
    lastAnalyzedAt: { type: Date },
    summary: { type: String, default: '' },
    riskRating: { type: String, default: 'Moderate' },
    similarPastCases: [{
      caseNumber: String,
      title: String,
      caseType: String,
      propertyType: String,
      outcome: String,
      solution: String
    }],
    anticipatedQueries: [{ type: String }],
    missingDocuments: [{ type: String }],
    suggestedBanks: [{
      bankName: String,
      loanType: String,
      matchScore: Number,
      reasoning: String
    }],
    recommendedSolutions: [{ type: String }],
    draftReplies: [{
      queryKey: String,
      suggestedReply: String,
      rationale: String
    }]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdByName: {
    type: String,
    default: 'Staff'
  }
}, { timestamps: true });

// Completely independent index - no link to loan applications
caseStudySchema.index({ status: 1, caseType: 1, createdAt: -1 });

module.exports = mongoose.model('CaseStudy', caseStudySchema);
