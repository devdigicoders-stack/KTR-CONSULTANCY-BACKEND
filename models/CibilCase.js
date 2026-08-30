const mongoose = require('mongoose');

const cibilCaseSchema = new mongoose.Schema({
  caseId: { type: String, unique: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  pan: { type: String, required: true },
  panFileUrl: { type: String },
  panFileName: { type: String },
  lenderName: { type: String },
  disputedAmount: { type: String },
  accountNumber: { type: String },
  notes: { type: String },
  paymentId: { type: String },
  amountPaid: { type: Number, default: 1180 },
  status: {
    type: String,
    enum: ['New', 'Under Review', 'Resolved', 'Rejected'],
    default: 'New'
  },
  remark: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CibilCase', cibilCaseSchema);
