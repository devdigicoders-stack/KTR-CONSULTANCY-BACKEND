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
  order: { type: Number, default: 0 }
}, { _id: false });

const caseDocumentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  fileTitle: { type: String },
  fileUrl: { type: String, required: true },
  fileType: { type: String, default: 'document' },
  fileSize: { type: Number, default: 0 },
  category: { type: String, default: 'Property Legal' },
  notes: { type: String, default: '' },
  order: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
  uploadedByName: { type: String, default: 'Staff' }
}, { _id: false });

const bankerQuerySchema = new mongoose.Schema({
  bankerName: { type: String, default: 'Banker' },
  bankName: { type: String, default: 'Partner Bank' },
  bankerPhone: { type: String, default: '' },
  bankerEmail: { type: String, default: '' },
  queryText: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Answered', 'Resolved'], 
    default: 'Pending' 
  },
  staffReply: { type: String, default: '' },
  repliedAt: { type: Date },
  repliedByName: { type: String },
  isPhoneQuery: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const caseStudySchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
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
  propertyLocation: {
    type: String,
    default: '',
    trim: true
  },
  propertyType: {
    type: String,
    enum: ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Plot / Land', 'Mixed Use', 'Other'],
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
  discussionNotes: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Active Discussion', 'Banker Review', 'Resolved', 'Closed'],
    default: 'Active Discussion'
  },
  // Configurable dynamic fields
  customFields: [customFieldSchema],
  // Associated Case Documents
  documents: [caseDocumentSchema],
  // Banker Queries (both raised from portal and recorded from phone calls)
  bankerQueries: [bankerQuerySchema],
  // AI Case Intelligence & Recommendations (Confidential - Internal Staff Only)
  aiIntelligence: {
    lastAnalyzedAt: { type: Date },
    summary: { type: String, default: '' },
    riskRating: { type: String, default: 'Moderate' },
    similarPastCases: [{
      caseNumber: String,
      title: String,
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
caseStudySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('CaseStudy', caseStudySchema);

