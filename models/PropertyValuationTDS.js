const mongoose = require('mongoose');

const propertyValuationTDSSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true
  },
  serviceType: {
    type: String,
    enum: [
      'Property Valuation for Income Tax',
      'Property TDS Filing (Form 26QB)',
      'Both Valuation & TDS Services'
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
  email: {
    type: String,
    trim: true
  },
  pan: {
    type: String,
    trim: true,
    uppercase: true
  },
  propertyAddress: {
    type: String,
    trim: true
  },
  transactionValue: {
    type: String,
    trim: true
  },
  transactionDate: {
    type: String,
    trim: true
  },
  transactionType: {
    type: String,
    enum: ['Buyer (Purchased)', 'Seller (Sold)', 'Planning to Buy', 'Planning to Sell', 'Other'],
    default: 'Buyer (Purchased)'
  },
  deedDocument: {
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
    enum: ['New', 'Under Review', 'Valuer Assigned', 'TDS In Progress', 'Completed', 'Cancelled'],
    default: 'New'
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PropertyValuationTDS', propertyValuationTDSSchema);
