const DynamicForm = require('../models/DynamicForm');
const FormTemplate = require('../models/FormTemplate');
const ClientProfile = require('../models/ClientProfile');
const Admin = require('../models/Admin');
const mongoose = require('mongoose');
const path = require('path');

// Helper to calculate age from DOB (Formula: Current Year - Year of Birth)
const calculateAge = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const birthYear = d.getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  return age >= 0 ? age : null;
};

// Helper to generate short unique Link ID
const generateLinkId = (prefix = 'ktr') => {
  return `${prefix}_` + Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
};

// Default Reusable Master Templates
const DEFAULT_TEMPLATES = [
  {
    title: 'Salaried Loan Application & Intake Form',
    description: 'Comprehensive intake for salaried applicants including personal details, employment details, KYC and salary documents.',
    category: 'Salaried Loans',
    type: 'data_form',
    isDefault: true,
    fields: [
      { id: 'fullName', label: 'Primary Applicant Full Name', type: 'text', required: true, mappedField: 'fullName' },
      { id: 'mobile', label: 'Mobile Number', type: 'text', required: true, mappedField: 'mobile' },
      { id: 'email', label: 'Email Address', type: 'text', required: false, mappedField: 'email' },
      { id: 'fatherName', label: "Father's / Husband's Name", type: 'text', required: false, mappedField: 'fatherName' },
      { id: 'dob', label: 'Date of Birth (DOB)', type: 'date', required: false, mappedField: 'dob' },
      { id: 'occupation', label: 'Company / Employer Name & Designation', type: 'text', required: true, mappedField: 'occupation' },
      { id: 'loanAmount', label: 'Required Loan Amount (₹)', type: 'number', required: false, mappedField: 'loanAmount' },
      { id: 'caseType', label: 'Case Type (Personal Loan / Home Loan / BT)', type: 'text', required: false, mappedField: 'caseType' },
      { id: 'address', label: 'Current Residential Address', type: 'textarea', required: false, mappedField: 'addressLine1' },
      { id: 'panNumber', label: 'PAN Card Number', type: 'text', required: false, mappedField: 'panNumber' },
      { id: 'aadhaarNumber', label: 'Aadhaar Number', type: 'text', required: false, mappedField: 'aadhaarNumber' },
      { id: 'panCard', label: 'Upload PAN Card', type: 'file', required: false, mappedDocType: 'panCard' },
      { id: 'aadhaar', label: 'Upload Aadhaar Card (Front & Back)', type: 'file', required: false, mappedDocType: 'aadhaar' },
      { id: 'salarySlip', label: 'Latest 3 Months Salary Slips', type: 'file', required: false, mappedDocType: 'salarySlip' },
      { id: 'bankStatement', label: 'Latest 6 Months Salary Bank Statement', type: 'file', required: false, mappedDocType: 'bankStatement' },
      { id: 'form16', label: 'Form 16 / ITR of Last 2 Years', type: 'file', required: false, mappedDocType: 'form16' }
    ]
  },
  {
    title: 'Business & Self-Employed Loan Application',
    description: 'Master intake form for business owners, proprietors, and self-employed professionals.',
    category: 'Business Loans',
    type: 'data_form',
    isDefault: true,
    fields: [
      { id: 'fullName', label: 'Proprietor / Director Full Name', type: 'text', required: true, mappedField: 'fullName' },
      { id: 'mobile', label: 'Mobile Number', type: 'text', required: true, mappedField: 'mobile' },
      { id: 'email', label: 'Email Address', type: 'text', required: false, mappedField: 'email' },
      { id: 'dob', label: 'Date of Birth (DOB)', type: 'date', required: false, mappedField: 'dob' },
      { id: 'occupation', label: 'Business Name & Nature of Business', type: 'text', required: true, mappedField: 'occupation' },
      { id: 'loanAmount', label: 'Requested Loan Amount (₹)', type: 'number', required: false, mappedField: 'loanAmount' },
      { id: 'caseType', label: 'Loan Type (Business Loan / LAP / CC Limit)', type: 'text', required: false, mappedField: 'caseType' },
      { id: 'address', label: 'Business & Residential Address', type: 'textarea', required: false, mappedField: 'addressLine1' },
      { id: 'panNumber', label: 'PAN Card Number', type: 'text', required: false, mappedField: 'panNumber' },
      { id: 'aadhaarNumber', label: 'Aadhaar Number', type: 'text', required: false, mappedField: 'aadhaarNumber' },
      { id: 'panCard', label: 'Upload PAN Card', type: 'file', required: false, mappedDocType: 'panCard' },
      { id: 'aadhaar', label: 'Upload Aadhaar Card', type: 'file', required: false, mappedDocType: 'aadhaar' },
      { id: 'itr', label: 'Last 3 Years ITR with Computation', type: 'file', required: false, mappedDocType: 'itr' },
      { id: 'bankStatement', label: 'Latest 12 Months Current Account Statement', type: 'file', required: false, mappedDocType: 'bankStatement' },
      { id: 'gstDoc', label: 'GST Certificate & 3B Returns', type: 'file', required: false, mappedDocType: 'gst' }
    ]
  },
  {
    title: 'Home Loan & Property Verification Intake',
    description: 'Intake for Home Loan, Plot Purchase, Construction, and Property Mortgage cases.',
    category: 'Home & Property',
    type: 'data_form',
    isDefault: true,
    fields: [
      { id: 'fullName', label: 'Applicant Full Name', type: 'text', required: true, mappedField: 'fullName' },
      { id: 'mobile', label: 'Mobile Number', type: 'text', required: true, mappedField: 'mobile' },
      { id: 'dob', label: 'Date of Birth (DOB)', type: 'date', required: false, mappedField: 'dob' },
      { id: 'occupation', label: 'Profession / Occupation', type: 'text', required: true, mappedField: 'occupation' },
      { id: 'loanAmount', label: 'Required Home Loan Amount (₹)', type: 'number', required: false, mappedField: 'loanAmount' },
      { id: 'caseType', label: 'Property Type (Flat / Plot / House / Commercial)', type: 'text', required: false, mappedField: 'caseType' },
      { id: 'address', label: 'Property Address to be Financed', type: 'textarea', required: false, mappedField: 'addressLine1' },
      { id: 'panCard', label: 'Upload PAN Card', type: 'file', required: false, mappedDocType: 'panCard' },
      { id: 'aadhaar', label: 'Upload Aadhaar Card', type: 'file', required: false, mappedDocType: 'aadhaar' },
      { id: 'propertyDoc', label: 'Registry / Agreement to Sale / Title Deed', type: 'file', required: false, mappedDocType: 'propertyDoc' },
      { id: 'bankStatement', label: 'Latest 6 Months Bank Statement', type: 'file', required: false, mappedDocType: 'bankStatement' }
    ]
  },
  {
    title: 'Balance Transfer (BT) & Top-Up Request',
    description: 'Dedicated template for existing loan balance transfers from other banks with top-up requirements.',
    category: 'Balance Transfer & Top-Up',
    type: 'data_form',
    isDefault: true,
    fields: [
      { id: 'fullName', label: 'Client Full Name', type: 'text', required: true, mappedField: 'fullName' },
      { id: 'mobile', label: 'Mobile Number', type: 'text', required: true, mappedField: 'mobile' },
      { id: 'dob', label: 'Date of Birth (DOB)', type: 'date', required: false, mappedField: 'dob' },
      { id: 'occupation', label: 'Current Lender / Existing Bank Name', type: 'text', required: true, mappedField: 'occupation' },
      { id: 'loanAmount', label: 'Existing Outstanding Principal Amount (₹)', type: 'number', required: true, mappedField: 'loanAmount' },
      { id: 'caseType', label: 'Required Additional Top-Up Amount (₹)', type: 'text', required: false, mappedField: 'caseType' },
      { id: 'panCard', label: 'Upload PAN Card', type: 'file', required: false, mappedDocType: 'panCard' },
      { id: 'aadhaar', label: 'Upload Aadhaar Card', type: 'file', required: false, mappedDocType: 'aadhaar' },
      { id: 'propertyDoc', label: 'Latest Loan Sanction Letter / SOA (Statement of Account)', type: 'file', required: false, mappedDocType: 'propertyDoc' },
      { id: 'bankStatement', label: 'Latest 12 Months Banking Statement (Showing EMI clearance)', type: 'file', required: false, mappedDocType: 'bankStatement' }
    ]
  },
  {
    title: 'Standard KYC & Income Document Checklist',
    description: 'Master checklist for instant document collection via direct upload link.',
    category: 'KYC & Verification',
    type: 'doc_request',
    isDefault: true,
    requestedDocs: [
      { name: 'PAN Card', docType: 'panCard', required: true, description: 'Clear photo or PDF copy of PAN card' },
      { name: 'Aadhaar Card (Front & Back)', docType: 'aadhaar', required: true, description: 'Clear copy showing full address and DOB' },
      { name: 'Latest 3 Months Salary Slips', docType: 'salarySlip', required: false, description: 'For salaried applicants' },
      { name: 'Latest 6 Months Bank Statement', docType: 'bankStatement', required: true, description: 'Original bank PDF with transaction details' },
      { name: 'Last 2 Years ITR / Form 16', docType: 'itr', required: false, description: 'ITR acknowledgement with computation' },
      { name: 'Property Documents (Registry / Title Deed)', docType: 'propertyDoc', required: false, description: 'Property papers if applicable' },
      { name: 'Passport Size Photograph', docType: 'photo', required: false, description: 'Recent passport size photo' }
    ]
  }
];

