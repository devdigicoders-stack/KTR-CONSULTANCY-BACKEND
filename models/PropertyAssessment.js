const mongoose = require('mongoose');

const propertyAssessmentSchema = new mongoose.Schema({
  applicationId: { type: String, unique: true },
  serviceType: { 
    type: String, 
    enum: ['nagar-nigam', 'lda-map', 'map-estimate'],
    required: true 
  },
  customerDetails: {
    name: { type: String },
    mobile: { type: String, required: true },
    email: { type: String },
    dimensions: { type: String }
  },
  documents: {
    propertyPapers: { url: String, name: String },
    gpsPhotos: [{ url: String, name: String }],
    electricityBill: { url: String, name: String },
    ownerPhoto: { url: String, name: String },
    panCard: { url: String, name: String },
    aadhaarCard: { url: String, name: String },
    propertyPhoto: { url: String, name: String }
  },
  status: {
    type: String,
    enum: ['New', 'Processing', 'Completed', 'Rejected'],
    default: 'New'
  },
  remark: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PropertyAssessment', propertyAssessmentSchema);
