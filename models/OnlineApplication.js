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
    required: true,
  },
  maritalStatus: {
    type: String,
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
