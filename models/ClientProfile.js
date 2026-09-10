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
  otherDocs: [{ type: String }],

  // Application Status
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  adminRemarks: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ClientProfile', clientProfileSchema);