// Helper to seed or get all templates
const ensureDefaultTemplates = async () => {
  try {
    const count = await FormTemplate.countDocuments();
    if (count === 0) {
      await FormTemplate.insertMany(DEFAULT_TEMPLATES);
    }
  } catch (e) {
    console.error('Error ensuring default templates:', e);
  }
};

// ----------------------------------------------------------------------
// TEMPLATE FORMS CRUD & "USE TEMPLATE"
// ----------------------------------------------------------------------

// @desc    Get all reusable Form Templates
// @route   GET /api/forms/templates
// @access  Private (Staff/Admin)
exports.getTemplates = async (req, res) => {
  try {
    await ensureDefaultTemplates();
    const { category, type } = req.query;
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (type) query.type = type;

    const templates = await FormTemplate.find(query).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Get Templates Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Create new reusable Master Form Template
// @route   POST /api/forms/templates
// @access  Private (Staff/Admin)
exports.createTemplate = async (req, res) => {
  try {
    const {
      title,
      description,
      category = 'Custom',
      type = 'data_form',
      fields = [],
      requestedDocs = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Template title is required' });
    }

    const template = await FormTemplate.create({
      title: title.trim(),
      description: (description || '').trim(),
      category: category || 'Custom',
      type: type || 'data_form',
      fields: Array.isArray(fields) ? fields : [],
      requestedDocs: Array.isArray(requestedDocs) ? requestedDocs : [],
      isDefault: false,
      createdBy: req.adminId,
      createdByName: req.user?.name || 'Staff'
    });

    res.status(201).json({
      success: true,
      message: 'Master template created successfully',
      template
    });
  } catch (error) {
    console.error('Create Template Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update existing Master Form Template
// @route   PUT /api/forms/templates/:id
// @access  Private (Staff/Admin)
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, type, fields, requestedDocs } = req.body;

    const template = await FormTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    if (title) template.title = title.trim();
    if (description !== undefined) template.description = description.trim();
    if (category) template.category = category;
    if (type) template.type = type;
    if (fields) template.fields = fields;
    if (requestedDocs) template.requestedDocs = requestedDocs;

    await template.save();

    res.json({
      success: true,
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    console.error('Update Template Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete custom Master Form Template
// @route   DELETE /api/forms/templates/:id
// @access  Private (Staff/Admin)
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await FormTemplate.findById(id);

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    if (template.isDefault && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'System default templates cannot be deleted.' });
    }

    await FormTemplate.findByIdAndDelete(id);

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete Template Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    "Use Template" -> Generate live form link for Existing Client or New Client
// @route   POST /api/forms/templates/:id/use
// @access  Private (Staff/Admin)
exports.useTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      clientType = 'new', // 'new' | 'existing'
      clientId,
      clientName,
      clientMobile,
      customNote
    } = req.body;

    const template = await FormTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    let existingClient = null;
    let finalClientName = clientName ? clientName.trim() : '';
    let finalClientMobile = clientMobile ? clientMobile.trim() : '';

    if (clientType === 'existing' && clientId) {
      existingClient = await ClientProfile.findById(clientId);
      if (existingClient) {
        finalClientName = existingClient.fullName;
        finalClientMobile = existingClient.mobile || finalClientMobile;
      }
    }

    if (!finalClientName) {
      finalClientName = 'New Client';
    }

    const linkId = generateLinkId(template.type === 'doc_request' ? 'doc' : 'form');

    const form = await DynamicForm.create({
      templateId: template._id,
      type: template.type || 'data_form',
      linkId,
      title: template.title,
      description: customNote ? customNote.trim() : template.description,
      clientType,
      clientId: existingClient ? existingClient._id : null,
      clientName: finalClientName,
      clientMobile: finalClientMobile,
      fields: template.fields || [],
      requestedDocs: template.requestedDocs || [],
      status: 'active',
      createdBy: req.adminId,
      createdByName: req.user?.name || 'Staff'
    });

    res.status(201).json({
      success: true,
      message: `Form link created from template "${template.title}"`,
      data: form
    });
  } catch (error) {
    console.error('Use Template Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// ----------------------------------------------------------------------
// DYNAMIC FORMS & CREATE FORM LINK
// ----------------------------------------------------------------------

// @desc    Create new dynamic form or document request link (Ad-hoc)
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
    const { type, status } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;

    if (req.user?.role !== 'admin') {
      query.createdBy = req.adminId;
    }

    const forms = await DynamicForm.find(query)
      .populate('clientId', 'fullName mobile applicationId status applicants loanAmount caseType')
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
    const form = await DynamicForm.findOne({ linkId }).populate('clientId', 'fullName mobile applicationId applicants');

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form or Document Request link is invalid or expired.' });
    }

    res.json({ success: true, data: form });
  } catch (error) {
    console.error('Get Public Form Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ----------------------------------------------------------------------
// FILLED FORMS / SUBMISSIONS
// ----------------------------------------------------------------------

// @desc    Get all submitted / filled forms across all clients
// @route   GET /api/forms/filled-forms
// @access  Private (Staff/Admin)
exports.getFilledForms = async (req, res) => {
  try {
    const query = {
      'submissions.0': { $exists: true }
    };

    if (req.user?.role !== 'admin') {
      query.createdBy = req.adminId;
    }

    const forms = await DynamicForm.find(query)
      .populate('clientId', 'fullName mobile applicationId status applicants loanAmount caseType occupation')
      .populate('templateId', 'title category')
      .sort({ updatedAt: -1 });

    // Format submissions into flat, easily readable submission records
    const filledList = [];
    forms.forEach(form => {
      (form.submissions || []).forEach((sub, sIdx) => {
        filledList.push({
          submissionId: `${form._id}_${sIdx}`,
          formId: form._id,
          formTitle: form.title,
          formType: form.type,
          linkId: form.linkId,
          templateName: form.templateId?.title || form.title,
          submittedAt: sub.submittedAt,
          clientData: sub.clientData || {},
          uploadedFiles: sub.uploadedFiles || [],
          client: form.clientId ? {
            _id: form.clientId._id,
            fullName: form.clientId.fullName,
            mobile: form.clientId.mobile,
            applicationId: form.clientId.applicationId || `KTR-${form.clientId._id.toString().substring(18).toUpperCase()}`,
            status: form.clientId.status,
            loanAmount: form.clientId.loanAmount,
            caseType: form.clientId.caseType,
            occupation: form.clientId.occupation,
            applicants: form.clientId.applicants || []
          } : {
            fullName: form.clientName,
            mobile: form.clientMobile,
            status: 'Pending'
          },
          createdByName: form.createdByName
        });
      });
    });

    filledList.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({
      success: true,
      count: filledList.length,
      filledForms: filledList
    });
  } catch (error) {
    console.error('Get Filled Forms Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get all filled forms for a specific client profile
// @route   GET /api/forms/client/:clientId/submissions
// @access  Private (Staff/Admin)
exports.getClientSubmissions = async (req, res) => {
  try {
    const { clientId } = req.params;
    const forms = await DynamicForm.find({ clientId, 'submissions.0': { $exists: true } })
      .sort({ updatedAt: -1 });

    res.json({ success: true, forms });
  } catch (error) {
    console.error('Get Client Submissions Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// ----------------------------------------------------------------------
// SUBMIT PUBLIC FORM (CLIENT-FACING)
// ----------------------------------------------------------------------

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

    const bodyData = req.body || {};

    const uploadedList = [];
    const docFieldUpdates = {};

    // Standard field mapping
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
      form16: 'form16Url',
      form16Url: 'form16Url',
      photo: 'photoUrl',
      photoUrl: 'photoUrl',
      propertyDoc: 'propertyDocUrl',
      propertyDocUrl: 'propertyDocUrl',
      idProof: 'idProofUrl',
      idProofUrl: 'idProofUrl',
      addressProof: 'addressProofUrl',
      addressProofUrl: 'addressProofUrl'
    };

    // Process all uploaded files
    if (req.files) {
      const filesList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      filesList.forEach(f => {
        if (!f) return;
        const fieldName = f.fieldname || 'other';
        const fileUrl = `/uploads/${f.filename}`;
        
        // Find matching requested doc title if available
        let cleanDocTitle = '';
        if (form.requestedDocs && form.requestedDocs.length > 0) {
          const matchedDoc = form.requestedDocs.find(d => d.docType === fieldName || d.name === fieldName);
          if (matchedDoc) cleanDocTitle = matchedDoc.name;
        }
        if (!cleanDocTitle && form.fields && form.fields.length > 0) {
          const matchedField = form.fields.find(fld => fld.mappedDocType === fieldName || fld.id === fieldName);
          if (matchedField) cleanDocTitle = matchedField.label;
        }

        if (!cleanDocTitle) {
          cleanDocTitle = f.originalname ? f.originalname.replace(/\.[^/.]+$/, '') : 'Document';
        }

        uploadedList.push({
          name: cleanDocTitle,
          fileUrl,
          docType: fieldName,
          notes: `Submitted via link: ${form.title}`
        });

        if (standardMap[fieldName] && !docFieldUpdates[standardMap[fieldName]]) {
          docFieldUpdates[standardMap[fieldName]] = fileUrl;
        }
      });
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

    // Parse applicants if provided
    let submittedApplicants = [];
    if (bodyData.applicants) {
      try {
        submittedApplicants = typeof bodyData.applicants === 'string' ? JSON.parse(bodyData.applicants) : bodyData.applicants;
      } catch (e) {
        submittedApplicants = [];
      }
    }

    // Calculate age if DOB provided (Formula: Current Year - Year of Birth)
    let parsedDob = undefined;
    let parsedAge = undefined;
    if (bodyData.dob && bodyData.dob.trim()) {
      const d = new Date(bodyData.dob.trim());
      if (!isNaN(d.getTime())) {
        parsedDob = d;
        parsedAge = calculateAge(d);
      }
    }

    if (client) {
      // ------------------------------------------------------------------
      // 1. EXISTING CLIENT: Update details & automatically attach documents
      // ------------------------------------------------------------------
      if (bodyData.fullName) client.fullName = bodyData.fullName.trim();
      if (bodyData.fatherName) client.fatherName = bodyData.fatherName.trim();
      if (bodyData.motherName) client.motherName = bodyData.motherName.trim();
      if (parsedDob) {
        client.dob = parsedDob;
        client.age = parsedAge;
      }
      if (bodyData.occupation) client.occupation = bodyData.occupation.trim();
      if (bodyData.addressLine1 || bodyData.address) client.addressLine1 = (bodyData.addressLine1 || bodyData.address).trim();
      if (bodyData.panNumber) client.panNumber = bodyData.panNumber.trim().toUpperCase();
      if (bodyData.aadhaarNumber) client.aadhaarNumber = bodyData.aadhaarNumber.trim();
      if (bodyData.loanAmount) client.loanAmount = parseFloat(bodyData.loanAmount) || client.loanAmount;
      if (bodyData.caseType) client.caseType = bodyData.caseType.trim();

      // Apply standard doc updates
      Object.assign(client, docFieldUpdates);

      // Append new custom documents directly into client's repository
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

      // Append/Update applicants if provided
      if (submittedApplicants && submittedApplicants.length > 0) {
        if (!client.applicants) client.applicants = [];
        submittedApplicants.forEach((app, idx) => {
          const appAge = app.dob ? calculateAge(app.dob) : (app.age || null);
          const appEntry = {
            fullName: (app.fullName || `Applicant ${idx + 1}`).trim(),
            dob: app.dob ? new Date(app.dob) : undefined,
            age: appAge,
            mobile: app.mobile || '',
            email: app.email || '',
            occupation: app.occupation || '',
            panNumber: (app.panNumber || '').toUpperCase(),
            aadhaarNumber: app.aadhaarNumber || '',
            motherName: app.motherName || '',
            relationship: app.relationship || (idx === 0 ? 'Primary Applicant' : `Co-Applicant ${idx}`)
          };
          client.applicants.push(appEntry);
        });
      }

      // Add audit edit entry
      if (!client.editHistory) client.editHistory = [];
      client.editHistory.push({
        editedBy: form.createdBy,
        editorName: 'Client (Public Submission)',
        editorRole: 'client',
        action: 'Form Data & Documents Submitted',
        details: `Client submitted form data / documents via link: ${form.title}`,
        timestamp: new Date()
      });

      await client.save();
    } else {
      // ------------------------------------------------------------------
      // 2. NEW CLIENT: Automatically register new client profile in DB
      // ------------------------------------------------------------------
      let assignedUser = form.createdBy;
      if (!assignedUser) {
        const firstAdmin = await Admin.findOne();
        assignedUser = firstAdmin ? firstAdmin._id : new mongoose.Types.ObjectId();
      }

      const primaryName = bodyData.fullName || form.clientName || 'New Client';
      const primaryMobile = bodyData.mobile || form.clientMobile || '9999999999';
      const primaryOccupation = bodyData.occupation || 'Self-Employed / Salaried';

      // Build applicants array
      const initialApplicants = [];
      if (submittedApplicants && submittedApplicants.length > 0) {
        submittedApplicants.forEach((app, idx) => {
          const appAge = app.dob ? calculateAge(app.dob) : (app.age || null);
          initialApplicants.push({
            fullName: (app.fullName || `Applicant ${idx + 1}`).trim(),
            dob: app.dob ? new Date(app.dob) : undefined,
            age: appAge,
            mobile: app.mobile || '',
            email: app.email || '',
            occupation: app.occupation || '',
            panNumber: (app.panNumber || '').toUpperCase(),
            aadhaarNumber: app.aadhaarNumber || '',
            motherName: app.motherName || '',
            relationship: app.relationship || (idx === 0 ? 'Primary Applicant' : `Co-Applicant ${idx}`)
          });
        });
      } else {
        initialApplicants.push({
          fullName: primaryName,
          dob: parsedDob,
          age: parsedAge,
          mobile: primaryMobile,
          occupation: primaryOccupation,
          panNumber: (bodyData.panNumber || '').toUpperCase(),
          aadhaarNumber: bodyData.aadhaarNumber || '',
          motherName: bodyData.motherName || '',
          relationship: 'Primary Applicant'
        });
      }

      const newClientData = {
        user: assignedUser,
        fullName: primaryName,
        mobile: primaryMobile,
        email: bodyData.email || '',
        motherName: bodyData.motherName || '',
        dob: parsedDob,
        age: parsedAge,
        occupation: primaryOccupation,
        addressLine1: bodyData.addressLine1 || bodyData.address || '',
        panNumber: (bodyData.panNumber || '').toUpperCase(),
        aadhaarNumber: bodyData.aadhaarNumber || '',
        loanAmount: parseFloat(bodyData.loanAmount) || 0,
        caseType: bodyData.caseType || (form.type === 'doc_request' ? 'Document Verification' : 'Client Onboarding'),
        loanType: bodyData.caseType || (form.type === 'doc_request' ? 'Document Verification' : 'Client Onboarding'),
        status: 'Pending',
        applicants: initialApplicants,
        ...docFieldUpdates,
        customDocuments: uploadedList.map(up => ({
          name: up.name,
          fileUrl: up.fileUrl,
          docType: up.docType || 'General Document',
          category: 'Client Submission',
          notes: up.notes,
          uploadedAt: new Date(),
          uploadedByName: 'Client (Online Form)'
        })),
        editHistory: [{
          editedBy: assignedUser,
          editorName: 'Client (Public Submission)',
          editorRole: 'client',
          action: 'Client Intake Created',
          details: `Registered via dynamic link: ${form.title}`,
          timestamp: new Date()
        }]
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
      applicationId: `KTR-${client._id.toString().substring(18).toUpperCase()}`
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
