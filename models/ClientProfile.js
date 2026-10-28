const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  // Personal & Contact
  fullName: { type: String, required: true },
  dob: { type: Date },
  gender: { type: String },
  panNumber: { type: String },
  aadhaarNumber: { type: String },
  mobile: { type: String, required: true },
  email: { type: String },
  alternativeEmail: { type: String },
  motherName: { type: String },

  // Identity & Address
  idProofType: { type: String },
  idProofNumber: { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
  country: { type: String, default: 'India' },
  state: { type: String },
  city: { type: String },
  pincode: { type: String },

  // Additional Information
  occupation: { type: String, required: true },
  companyName: { type: String },
  designation: { type: String },
  annualIncome: { type: Number },
  sourceOfIncome: { type: String },
  businessType: { type: String },
  yearsInBusiness: { type: Number },
  website: { type: String },
  loanAmount: { type: Number },
  loanType: { type: String },
  caseType: { type: String },

  // Multiple Applicants (Applicant 1, Applicant 2, Applicant 3, etc.)
  applicants: [{
    fullName: { type: String, required: true },
    dob: { type: Date },
    age: { type: Number },
    gender: { type: String },
    mobile: { type: String },
    email: { type: String },
    motherName: { type: String },
    occupation: { type: String },
    panNumber: { type: String },
    aadhaarNumber: { type: String },
    addressLine1: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    relationship: { type: String, default: 'Applicant' },
    customFields: [{
      fieldName: { type: String },
      fieldValue: { type: String }
    }]
  }],

  // Co-Applicant (Legacy fallback)
  hasCoApplicant: { type: Boolean, default: false },
  coApplicant: {
    fullName: { type: String },
    dob: { type: Date },
    age: { type: Number },
    mobile: { type: String },
    occupation: { type: String },
    motherName: { type: String },
    panNumber: { type: String },
    aadhaarNumber: { type: String },
    addressLine1: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },

  // Reference (Optional)
  referredBy: { type: String },
  referrerMobile: { type: String },
  relationship: { type: String },
  notes: { type: String },
  caseNotes: { type: String },
  internalNotes: { type: String, default: '' },
  customFields: [{
    fieldName: { type: String, required: true },
    fieldValue: { type: String, default: '' }
  }],

  // Documents (URLs / File Paths)
  photoUrl: { type: String },
  idProofUrl: { type: String },
  addressProofUrl: { type: String },
  panCardUrl: { type: String },
  aadhaarUrl: { type: String },
  salarySlipUrl: { type: String },
  itrUrl: { type: String },
  form16Url: { type: String },
  bankStatementUrl: { type: String },
  propertyDocUrl: { type: String },
  otherDocUrl: { type: String },
  otherDocs: [{ type: String }],

  // Application Status (Standard or Custom Staff-Written Status)
  status: {
    type: String,
    default: 'Documents Pending',
    trim: true
  },

  // Visibility (Hidden from active list without deleting any data)
  isHidden: {
    type: Boolean,
    default: false,
    index: true
  },

  // Soft-Delete & Super Admin Recovery Tracking (Zero data loss)
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  deletedByName: { type: String },
  deletedByRole: { type: String },
  deletionReason: { type: String },
  restoredAt: { type: Date },
  restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  restoredByName: { type: String },

  // Custom Drag-and-Drop Display Ordering
  displayOrder: {
    type: Number,
    default: 0,
    index: true
  },

  // Continuous Pendency Tracking (Complete History)
  pendencies: [{
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'],
      default: 'Pending'
    },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    addedByName: { type: String },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    resolvedByName: { type: String },
    resolutionNotes: { type: String }
  }],

  // Standalone Named Custom Documents
  customDocuments: [{
    name: { type: String, required: true },
    fileTitle: { type: String },
    fileUrl: { type: String, required: true },
    docType: { type: String },
    category: { type: String, default: 'Document' },
    notes: { type: String, default: '' },
    password: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
    uploadedByName: { type: String }
  }],

  // Custom User/Staff Folders for Client
  customFolders: [{
    folderName: { type: String, required: true },
    parentFolderName: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    createdByName: { type: String },
    createdAt: { type: Date, default: Date.now },
    documents: [{
      name: { type: String, required: true },
      fileTitle: { type: String },
      fileUrl: { type: String, required: true },
      category: { type: String, default: 'Custom File' },
      notes: { type: String, default: '' },
      password: { type: String, default: '' },
      uploadedAt: { type: Date, default: Date.now },
      uploadedByName: { type: String }
    }]
  }],

  // Soft-deleted documents (Backup for Admin view)
  deletedDocuments: [{
    docType: { type: String },
    docName: { type: String },
    fileUrl: { type: String },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    deletedByName: { type: String },
    deletedAt: { type: Date, default: Date.now },
    reason: { type: String }
  }],

  // Custom document notes per document title / key
  documentNotes: {
    type: Map,
    of: String,
    default: () => new Map()
  },

  // Custom document passwords per document title / key
  documentPasswords: {
    type: Map,
    of: String,
    default: () => new Map()
  },

  // Custom document titles per fileUrl / docId / standard document key
  documentCustomTitles: {
    type: Map,
    of: String,
    default: () => new Map()
  },

  // Custom document serial order chosen by user
  documentOrder: [{ type: String }],

  // Banker Queries (Raised from Banker Portal)
  bankerQueries: [{
    queryText: { type: String, required: true },
    documentTitle: { type: String, default: 'General Case' },
    bankerName: { type: String },
    bankerDesignation: { type: String },
    bankName: { type: String },
    bankerMobile: { type: String },
    bankerEmail: { type: String },
    priority: {
      type: String,
      enum: ['Normal', 'High', 'Urgent'],
      default: 'Normal'
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'],
      default: 'Pending'
    },
    staffResponse: { type: String, default: '' },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    respondedByName: { type: String },
    respondedAt: { type: Date },
    // WhatsApp Automation Integration Readiness
    whatsappLogs: [{
      recipientType: { type: String, enum: ['Staff', 'Client', 'Banker'] },
      recipientMobile: { type: String },
      messageType: { type: String },
      status: { type: String, default: 'Logged' },
      sentAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  }],

  // Link Form Submissions History (Internal staff visibility only)
  formSubmissions: [{
    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'DynamicForm' },
    formTitle: { type: String, default: 'Client Data Collection Form' },
    formType: { type: String, default: 'data_form' },
    submittedAt: { type: Date, default: Date.now },
    submittedData: { type: mongoose.Schema.Types.Mixed },
    submittedFields: [{
      key: { type: String },
      label: { type: String },
      value: { type: mongoose.Schema.Types.Mixed }
    }],
    uploadedFiles: [{
      name: { type: String },
      fileUrl: { type: String },
      docType: { type: String },
      notes: { type: String, default: 'Link Submission' }
    }],
    sourceLabel: { type: String, default: 'Link Submission' },
    summaryText: { type: String, default: '' }
  }],

  // Audit Log / Edit History
  editHistory: [{
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    editorName: { type: String },
    editorRole: { type: String },
    action: { type: String },
    details: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ClientProfile', clientProfileSchema);
