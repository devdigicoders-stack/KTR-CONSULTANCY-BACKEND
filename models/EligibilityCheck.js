const mongoose = require('mongoose');

const eligibilityCheckSchema = new mongoose.Schema({
  caseId: {
    type: String,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  propertyName: {
    type: String,
    default: ''
  },
  propertyType: {
    type: String,
    required: true
  },
  loanRequirement: {
    type: String,
    required: true
  },
  propertyStatus: {
    type: String,
    default: ''
  },
  existingDocs: {
    type: String,
    default: ''
  },
  additionalDetails: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  remark: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EligibilityCheck', eligibilityCheckSchema);
