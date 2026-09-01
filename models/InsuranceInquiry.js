const mongoose = require('mongoose');

const insuranceInquirySchema = new mongoose.Schema({
  inquiryId: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: [
      'Life Insurance',
      'Health Insurance (Care Supreme)',
      'Vehicle Insurance',
      'Investment Plans',
      'ULIP Plans',
      'Market-Linked Plans',
      'Retirement & Pension Plans'
    ],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male'
  },
  vehicleNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  rcDocument: {
    filename: String,
    path: String,
    originalName: String
  },
  previousPolicyDocument: {
    filename: String,
    path: String,
    originalName: String
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Quote Shared', 'Policy Issued', 'Closed'],
    default: 'New'
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InsuranceInquiry', insuranceInquirySchema);
