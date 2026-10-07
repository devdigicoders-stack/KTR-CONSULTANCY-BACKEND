const mongoose = require('mongoose');

const formTemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    default: 'General',
    enum: ['General', 'Salaried Loans', 'Business Loans', 'Home & Property', 'Balance Transfer & Top-Up', 'KYC & Verification', 'Custom']
  },
  type: {
    type: String,
    enum: ['data_form', 'doc_request'],
    default: 'data_form'
  },
  fields: [
    {
      id: { type: String },
      label: { type: String, required: true },
      type: { type: String, default: 'text' }, // text, number, date, textarea, select, file
      options: [{ type: String }],
      required: { type: Boolean, default: false },
      mappedField: { type: String, default: '' },
      mappedDocType: { type: String, default: '' }
    }
  ],
  requestedDocs: [
    {
      name: { type: String, required: true },
      docType: { type: String, default: 'other' },
      required: { type: Boolean, default: false },
      description: { type: String, default: '' }
    }
  ],
  isDefault: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdByName: {
    type: String,
    default: 'System'
  }
}, { timestamps: true });

module.exports = mongoose.model('FormTemplate', formTemplateSchema);
