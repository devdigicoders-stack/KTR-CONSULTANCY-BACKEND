const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  subject: { type: String, required: true },
  serviceInterested: { type: String },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['Unread', 'Read', 'Replied'],
    default: 'Unread'
  },
  remark: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Enquiry', enquirySchema);
