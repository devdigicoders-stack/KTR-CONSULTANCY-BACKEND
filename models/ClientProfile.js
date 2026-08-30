const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  // Personal & Contact
  fullName: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  panNumber: { type: String, required: true },
  aadhaarNumber: { type: String },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  alternativeEmail: { type: String },

  // Identity & Address
  idProofType: { type: String, required: true },
  idProofNumber: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  country: { type: String, default: 'India', required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },

  // Additional Information
  occupation: { type: String },
  companyName: { type: String },
  designation: { type: String },
  annualIncome: { type: Number },
  sourceOfIncome: { type: String },
  businessType: { type: String },
  yearsInBusiness: { type: Number },
  website: { type: String },

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
