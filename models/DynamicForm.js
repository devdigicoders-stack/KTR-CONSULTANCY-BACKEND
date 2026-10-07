const mongoose = require('mongoose');

const dynamicFormSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['data_form', 'doc_request'],
    default: 'data_form',
    required: true
  },
  linkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FormTemplate'
  },
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
  clientType: {
    type: String,
    enum: ['existing', 'new'],
    default: 'new'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile'
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientMobile: {
    type: String,
    default: '',
    trim: true
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
  status: {
    type: String,
    enum: ['active', 'submitted', 'closed'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdByName: {
    type: String,
    default: 'Staff'
  },
  submissions: [
    {
      submittedAt: { type: Date, default: Date.now },
      clientData: { type: mongoose.Schema.Types.Mixed },
      uploadedFiles: [
        {
          name: { type: String },
          fileUrl: { type: String },
          docType: { type: String },
          notes: { type: String }
        }
      ],
      notes: { type: String }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('DynamicForm', dynamicFormSchema);
