const mongoose = require('mongoose');

const onlineApplicationSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    required: true,
  },
  otherServiceType: {
    type: String,
  },
  applicationId: {
    type: String,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  dob: {
    type: String,
  },
  gender: {
    type: String,
  },
  maritalStatus: {
    type: String,
  },
  propertyAddress: {
    type: String,
  },
  approxPropertyValue: {
    type: String,
  },
  hasExistingLoan: {
    type: String, // 'Yes' or 'No'
  },
  existingEmiAmount: {
    type: String,
  },
  specificLoanDetails: {
    type: mongoose.Schema.Types.Mixed,
  },
  residentialCity: {
    type: String,
  },
  preferredBranch: {
    type: String,
  },
  source: {
    type: String, // How did you hear about us?
  },
  loanAmount: {
    type: String,
  },
  purpose: {
    type: String,
    required: true,
  },
  otherPurpose: {
    type: String,
  },
  employmentType: {
    type: String,
    required: true,
  },
  message: {
    type: String,
  },
  documents: [{
    filename: String,
    originalName: String,
    path: String,
    url: String,
    size: Number,
    mimetype: String
  }],
  remark: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('OnlineApplication', onlineApplicationSchema);
