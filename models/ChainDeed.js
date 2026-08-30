const mongoose = require('mongoose');

const chainDeedSchema = new mongoose.Schema({
  applicationId: { type: String, unique: true },
  deedType: { 
    type: String, 
    enum: ['after2016', 'before2016', 'recordRoom'],
    required: true 
  },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String },
  documentUrl: { type: String, required: true },
  documentName: { type: String, required: true },
  paymentId: { type: String, required: true },
  amountPaid: { type: Number, required: true },
  status: {
    type: String,
    enum: ['New', 'Processing', 'Completed', 'Rejected'],
    default: 'New'
  },
  remark: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChainDeed', chainDeedSchema);
