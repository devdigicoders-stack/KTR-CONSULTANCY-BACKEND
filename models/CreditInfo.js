const mongoose = require('mongoose');

const creditInfoSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile',
    required: true
  },
  creditLimit: {
    type: String,
    default: '0'
  },
  totalEnquiries: {
    type: String,
    default: '0'
  },
  currentBalance: {
    type: String,
    default: '0'
  },
  utilization: {
    type: String,
    default: '0%'
  },
  accounts: [{
    accountType: { type: String, required: true },
    lender: { type: String, required: true },
    number: { type: String, required: true },
    status: { type: String, required: true },
    openDate: { type: String, required: true },
    limit: { type: String, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('CreditInfo', creditInfoSchema);
