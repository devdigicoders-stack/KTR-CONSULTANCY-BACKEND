const DynamicForm = require('../models/DynamicForm');
const ClientProfile = require('../models/ClientProfile');
const mongoose = require('mongoose');
const path = require('path');

// Helper to generate short unique Link ID
const generateLinkId = (prefix = 'ktr') => {
  return `${prefix}_` + Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
};

// @desc    Create new dynamic form or document request link
// @route   POST /api/forms/create
// @access  Private (Staff/Admin)
exports.createForm = async (req, res) => {
  try {
    const {
      type = 'data_form',
      title,
      description,
      clientType = 'new',
      clientId,
      clientName,
      clientMobile,
      fields = [],
      requestedDocs = []
    } = req.body;

    if (!title || !clientName) {
      return res.status(400).json({ success: false, message: 'Title and Client Name are required.' });
    }

    let existingClient = null;
    if (clientType === 'existing' && clientId) {
      existingClient = await ClientProfile.findById(clientId);
    }

    const linkId = generateLinkId(type === 'doc_request' ? 'doc' : 'form');

    const form = await DynamicForm.create({
      type,
      linkId,
      title: title.trim(),
      description: description ? description.trim() : '',
      clientType,
      clientId: existingClient ? existingClient._id : null,
      clientName: clientName.trim(),
      clientMobile: (clientMobile || existingClient?.mobile || '').trim(),
      fields: Array.isArray(fields) ? fields : [],
      requestedDocs: Array.isArray(requestedDocs) ? requestedDocs : [],
      status: 'active',
      createdBy: req.adminId,
      createdByName: req.user?.name || 'Staff'
    });

    res.status(201).json({
      success: true,
      message: `${type === 'doc_request' ? 'Document Request' : 'Form'} link generated successfully`,
      data: form
    });
  } catch (error) {
    console.error('Create Form Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get all created forms for logged in staff / admin
// @route   GET /api/forms/my-forms
// @access  Private (Staff/Admin)
exports.getMyForms = async (req, res) => {
  try {
    const { type } = req.query;
    const query = {};

    if (type) query.type = type;

    if (req.user?.role !== 'admin') {
      query.createdBy = req.adminId;
    }

    const forms = await DynamicForm.find(query)
      .populate('clientId', 'fullName mobile applicationId status')
      .sort({ createdAt: -1 });

    res.json({ success: true, forms });
  } catch (error) {
    console.error('Get My Forms Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get public form by linkId (Public for client submission)
// @route   GET /api/forms/public/:linkId
// @access  Public
exports.getPublicForm = async (req, res) => {
  try {
    const { linkId } = req.params;
    const form = await DynamicForm.findOne({ linkId }).populate('clientId', 'fullName mobile applicationId');

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form or Document Request link is invalid or expired.' });
    }

    res.json({ success: true, data: form });
  } catch (error) {
    console.error('Get Public Form Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Submit public form or upload requested documents
// @route   POST /api/forms/public/:linkId/submit
// @access  Public
exports.submitPublicForm = async (req, res) => {
  try {
    const { linkId } = req.params;
    const form = await DynamicForm.findOne({ linkId });

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found or link expired.' });
    }

    const files = req.files || {};
    const bodyData = req.body || {};

    // Helper to sanitize uploaded file path
    const getUploadUrl = (fileArray) => {
      if (!fileArray || !fileArray.length) return null;
      return `/uploads/${fileArray[0].filename}`;
    };

    const uploadedList = [];
    const docFieldUpdates = {};

    // Process all uploaded files
    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(f => {
          const docType = f.fieldname || 'other';
          const fileUrl = `/uploads/${f.filename}`;
          uploadedList.push({
            name: f.originalname.replace(/\.[^/.]+$/, ''),
            fileUrl,
            docType,
            notes: `Submitted via link ${form.title}`
          });
        });
      } else {
        Object.keys(req.files).forEach(fieldName => {
          const fList = req.files[fieldName];
          fList.forEach(f => {
            const fileUrl = `/uploads/${f.filename}`;
            uploadedList.push({
              name: f.originalname.replace(/\.[^/.]+$/, ''),
              fileUrl,
              docType: fieldName,
              notes: `Submitted via link ${form.title}`
            });

            // Map standard document types directly to client profile fields
            const standardMap = {
              panCard: 'panCardUrl',
              panCardUrl: 'panCardUrl',
              aadhaar: 'aadhaarUrl',
              aadhaarUrl: 'aadhaarUrl',
              salarySlip: 'salarySlipUrl',
              salarySlipUrl: 'salarySlipUrl',
              bankStatement: 'bankStatementUrl',
              bankStatementUrl: 'bankStatementUrl',
              itr: 'itrUrl',
              itrUrl: 'itrUrl',
              photo: 'photoUrl',
              photoUrl: 'photoUrl',
              propertyDoc: 'propertyDocUrl',
              propertyDocUrl: 'propertyDocUrl',
              idProof: 'idProofUrl',
              idProofUrl: 'idProofUrl',
              addressProof: 'addressProofUrl',
              addressProofUrl: 'addressProofUrl'
            };
            if (standardMap[fieldName]) {
              docFieldUpdates[standardMap[fieldName]] = fileUrl;
            }
          });
        });
      }
    }

    let client = null;

    if (form.clientType === 'existing' && form.clientId) {
      client = await ClientProfile.findById(form.clientId);
    } else if (bodyData.mobile || form.clientMobile) {
      const searchMobile = (bodyData.mobile || form.clientMobile).trim();
      if (searchMobile) {
        client = await ClientProfile.findOne({ mobile: searchMobile });
      }
    }

    if (client) {
      // 1. Existing Client: Update fields & append documents
      if (bodyData.fullName) client.fullName = bodyData.fullName.trim();
      if (bodyData.fatherName) client.fatherName = bodyData.fatherName.trim();
      if (bodyData.motherName) client.motherName = bodyData.motherName.trim();
      if (bodyData.dob) client.dob = bodyData.dob;
      if (bodyData.occupation) client.occupation = bodyData.occupation.trim();
      if (bodyData.addressLine1 || bodyData.address) client.addressLine1 = (bodyData.addressLine1 || bodyData.address).trim();
      if (bodyData.panNumber) client.panNumber = bodyData.panNumber.trim().toUpperCase();
      if (bodyData.aadhaarNumber) client.aadhaarNumber = bodyData.aadhaarNumber.trim();
      if (bodyData.loanAmount) client.loanAmount = parseFloat(bodyData.loanAmount) || client.loanAmount;
      if (bodyData.caseType) client.caseType = bodyData.caseType.trim();

      // Apply standard doc updates
      Object.assign(client, docFieldUpdates);

      // Append new custom documents
      if (!client.customDocuments) client.customDocuments = [];
      uploadedList.forEach(up => {
        client.customDocuments.push({
          name: up.name,
          fileUrl: up.fileUrl,
          docType: up.docType || 'General Document',
          category: 'Client Submission',
          notes: up.notes,
          uploadedAt: new Date(),
          uploadedByName: 'Client (Online Form)'
        });
      });

      // Add audit edit entry
      if (!client.editHistory) client.editHistory = [];
      client.editHistory.push({
        editedAt: new Date(),
        editorName: 'Client (Public Submission)',
        editorRole: 'client',
        changesSummary: `Client submitted form data / documents via link: ${form.title}`
      });

      await client.save();
    } else {
      // 2. New Client: Automatically register new client profile
      const newClientData = {
        fullName: bodyData.fullName || form.clientName || 'New Client',
        mobile: bodyData.mobile || form.clientMobile || '',
        email: bodyData.email || '',
        fatherName: bodyData.fatherName || '',
        motherName: bodyData.motherName || '',
        dob: bodyData.dob || '',
        occupation: bodyData.occupation || 'Self-Employed / Salaried',
        addressLine1: bodyData.addressLine1 || bodyData.address || '',
        panNumber: (bodyData.panNumber || '').toUpperCase(),
        aadhaarNumber: bodyData.aadhaarNumber || '',
        loanAmount: parseFloat(bodyData.loanAmount) || 0,
        caseType: bodyData.caseType || (form.type === 'doc_request' ? 'Document Verification' : 'Client Onboarding'),
        status: 'Pending',
        createdBy: form.createdBy,
        addedBy: form.createdBy,
        ...docFieldUpdates,
        customDocuments: uploadedList.map(up => ({
          name: up.name,
          fileUrl: up.fileUrl,
          docType: up.docType || 'General Document',
          category: 'Client Submission',
          notes: up.notes,
          uploadedAt: new Date(),
          uploadedByName: 'Client (Online Form)'
        }))
      };

      client = await ClientProfile.create(newClientData);
      form.clientId = client._id;
    }

    // Record submission in DynamicForm
    form.submissions.push({
      submittedAt: new Date(),
      clientData: bodyData,
      uploadedFiles: uploadedList,
      notes: bodyData.notes || 'Successfully submitted by client'
    });
    form.status = 'submitted';
    await form.save();

    res.json({
      success: true,
      message: 'Your information and documents have been submitted successfully. Our team will verify them shortly.',
      clientName: client.fullName,
      applicationId: client.applicationId || client.refId || `KTR-${client._id.toString().substring(18).toUpperCase()}`
    });
  } catch (error) {
    console.error('Submit Public Form Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete dynamic form
// @route   DELETE /api/forms/:id
// @access  Private (Staff/Admin)
exports.deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await DynamicForm.findById(id);

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    if (req.user?.role !== 'admin' && form.createdBy.toString() !== req.adminId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await DynamicForm.findByIdAndDelete(id);

    res.json({ success: true, message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete Form Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
