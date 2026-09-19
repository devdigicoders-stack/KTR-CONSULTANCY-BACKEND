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

  // Co-Applicant (Optional)
  hasCoApplicant: { type: Boolean, default: false },
  coApplicant: {
    fullName: { type: String },
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

  // Application Status
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
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
    fileUrl: { type: String, required: true },
    category: { type: String, default: 'Document' },
    uploadedAt: { type: Date, default: Date.now },
    uploadedByName: { type: String }
  }],

  // Custom User/Staff Folders for Client
  customFolders: [{
    folderName: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    createdByName: { type: String },
    createdAt: { type: Date, default: Date.now },
    documents: [{
      name: { type: String, required: true },
      fileUrl: { type: String, required: true },
      category: { type: String, default: 'Custom File' },
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
