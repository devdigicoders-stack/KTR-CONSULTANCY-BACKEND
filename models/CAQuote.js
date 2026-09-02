const mongoose = require('mongoose');

const caQuoteSchema = new mongoose.Schema({
  quoteId: { type: String, unique: true },
  serviceType: { type: String, required: true },
  fullName: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String },
  city: { type: String },
  businessName: { type: String },
  businessConstitution: { type: String },
  message: { type: String },
  documents: [{
    filename: String,
    originalName: String,
    path: String,
    url: String,
    size: Number,
    mimetype: String
  }],
  status: {
    type: String,
    enum: ['New', 'In Discussion', 'Quote Sent', 'Closed'],
    default: 'New'
  },
  remark: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CAQuote', caQuoteSchema);
