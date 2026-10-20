const mongoose = require('mongoose');
const ClientProfile = require('../models/ClientProfile');
const ShareLink = require('../models/ShareLink');

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

// @desc    Create or update user's own client profile
// @route   POST /api/clients/profile
// @access  Private (User Only)
exports.submitProfile = async (req, res) => {
  try {
    const userId = req.adminId; // From authMiddleware (admin/user)

    // Parse files if any
    const files = req.files || {};
    
    // Construct document paths if they were uploaded
    const docUpdates = {};
    if (files.photoUrl) docUpdates.photoUrl = `/uploads/${files.photoUrl[0].filename}`;
    if (files.idProofUrl) docUpdates.idProofUrl = `/uploads/${files.idProofUrl[0].filename}`;
    if (files.addressProofUrl) docUpdates.addressProofUrl = `/uploads/${files.addressProofUrl[0].filename}`;
    if (files.panCardUrl) docUpdates.panCardUrl = `/uploads/${files.panCardUrl[0].filename}`;
    if (files.aadhaarUrl) docUpdates.aadhaarUrl = `/uploads/${files.aadhaarUrl[0].filename}`;
    if (files.salarySlipUrl) docUpdates.salarySlipUrl = `/uploads/${files.salarySlipUrl[0].filename}`;
    if (files.bankStatementUrl) docUpdates.bankStatementUrl = `/uploads/${files.bankStatementUrl[0].filename}`;
    if (files.otherDocUrl) docUpdates.otherDocUrl = `/uploads/${files.otherDocUrl[0].filename}`;
    if (files.otherDocs) {
      docUpdates.otherDocs = files.otherDocs.map(f => `/uploads/${f.filename}`);
    }

    if (req.body.address && !req.body.addressLine1) {
      docUpdates.addressLine1 = req.body.address;
    }

    // Parse multiple applicants
    let applicantsList = [];
    if (req.body.applicants) {
      try {
        applicantsList = typeof req.body.applicants === 'string' ? JSON.parse(req.body.applicants) : req.body.applicants;
      } catch (e) {
        applicantsList = [];
      }
    }

    if (Array.isArray(applicantsList) && applicantsList.length > 0) {
      applicantsList = applicantsList.map((app, idx) => {
        const appDob = app.dob ? new Date(app.dob) : undefined;
        let appCustomFields = [];
        if (app.customFields) {
          try {
            appCustomFields = typeof app.customFields === 'string' ? JSON.parse(app.customFields) : app.customFields;
          } catch (e) {
            appCustomFields = [];
          }
          if (Array.isArray(appCustomFields)) {
            appCustomFields = appCustomFields.filter(cf => cf && cf.fieldName && cf.fieldName.trim()).map(cf => ({
              fieldName: cf.fieldName.trim(),
              fieldValue: String(cf.fieldValue || '').trim()
            }));
          } else {
            appCustomFields = [];
          }
        }
        return {
          fullName: (app.fullName || `Applicant ${idx + 1}`).trim(),
          dob: appDob,
          age: appDob ? calculateAge(appDob) : (app.age || null),
          gender: app.gender || '',
          mobile: app.mobile || '',
          email: app.email || '',
          motherName: app.motherName || '',
          occupation: app.occupation || '',
          panNumber: (app.panNumber || '').toUpperCase(),
          aadhaarNumber: app.aadhaarNumber || '',
          addressLine1: app.addressLine1 || app.address || '',
          city: app.city || '',
          state: app.state || '',
          pincode: app.pincode || '',
          relationship: app.relationship || (idx === 0 ? 'Primary Applicant' : `Co-Applicant ${idx}`),
          customFields: appCustomFields
        };
      });
    }

    const primaryDob = req.body.dob ? new Date(req.body.dob) : (applicantsList[0]?.dob || undefined);
    const primaryAge = primaryDob ? calculateAge(primaryDob) : (req.body.age || applicantsList[0]?.age || null);

    let coApplicantObj = null;
    if (req.body.hasCoApplicant === 'true' || req.body.hasCoApplicant === true) {
      const coDob = req.body.coApplicant_dob ? new Date(req.body.coApplicant_dob) : undefined;
      coApplicantObj = {
        fullName: req.body.coApplicant_fullName || '',
        dob: coDob,
        age: coDob ? calculateAge(coDob) : null,
        mobile: req.body.coApplicant_mobile || '',
        occupation: req.body.coApplicant_occupation || '',
        motherName: req.body.coApplicant_motherName || '',
        panNumber: req.body.coApplicant_panNumber || '',
        aadhaarNumber: req.body.coApplicant_aadhaarNumber || '',
        addressLine1: req.body.coApplicant_address || req.body.coApplicant_addressLine1 || '',
        city: req.body.coApplicant_city || '',
        state: req.body.coApplicant_state || '',
        pincode: req.body.coApplicant_pincode || '',
      };
    }

    // Parse custom fields if provided
    let customFieldsList = [];
    if (req.body.customFields) {
      try {
        customFieldsList = typeof req.body.customFields === 'string' ? JSON.parse(req.body.customFields) : req.body.customFields;
      } catch (e) {
        customFieldsList = [];
      }
    }
    if (Array.isArray(customFieldsList)) {
      customFieldsList = customFieldsList
        .filter(cf => cf && typeof cf === 'object' && cf.fieldName && cf.fieldName.trim())
        .map(cf => ({
          fieldName: cf.fieldName.trim(),
          fieldValue: String(cf.fieldValue || '').trim()
        }));
    } else {
      customFieldsList = [];
    }

    const notesContent = req.body.caseNotes || req.body.notes || '';
    const internalNotesContent = req.body.internalNotes || '';
    const profileData = {
      ...req.body,
      ...docUpdates,
      dob: primaryDob,
      age: primaryAge,
      applicants: applicantsList.length > 0 ? applicantsList : [{
        fullName: req.body.fullName,
        dob: primaryDob,
        age: primaryAge,
        mobile: req.body.mobile,
        occupation: req.body.occupation,
        panNumber: req.body.panNumber,
        aadhaarNumber: req.body.aadhaarNumber,
        motherName: req.body.motherName,
        relationship: 'Primary Applicant'
      }],
      hasCoApplicant: req.body.hasCoApplicant === 'true' || req.body.hasCoApplicant === true,
      ...(coApplicantObj ? { coApplicant: coApplicantObj } : {}),
      user: userId,
      status: 'Pending',
      notes: notesContent,
      caseNotes: notesContent,
      internalNotes: internalNotesContent,
      customFields: customFieldsList
    };

    // Create new profile always (1-to-many relationship)
    const profile = await ClientProfile.create(profileData);
    res.status(201).json({ success: true, message: 'Client added successfully', data: profile });
  } catch (error) {
    console.error('Submit Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get user's own profile (Legacy - might still be used, but getting all clients is better)
// @route   GET /api/clients/profile
// @access  Private (User Only)
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await ClientProfile.findOne({ user: req.adminId });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all clients added by the user
// @route   GET /api/clients/my-clients
// @desc    Get all clients added by the user
// @route   GET /api/clients/my-clients
// @access  Private (User Only)
exports.getMyClients = async (req, res) => {
  try {
    const clients = await ClientProfile.find({ user: req.adminId, isDeleted: { $ne: true } })
      .populate('user', 'name email')
      .sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all client profiles
// @route   GET /api/clients
// @access  Private (Admin Only)
exports.getAllClients = async (req, res) => {
  try {
    // Assuming admin authorization is handled in routes with a role check
    const clients = await ClientProfile.find({ isDeleted: { $ne: true } })
      .populate('user', 'name email')
      .sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single client profile by ID
// @route   GET /api/clients/:id
// @access  Private (Admin Only)
exports.getClientById = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id).populate('user', 'name email');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    if (client.isDeleted && req.user?.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Client record not found or has been deleted' });
    }

    // Auto-heal empty standard document fields from customDocuments if available
    const STANDARD_DOC_FIELDS = [
      'propertyDocUrl', 'bankStatementUrl', 'salarySlipUrl', 'panCardUrl',
      'aadhaarUrl', 'itrUrl', 'form16Url', 'idProofUrl', 'addressProofUrl',
      'photoUrl', 'otherDocUrl'
    ];
    let clientModified = false;
    if (client.customDocuments && client.customDocuments.length > 0) {
      client.customDocuments.forEach(cd => {
        if (!cd.docType) {
          if (cd.category === 'propertyDocUrl' || cd.category === 'Property Papers' || (cd.name && cd.name.toLowerCase().includes('property')) || (cd.name && cd.name.toLowerCase().includes('registry'))) {
            cd.docType = 'propertyDocUrl';
            clientModified = true;
          } else if (cd.category === 'bankStatementUrl' || cd.category === 'Bank Statements') {
            cd.docType = 'bankStatementUrl';
            clientModified = true;
          } else if (cd.category === 'salarySlipUrl' || cd.category === 'Salary Slips') {
            cd.docType = 'salarySlipUrl';
            clientModified = true;
          }
        }
      });

      STANDARD_DOC_FIELDS.forEach(fieldKey => {
        if (!client[fieldKey]) {
          const match = client.customDocuments.find(cd => cd.docType === fieldKey || cd.category === fieldKey);
          if (match && match.fileUrl) {
            client[fieldKey] = match.fileUrl;
            clientModified = true;
          }
        }
      });

      if (clientModified) {
        await client.save();
      }
    }

    // Extract Documents
    const documents = extractDocuments(client);

    // Fetch CIBIL Reports
    const CibilReport = require('../models/CibilReport');
    const cibilReports = await CibilReport.find({ client_id: client._id.toString() }).sort({ createdAt: -1 });

    // Fetch Credit Info
    const CreditInfo = require('../models/CreditInfo');
    const creditInfo = await CreditInfo.findOne({ client: client._id });

    // Generate basic records/history
    const records = [
      { action: 'Client Profile Created', date: client.createdAt, status: 'Success' },
      { action: `Profile Status: ${client.status}`, date: client.updatedAt, status: client.status === 'Rejected' ? 'Failed' : 'Success' }
    ];

    documents.forEach(doc => {
      records.push({ action: `Document Uploaded: ${doc.name}`, date: doc.uploaded, status: 'Success' });
    });

    cibilReports.forEach(c => {
      records.push({ action: `CIBIL Score Checked`, date: c.createdAt, status: 'Success' });
    });

    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Convert mongoose doc to object and attach extras
    const clientData = client.toObject();
    clientData.documentCustomTitles = mapToPlainObject(client.documentCustomTitles);
    clientData.documentNotes = mapToPlainObject(client.documentNotes);
    clientData.documentPasswords = mapToPlainObject(client.documentPasswords);
    clientData.documentsList = documents;
    clientData.cibilReports = cibilReports;
    clientData.creditInfo = creditInfo;
    clientData.records = records;

    res.json({ success: true, data: clientData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update client status (Staff-controlled Case Status)
// @route   PATCH /api/clients/:id/status
// @access  Private (Admin / Staff)
exports.updateClientStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    
    const allowedStatuses = [
      'Documents Pending',
      'Bank Side Pending',
      'Client Side Pending',
      'Case Sanctioned',
      'Disbursement Pendency',
      'Case Disbursed',
      'Pending',
      'Approved',
      'Rejected'
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid case status' });
    }

    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const oldStatus = client.status;
    client.status = status;
    if (adminRemarks) {
      client.adminRemarks = adminRemarks;
    }

    // Record status update in editHistory
    if (!client.editHistory) {
      client.editHistory = [];
    }
    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: req.user?.name || 'Staff/Admin',
      editorRole: req.user?.role || 'staff',
      action: 'Case Status Updated',
      details: `Status updated from "${oldStatus || 'N/A'}" to "${status}"`,
      timestamp: new Date()
    });

    await client.save();
    res.json({ success: true, message: `Case status marked as ${status}`, data: client });
  } catch (error) {
    console.error('Update Client Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Toggle client hide status (Hide or Unhide client from active list)
// @route   PATCH /api/clients/:id/toggle-hide
// @access  Private (Staff / Admin)
exports.toggleHideClient = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client.isHidden = req.body.isHidden !== undefined ? req.body.isHidden : !client.isHidden;

    if (!client.editHistory) {
      client.editHistory = [];
    }
    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: req.user?.name || 'Staff/Admin',
      editorRole: req.user?.role || 'staff',
      action: client.isHidden ? 'Client Hidden' : 'Client Unhidden',
      details: client.isHidden ? 'Client hidden from active client list' : 'Client unhidden and restored to active list',
      timestamp: new Date()
    });

    await client.save();

    res.json({
      success: true,
      message: client.isHidden ? 'Client hidden from active list' : 'Client restored to active list',
      data: client
    });
  } catch (error) {
    console.error('Toggle Hide Client Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Reorder clients (Drag-and-Drop ordering persistence)
// @route   POST /api/clients/reorder
// @access  Private (Staff / Admin)
exports.reorderClients = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderedIds array is required' });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder: index } }
      }
    }));

    await ClientProfile.bulkWrite(bulkOps);

    res.json({ success: true, message: 'Client order saved successfully' });
  } catch (error) {
    console.error('Reorder Clients Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update client profile
// @route   PUT /api/clients/:id
// @access  Private (Admin Only)
exports.updateClient = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Process files if any
    const files = req.files || {};
    const docUpdates = {};
    if (files.photoUrl) docUpdates.photoUrl = `/uploads/${files.photoUrl[0].filename}`;
    if (files.idProofUrl) docUpdates.idProofUrl = `/uploads/${files.idProofUrl[0].filename}`;
    if (files.addressProofUrl) docUpdates.addressProofUrl = `/uploads/${files.addressProofUrl[0].filename}`;
    if (files.panCardUrl) docUpdates.panCardUrl = `/uploads/${files.panCardUrl[0].filename}`;
    if (files.aadhaarUrl) docUpdates.aadhaarUrl = `/uploads/${files.aadhaarUrl[0].filename}`;
    if (files.salarySlipUrl) docUpdates.salarySlipUrl = `/uploads/${files.salarySlipUrl[0].filename}`;
    if (files.bankStatementUrl) docUpdates.bankStatementUrl = `/uploads/${files.bankStatementUrl[0].filename}`;
    if (files.otherDocUrl) docUpdates.otherDocUrl = `/uploads/${files.otherDocUrl[0].filename}`;
    if (files.otherDocs) {
      docUpdates.otherDocs = files.otherDocs.map(f => `/uploads/${f.filename}`);
    }

    // Detect field changes for edit history
    const changesList = [];
    const fieldsToTrack = [
      { key: 'mobile', label: 'Mobile No.' },
      { key: 'email', label: 'Email ID' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'panNumber', label: 'PAN Number' },
      { key: 'aadhaarNumber', label: 'Aadhaar Number' },
      { key: 'occupation', label: 'Occupation' },
      { key: 'loanAmount', label: 'Loan Amount' },
      { key: 'caseType', label: 'Case Type' },
      { key: 'loanType', label: 'Loan Type' },
      { key: 'notes', label: 'Case Notes' },
      { key: 'caseNotes', label: 'Case Notes' },
      { key: 'internalNotes', label: 'Internal Notes' },
      { key: 'addressLine1', label: 'Address' },
      { key: 'status', label: 'Status' }
    ];

    fieldsToTrack.forEach(item => {
      if (req.body[item.key] !== undefined && String(req.body[item.key]) !== String(client[item.key] || '')) {
        changesList.push(`${item.label}: "${client[item.key] || 'N/A'}" ➔ "${req.body[item.key]}"`);
      }
    });

    Object.keys(docUpdates).forEach(docKey => {
      changesList.push(`Updated Document: ${docKey}`);
    });

    if (changesList.length > 0) {
      client.editHistory.push({
        editedBy: req.user?._id || req.adminId,
        editorName: req.user?.name || 'Staff/Admin',
        editorRole: req.user?.role || 'staff',
        action: 'Client Profile Updated',
        details: changesList.join(' | '),
        timestamp: new Date()
      });
    }

    // Parse custom fields if provided
    if (req.body.customFields !== undefined) {
      let customFieldsList = [];
      try {
        customFieldsList = typeof req.body.customFields === 'string' ? JSON.parse(req.body.customFields) : req.body.customFields;
      } catch (e) {
        customFieldsList = [];
      }
      if (Array.isArray(customFieldsList)) {
        client.customFields = customFieldsList
          .filter(cf => cf && typeof cf === 'object' && cf.fieldName && cf.fieldName.trim())
          .map(cf => ({
            fieldName: cf.fieldName.trim(),
            fieldValue: String(cf.fieldValue || '').trim()
          }));
      }
    }

    // Parse multiple applicants if provided
    let applicantsList = null;
    if (req.body.applicants) {
      try {
        applicantsList = typeof req.body.applicants === 'string' ? JSON.parse(req.body.applicants) : req.body.applicants;
      } catch (e) {
        applicantsList = null;
      }
    }

    if (Array.isArray(applicantsList)) {
      client.applicants = applicantsList.map((app, idx) => {
        const appDob = app.dob ? new Date(app.dob) : undefined;
        let appCustomFields = [];
        if (app.customFields) {
          try {
            appCustomFields = typeof app.customFields === 'string' ? JSON.parse(app.customFields) : app.customFields;
          } catch (e) {
            appCustomFields = [];
          }
          if (Array.isArray(appCustomFields)) {
            appCustomFields = appCustomFields.filter(cf => cf && cf.fieldName && cf.fieldName.trim()).map(cf => ({
              fieldName: cf.fieldName.trim(),
              fieldValue: String(cf.fieldValue || '').trim()
            }));
          } else {
            appCustomFields = [];
          }
        }
        return {
          fullName: (app.fullName || `Applicant ${idx + 1}`).trim(),
          dob: appDob,
          age: appDob ? calculateAge(appDob) : (app.age || null),
          gender: app.gender || '',
          mobile: app.mobile || '',
          email: app.email || '',
          motherName: app.motherName || '',
          occupation: app.occupation || '',
          panNumber: (app.panNumber || '').toUpperCase(),
          aadhaarNumber: app.aadhaarNumber || '',
          addressLine1: app.addressLine1 || app.address || '',
          city: app.city || '',
          state: app.state || '',
          pincode: app.pincode || '',
          relationship: app.relationship || (idx === 0 ? 'Primary Applicant' : `Co-Applicant ${idx}`),
          customFields: appCustomFields
        };
      });
      if (client.applicants.length > 0) {
        client.fullName = client.applicants[0].fullName || client.fullName;
        if (client.applicants[0].dob) {
          client.dob = client.applicants[0].dob;
          client.age = client.applicants[0].age;
        }
      }
    } else if (req.body.coApplicant && req.body.coApplicant.fullName) {
      const coApp = req.body.coApplicant;
      const coDob = coApp.dob ? new Date(coApp.dob) : undefined;
      const existingCoIdx = (client.applicants || []).findIndex((a, i) => i > 0 && (a.fullName === coApp.fullName || (a.mobile && a.mobile === coApp.mobile)));
      const coObj = {
        fullName: coApp.fullName.trim(),
        dob: coDob,
        age: coDob ? calculateAge(coDob) : (coApp.age || null),
        mobile: (coApp.mobile || '').trim(),
        occupation: (coApp.occupation || '').trim(),
        panNumber: (coApp.panNumber || '').toUpperCase(),
        aadhaarNumber: (coApp.aadhaarNumber || '').trim(),
        motherName: (coApp.motherName || '').trim(),
        relationship: coApp.relationship || 'Co-Applicant',
        customFields: coApp.customFields || []
      };
      if (!client.applicants || client.applicants.length === 0) {
        client.applicants = [{
          fullName: client.fullName,
          dob: client.dob,
          age: client.age,
          mobile: client.mobile,
          occupation: client.occupation,
          panNumber: client.panNumber,
          aadhaarNumber: client.aadhaarNumber,
          relationship: 'Primary Applicant'
        }];
      }
      if (existingCoIdx !== -1) {
        client.applicants[existingCoIdx] = { ...client.applicants[existingCoIdx], ...coObj };
      } else {
        client.applicants.push(coObj);
      }
      client.hasCoApplicant = true;
      client.coApplicant = coObj;
    } else if (req.body.dob) {
      const d = new Date(req.body.dob);
      if (!isNaN(d.getTime())) {
        client.dob = d;
        client.age = calculateAge(d);
      }
    }

    // Apply updates
    Object.assign(client, req.body, docUpdates);

    await client.save();

    res.json({ success: true, message: 'Client updated successfully', data: client });
  } catch (error) {
    console.error('Update Client Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Add single or multiple documents to client profile
// @route   POST /api/clients/:id/documents
// @access  Private (Admin/Staff)
exports.addClientDocument = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Collect all uploaded files (supports req.files array or req.file single)
    const uploadedFiles = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      uploadedFiles.push(...req.files);
    } else if (req.files && typeof req.files === 'object') {
      Object.keys(req.files).forEach(k => {
        if (Array.isArray(req.files[k])) uploadedFiles.push(...req.files[k]);
        else if (req.files[k]) uploadedFiles.push(req.files[k]);
      });
    } else if (req.file) {
      uploadedFiles.push(req.file);
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { docType, docName, documentName, category, folderId, notes } = req.body;
    const cleanDocName = (docName || documentName || '').trim();
    const baseCategory = category || (docType && docType !== 'otherDocs' && docType !== 'customDocument' ? docType : 'Document');
    const uploaderName = req.user?.name || 'Staff';
    const addedDocNames = [];

    if (!client.customDocuments) client.customDocuments = [];
    if (!client.otherDocs) client.otherDocs = [];

    // If target is a custom folder
    let targetFolderId = folderId;
    if (!targetFolderId && docType && typeof docType === 'string' && docType.startsWith('folder_')) {
      targetFolderId = docType.replace('folder_', '');
    }

    let targetFolder = null;
    if (targetFolderId && client.customFolders) {
      try {
        targetFolder = client.customFolders.id(targetFolderId);
      } catch (e) {
        targetFolder = null;
      }
      if (!targetFolder) {
        targetFolder = client.customFolders.find(f => f._id && f._id.toString() === targetFolderId.toString());
      }
    }

    const STANDARD_DOC_KEYS = [
      'panCardUrl',
      'aadhaarUrl',
      'salarySlipUrl',
      'bankStatementUrl',
      'propertyDocUrl',
      'itrUrl',
      'form16Url',
      'idProofUrl',
      'addressProofUrl',
      'photoUrl',
      'otherDocUrl'
    ];

    const DOC_FRIENDLY_NAMES = {
      propertyDocUrl: 'Property Papers',
      bankStatementUrl: 'Bank Statements',
      salarySlipUrl: 'Salary Slips',
      itrUrl: 'Income Tax Return (ITR)',
      form16Url: 'Form 16',
      panCardUrl: 'PAN Card',
      aadhaarUrl: 'Aadhaar Card',
      idProofUrl: 'ID Proof',
      addressProofUrl: 'Address Proof',
      photoUrl: 'Photograph',
      otherDocUrl: 'Other Document'
    };

    uploadedFiles.forEach((file, index) => {
      const fileUrl = `/uploads/${file.filename}`;
      let displayName = cleanDocName || file.originalname || 'Document';

      if (targetFolder) {
        targetFolder.documents.push({
          name: displayName,
          fileUrl: fileUrl,
          category: `Folder: ${targetFolder.folderName || targetFolder.name}`,
          notes: notes || '',
          uploadedAt: new Date(),
          uploadedByName: uploaderName
        });
      } else {
        // Pure Document System: Stored as customDocument with given name
        client.customDocuments.push({
          name: displayName,
          fileUrl: fileUrl,
          docType: docType || 'document',
          category: baseCategory || 'General Documents',
          notes: notes || '',
          uploadedAt: new Date(),
          uploadedByName: uploaderName
        });
        if (docType && STANDARD_DOC_KEYS.includes(docType) && !client[docType]) {
          client[docType] = fileUrl;
        }
      }

      if (notes && cleanDocName) {
        if (!client.documentNotes) client.documentNotes = new Map();
        client.documentNotes.set(cleanDocName, notes);
      }

      addedDocNames.push(displayName);
    });

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: uploaderName,
      editorRole: req.user?.role || 'staff',
      action: 'Documents Uploaded',
      details: `Uploaded ${uploadedFiles.length} file(s): ${addedDocNames.join(', ')}`,
      timestamp: new Date()
    });

    await client.save();

    const documents = extractDocuments(client);
    res.json({
      success: true,
      message: `${uploadedFiles.length} document(s) uploaded successfully`,
      data: {
        client,
        documentsList: documents
      }
    });
  } catch (error) {
    console.error('Add Document Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Soft-delete document for client profile (Backup retained in DB)
// @route   DELETE /api/clients/:id/documents
// @access  Private (Admin/Staff)
exports.softDeleteDocument = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const { docType, fileUrl, docName, reason, docId } = req.body;
    if (!fileUrl && !docId) {
      return res.status(400).json({ success: false, message: 'fileUrl or docId is required' });
    }

    const displayName = docName || 'Document';

    // Save to deletedDocuments backup
    client.deletedDocuments.push({
      docType: docType || 'document',
      docName: displayName,
      fileUrl: fileUrl || '',
      deletedBy: req.user?._id || req.adminId,
      deletedByName: req.user?.name || 'Staff/Admin',
      deletedAt: new Date(),
      reason: reason || 'Deleted by staff/admin'
    });

    // Remove from customDocuments if present
    if (client.customDocuments && client.customDocuments.length > 0) {
      if (docId) {
        client.customDocuments = client.customDocuments.filter(d => d._id.toString() !== docId.toString());
      } else if (fileUrl) {
        client.customDocuments = client.customDocuments.filter(d => d.fileUrl !== fileUrl);
      }
    }

    // Remove from active document fields
    if (docType && docType !== 'otherDocs' && client[docType] === fileUrl) {
      client[docType] = null;
      // Auto-promote next remaining file for this docType if available
      const remainingForDocType = (client.customDocuments || []).filter(
        d => (d.docType === docType || d.category === docType) && d.fileUrl !== fileUrl
      );
      if (remainingForDocType.length > 0) {
        client[docType] = remainingForDocType[0].fileUrl;
      }
    } else if (docType === 'otherDocs' || (client.otherDocs && client.otherDocs.includes(fileUrl))) {
      client.otherDocs = client.otherDocs.filter(url => url !== fileUrl);
    } else {
      // Search standard doc fields to clear match
      const standardFields = ['photoUrl', 'panCardUrl', 'idProofUrl', 'addressProofUrl', 'aadhaarUrl', 'salarySlipUrl', 'itrUrl', 'form16Url', 'bankStatementUrl', 'propertyDocUrl', 'otherDocUrl'];
      standardFields.forEach(field => {
        if (client[field] === fileUrl) {
          client[field] = null;
          const remaining = (client.customDocuments || []).filter(
            d => (d.docType === field || d.category === field) && d.fileUrl !== fileUrl
          );
          if (remaining.length > 0) {
            client[field] = remaining[0].fileUrl;
          }
        }
      });
    }

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: req.user?.name || 'Staff/Admin',
      editorRole: req.user?.role || 'staff',
      action: 'Document Soft-Deleted (Backed Up)',
      details: `Soft-deleted "${displayName}" (Backed up in DB)`,
      timestamp: new Date()
    });

    await client.save();

    const documents = extractDocuments(client);
    res.json({
      success: true,
      message: 'Document deleted and moved to backup',
      data: {
        client,
        documentsList: documents,
        deletedDocuments: client.deletedDocuments
      }
    });
  } catch (error) {
    console.error('Soft Delete Document Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Bulk delete documents for client profile
// @route   POST /api/clients/:id/documents/bulk-delete
// @access  Private (Admin/Staff)
exports.bulkDeleteDocuments = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const { docIds = [], fileUrls = [], reason } = req.body;
    const uploaderName = req.user?.name || 'Staff/Admin';

    if (!client.deletedDocuments) client.deletedDocuments = [];

    // Filter out from customDocuments
    if (client.customDocuments && client.customDocuments.length > 0) {
      client.customDocuments = client.customDocuments.filter(cd => {
        const isMatch = (docIds.length > 0 && cd._id && docIds.includes(cd._id.toString())) ||
                        (fileUrls.length > 0 && fileUrls.includes(cd.fileUrl));
        if (isMatch) {
          client.deletedDocuments.push({
            docType: cd.docType || 'customDocument',
            docName: cd.name || 'Document',
            fileUrl: cd.fileUrl,
            deletedBy: req.user?._id || req.adminId,
            deletedByName: uploaderName,
            deletedAt: new Date(),
            reason: reason || 'Bulk deleted by staff/admin'
          });
        }
        return !isMatch;
      });
    }

    // Filter out from otherDocs
    if (client.otherDocs && client.otherDocs.length > 0 && fileUrls.length > 0) {
      client.otherDocs = client.otherDocs.filter(url => !fileUrls.includes(url));
    }

    // Clear standard fields matching deleted fileUrls
    const standardFields = ['photoUrl', 'panCardUrl', 'idProofUrl', 'addressProofUrl', 'aadhaarUrl', 'salarySlipUrl', 'itrUrl', 'form16Url', 'bankStatementUrl', 'propertyDocUrl', 'otherDocUrl'];
    standardFields.forEach(field => {
      if (fileUrls.includes(client[field])) {
        client[field] = null;
        const remaining = (client.customDocuments || []).filter(d => (d.docType === field || d.category === field) && !fileUrls.includes(d.fileUrl));
        if (remaining.length > 0) {
          client[field] = remaining[0].fileUrl;
        }
      }
    });

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: uploaderName,
      editorRole: req.user?.role || 'staff',
      action: 'Documents Bulk Deleted',
      details: `Deleted ${docIds.length + fileUrls.length} file(s) / document(s)`,
      timestamp: new Date()
    });

    await client.save();

    res.json({
      success: true,
      message: 'Selected documents deleted successfully',
      data: {
        client,
        documentsList: extractDocuments(client),
        deletedDocuments: client.deletedDocuments
      }
    });
  } catch (error) {
    console.error('Bulk Delete Document Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Create custom folder inside client profile
// @route   POST /api/clients/:id/folders
// @access  Private (Admin/Staff)
exports.createCustomFolder = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const folderName = req.body.folderName || req.body.name;
    if (!folderName || !folderName.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required' });
    }

    const trimmedName = folderName.trim();
    if (!client.customFolders) client.customFolders = [];

    // Check duplicate name
    const existing = client.customFolders.find(f => (f.folderName || f.name || '').toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'A folder with this name already exists' });
    }

    client.customFolders.push({
      folderName: trimmedName,
      name: trimmedName,
      createdBy: req.user?._id || req.adminId,
      createdByName: req.user?.name || 'Staff/Admin',
      createdAt: new Date(),
      documents: []
    });

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: req.user?.name || 'Staff/Admin',
      editorRole: req.user?.role || 'staff',
      action: 'Custom Folder Created',
      details: `Created folder "${trimmedName}"`,
      timestamp: new Date()
    });

    await client.save();
    res.json({
      success: true,
      message: `Folder "${trimmedName}" created successfully`,
      data: client.customFolders
    });
  } catch (error) {
    console.error('Create Folder Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete custom folder (soft-deletes contained documents)
// @route   DELETE /api/clients/:id/folders/:folderId
// @access  Private (Admin/Staff)
exports.deleteCustomFolder = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    let folder = null;
    if (client.customFolders) {
      try {
        folder = client.customFolders.id(req.params.folderId);
      } catch (e) {
        folder = null;
      }
      if (!folder) {
        folder = client.customFolders.find(f => f._id && f._id.toString() === req.params.folderId.toString());
      }
    }

    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    const folderName = folder.folderName || folder.name || 'Folder';

    // Backup contained files into deletedDocuments
    if (folder.documents && folder.documents.length > 0) {
      folder.documents.forEach(doc => {
        client.deletedDocuments.push({
          docType: 'customFolderFile',
          docName: `${doc.name} (Folder: ${folderName})`,
          fileUrl: doc.fileUrl,
          deletedBy: req.user?._id || req.adminId,
          deletedByName: req.user?.name || 'Staff/Admin',
          deletedAt: new Date(),
          reason: `Deleted folder "${folderName}"`
        });
      });
    }

    if (client.customFolders.pull) {
      client.customFolders.pull({ _id: req.params.folderId });
    } else {
      client.customFolders = client.customFolders.filter(f => f._id && f._id.toString() !== req.params.folderId.toString());
    }

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: req.user?.name || 'Staff/Admin',
      editorRole: req.user?.role || 'staff',
      action: 'Custom Folder Deleted',
      details: `Deleted folder "${folderName}" (Contained files backed up in DB)`,
      timestamp: new Date()
    });

    await client.save();
    res.json({
      success: true,
      message: `Folder "${folderName}" deleted`,
      data: client.customFolders
    });
  } catch (error) {
    console.error('Delete Folder Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Upload file to a custom folder
// @route   POST /api/clients/:id/folders/:folderId/documents
// @access  Private (Admin/Staff)
exports.uploadFolderDocument = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    let folder = null;
    if (client.customFolders) {
      try {
        folder = client.customFolders.id(req.params.folderId);
      } catch (e) {
        folder = null;
      }
      if (!folder) {
        folder = client.customFolders.find(f => f._id && f._id.toString() === req.params.folderId.toString());
      }
    }

    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    let uploadedFiles = [];
    if (req.files && req.files.files) {
      uploadedFiles = req.files.files;
    } else if (req.files && req.files.file) {
      uploadedFiles = req.files.file;
    } else if (req.file) {
      uploadedFiles = [req.file];
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const cleanDocName = (req.body.documentName || req.body.docName || '').trim();
    const uploaderName = req.user?.name || 'Staff/Admin';
    const folderTitle = folder.folderName || folder.name || 'Folder';
    const addedNames = [];

    uploadedFiles.forEach((file, index) => {
      const displayName = cleanDocName || file.originalname || 'Document';
      const fileUrl = `/uploads/${file.filename}`;

      folder.documents.push({
        name: displayName,
        fileUrl: fileUrl,
        category: `Folder: ${folderTitle}`,
        uploadedAt: new Date(),
        uploadedByName: uploaderName
      });
      addedNames.push(displayName);
    });

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: uploaderName,
      editorRole: req.user?.role || 'staff',
      action: 'File Uploaded to Folder',
      details: `Uploaded ${uploadedFiles.length} file(s) [${addedNames.join(', ')}] into folder "${folderTitle}"`,
      timestamp: new Date()
    });

    await client.save();

    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded to folder "${folderTitle}"`,
      data: {
        folder,
        client,
        documentsList: extractDocuments(client)
      }
    });
  } catch (error) {
    console.error('Upload Folder File Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete single file from a custom folder (soft-delete to backup)
// @route   DELETE /api/clients/:id/folders/:folderId/documents/:docId
// @access  Private (Admin/Staff)
exports.deleteFolderDocument = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    let folder = null;
    if (client.customFolders) {
      try {
        folder = client.customFolders.id(req.params.folderId);
      } catch (e) {
        folder = null;
      }
      if (!folder) {
        folder = client.customFolders.find(f => f._id && f._id.toString() === req.params.folderId.toString());
      }
    }

    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    let doc = null;
    if (folder.documents) {
      try {
        doc = folder.documents.id(req.params.docId);
      } catch (e) {
        doc = null;
      }
      if (!doc) {
        doc = folder.documents.find(d => d._id && d._id.toString() === req.params.docId.toString());
      }
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found in folder' });
    }

    const docName = doc.name;
    const fileUrl = doc.fileUrl;
    const folderTitle = folder.folderName || folder.name || 'Folder';

    // Backup to deletedDocuments
    client.deletedDocuments.push({
      docType: 'customFolderFile',
      docName: `${docName} (Folder: ${folderTitle})`,
      fileUrl: fileUrl,
      deletedBy: req.user?._id || req.adminId,
      deletedByName: req.user?.name || 'Staff/Admin',
      deletedAt: new Date(),
      reason: req.body.reason || `Deleted from folder "${folderTitle}"`
    });

    if (folder.documents.pull) {
      folder.documents.pull({ _id: req.params.docId });
    } else {
      folder.documents = folder.documents.filter(d => d._id && d._id.toString() !== req.params.docId.toString());
    }

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: req.user?.name || 'Staff/Admin',
      editorRole: req.user?.role || 'staff',
      action: 'File Soft-Deleted from Folder',
      details: `Deleted "${docName}" from folder "${folderTitle}" (Backed up in DB)`,
      timestamp: new Date()
    });

    await client.save();

    res.json({
      success: true,
      message: `Document "${docName}" deleted from folder "${folderTitle}"`,
      data: {
        folder,
        client,
        documentsList: extractDocuments(client)
      }
    });
  } catch (error) {
    console.error('Delete Folder File Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Soft-delete client and create secure Super Admin backup archive
// @route   DELETE /api/clients/:id
// @access  Private (Staff & Admin)
exports.deleteClient = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    if (client.isDeleted) {
      return res.status(400).json({ success: false, message: 'Client is already deleted' });
    }

    const DeletedClientBackup = require('../models/DeletedClientBackup');
    const CreditInfo = require('../models/CreditInfo');
    const CibilReport = require('../models/CibilReport');

    // Fetch related records without deleting them
    const creditInfo = await CreditInfo.findOne({ client: client._id });
    const cibilReports = await CibilReport.find({ client_id: client._id.toString() });

    const deleterId = req.user?._id || req.adminId;
    const deleterName = req.user?.name || 'Staff/Admin';
    const deleterRole = req.user?.role || 'staff';
    const reason = req.body?.reason || req.query?.reason || 'Deleted via Staff Portal';

    // 1. Create complete immutable snapshot backup in DeletedClientBackup
    const clientSnapshot = client.toObject();
    const backupEntry = new DeletedClientBackup({
      originalClientId: client._id,
      fullName: client.fullName || 'Client',
      mobile: client.mobile || '',
      email: client.email || '',
      panNumber: client.panNumber || '',
      aadhaarNumber: client.aadhaarNumber || '',
      occupation: client.occupation || '',
      loanAmount: client.loanAmount || 0,
      caseType: client.caseType || client.loanType || '',
      status: client.status || 'Documents Pending',
      clientSnapshot: clientSnapshot,
      relatedCreditInfo: creditInfo ? creditInfo.toObject() : null,
      relatedCibilReports: cibilReports.map(c => c.toObject()),
      deletedBy: deleterId,
      deletedByName: deleterName,
      deletedByRole: deleterRole,
      deletedAt: new Date(),
      deletionReason: reason,
      restored: false,
      auditTrail: [{
        action: 'Client Deleted',
        actorId: deleterId,
        actorName: deleterName,
        actorRole: deleterRole,
        details: `Deleted by ${deleterName} (${deleterRole}). Reason: ${reason}. Full snapshot archived.`,
        timestamp: new Date()
      }]
    });
    await backupEntry.save();

    // 2. Mark ClientProfile as soft-deleted and log to audit history
    client.isDeleted = true;
    client.deletedAt = new Date();
    client.deletedBy = deleterId;
    client.deletedByName = deleterName;
    client.deletedByRole = deleterRole;
    client.deletionReason = reason;

    if (!client.editHistory) {
      client.editHistory = [];
    }
    client.editHistory.push({
      editedBy: deleterId,
      editorName: deleterName,
      editorRole: deleterRole,
      action: 'Client Deleted (Soft-Delete & Backed Up)',
      details: `Client deleted by ${deleterName} (${deleterRole}). Reason: ${reason}. Complete backup preserved in Super Admin archive.`,
      timestamp: new Date()
    });

    await client.save();

    res.json({
      success: true,
      message: 'Client deleted from active list. All data and documents have been securely backed up.',
      backupId: backupEntry._id
    });
  } catch (error) {
    console.error('Delete Client Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get all deleted client backups (Super Admin Only)
// @route   GET /api/clients/super-admin/deleted-backups
// @access  Private (Super Admin Only)
exports.getDeletedClientBackups = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin access only.' });
    }

    const DeletedClientBackup = require('../models/DeletedClientBackup');
    const { search, status } = req.query;

    const filter = {};
    if (status === 'restored') {
      filter.restored = true;
    } else if (status === 'deleted') {
      filter.restored = false;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { fullName: regex },
        { mobile: regex },
        { panNumber: regex },
        { deletedByName: regex },
        { deletionReason: regex },
        { caseType: regex }
      ];
    }

    const backups = await DeletedClientBackup.find(filter)
      .sort({ deletedAt: -1 })
      .lean();

    // Map summary data for fast list rendering
    const list = backups.map(b => {
      const snap = b.clientSnapshot || {};
      const docCount = (snap.customDocuments?.length || 0) +
        (snap.customFolders?.reduce((acc, f) => acc + (f.documents?.length || 0), 0) || 0) +
        (snap.deletedDocuments?.length || 0) +
        (snap.otherDocs?.length || 0);

      return {
        _id: b._id,
        originalClientId: b.originalClientId,
        fullName: b.fullName || snap.fullName,
        mobile: b.mobile || snap.mobile,
        email: b.email || snap.email,
        panNumber: b.panNumber || snap.panNumber,
        loanAmount: b.loanAmount || snap.loanAmount,
        caseType: b.caseType || snap.caseType || snap.loanType,
        status: b.status || snap.status,
        deletedBy: b.deletedBy,
        deletedByName: b.deletedByName,
        deletedByRole: b.deletedByRole,
        deletedAt: b.deletedAt,
        deletionReason: b.deletionReason,
        restored: b.restored,
        restoredAt: b.restoredAt,
        restoredByName: b.restoredByName,
        documentCount: docCount,
        pendencyCount: snap.pendencies?.length || 0,
        submissionCount: snap.formSubmissions?.length || 0,
        editHistoryCount: snap.editHistory?.length || 0
      };
    });

    res.json({
      success: true,
      data: list,
      totalCount: list.length,
      deletedCount: list.filter(b => !b.restored).length,
      restoredCount: list.filter(b => b.restored).length
    });
  } catch (error) {
    console.error('Get Deleted Client Backups Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get complete single deleted client backup details (Super Admin Only)
// @route   GET /api/clients/super-admin/deleted-backups/:id
// @access  Private (Super Admin Only)
exports.getDeletedClientBackupById = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin access only.' });
    }

    const DeletedClientBackup = require('../models/DeletedClientBackup');
    const backup = await DeletedClientBackup.findById(req.params.id);
    if (!backup) {
      return res.status(404).json({ success: false, message: 'Backup record not found' });
    }

    res.json({
      success: true,
      data: backup
    });
  } catch (error) {
    console.error('Get Backup Detail Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Restore deleted client from backup (Super Admin Only)
// @route   POST /api/clients/super-admin/restore/:id
// @access  Private (Super Admin Only)
exports.restoreDeletedClient = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin access only.' });
    }

    const DeletedClientBackup = require('../models/DeletedClientBackup');
    const backup = await DeletedClientBackup.findById(req.params.id);
    if (!backup) {
      return res.status(404).json({ success: false, message: 'Backup record not found' });
    }

    const restorerId = req.user?._id || req.adminId;
    const restorerName = req.user?.name || 'Super Admin';
    const notes = req.body?.notes || 'Restored by Super Admin';

    // 1. Restore the ClientProfile
    let client = await ClientProfile.findById(backup.originalClientId);

    if (client) {
      client.isDeleted = false;
      client.deletedAt = null;
      client.deletedBy = null;
      client.deletedByName = null;
      client.restoredAt = new Date();
      client.restoredBy = restorerId;
      client.restoredByName = restorerName;

      if (!client.editHistory) client.editHistory = [];
      client.editHistory.push({
        editedBy: restorerId,
        editorName: restorerName,
        editorRole: 'admin',
        action: 'Client Restored from Backup',
        details: `Client restored by Super Admin ${restorerName}. Note: ${notes}`,
        timestamp: new Date()
      });

      await client.save();
    } else {
      // If client document was somehow missing, resurrect completely from clientSnapshot!
      const snapshot = backup.clientSnapshot;
      delete snapshot._id;
      snapshot._id = backup.originalClientId;
      snapshot.isDeleted = false;
      snapshot.restoredAt = new Date();
      snapshot.restoredBy = restorerId;
      snapshot.restoredByName = restorerName;
      if (!snapshot.editHistory) snapshot.editHistory = [];
      snapshot.editHistory.push({
        editedBy: restorerId,
        editorName: restorerName,
        editorRole: 'admin',
        action: 'Client Resurrected from Snapshot Backup',
        details: `Client recreated from complete snapshot backup by Super Admin ${restorerName}. Note: ${notes}`,
        timestamp: new Date()
      });

      client = await ClientProfile.create(snapshot);
    }

    // 2. Mark backup record as restored and record audit trail
    backup.restored = true;
    backup.restoredAt = new Date();
    backup.restoredBy = restorerId;
    backup.restoredByName = restorerName;
    backup.restorationNotes = notes;
    backup.auditTrail.push({
      action: 'Client Restored to Active List',
      actorId: restorerId,
      actorName: restorerName,
      actorRole: 'admin',
      details: `Client restored by Super Admin ${restorerName}. Client is now fully visible and active.`,
      timestamp: new Date()
    });
    await backup.save();

    res.json({
      success: true,
      message: `Client "${client.fullName}" has been restored successfully to the active client list.`,
      data: client
    });
  } catch (error) {
    console.error('Restore Client Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Save/Update Credit Info
// @route   POST /api/clients/:id/credit-info
// @access  Private (Admin Only)
exports.saveCreditInfo = async (req, res) => {
  try {
    const CreditInfo = require('../models/CreditInfo');
    const { creditLimit, totalEnquiries, currentBalance, utilization, accounts } = req.body;

    let creditInfo = await CreditInfo.findOne({ client: req.params.id });
    
    if (creditInfo) {
      // Update existing
      creditInfo.creditLimit = creditLimit;
      creditInfo.totalEnquiries = totalEnquiries;
      creditInfo.currentBalance = currentBalance;
      creditInfo.utilization = utilization;
      creditInfo.accounts = accounts || [];
      await creditInfo.save();
    } else {
      // Create new
      creditInfo = await CreditInfo.create({
        client: req.params.id,
        creditLimit,
        totalEnquiries,
        currentBalance,
        utilization,
        accounts: accounts || []
      });
    }

    res.json({ success: true, message: 'Credit Info saved successfully', data: creditInfo });
  } catch (error) {
    console.error('Error saving credit info:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get pending clients count
// @route   GET /api/clients/pending/count
// @access  Private (Admin Only)
exports.getPendingCount = async (req, res) => {
  try {
    const count = await ClientProfile.countDocuments({ status: 'Pending' });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add new pendency to client (continuous tracking)
// @route   POST /api/clients/:id/pendencies
// @access  Private
exports.addPendency = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Pendency title is required' });
    }

    const newPendency = {
      title: title.trim(),
      description: description ? description.trim() : '',
      status: 'Pending',
      addedAt: new Date(),
      addedBy: req.user?._id || req.adminId,
      addedByName: req.user?.name || 'Staff'
    };

    if (!client.pendencies) client.pendencies = [];
    client.pendencies.push(newPendency);

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: req.user?.name || 'Staff',
      editorRole: req.user?.role || 'staff',
      action: 'Pendency Added',
      details: `Added pendency: "${newPendency.title}"`,
      timestamp: new Date()
    });

    await client.save();

    res.status(201).json({
      success: true,
      message: 'Pendency added successfully',
      data: client.pendencies
    });
  } catch (error) {
    console.error('Add Pendency Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update / resolve pendency status
// @route   PATCH /api/clients/:id/pendencies/:pendencyId
// @access  Private
exports.updatePendencyStatus = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const pendency = client.pendencies.id(req.params.pendencyId);
    if (!pendency) {
      return res.status(404).json({ success: false, message: 'Pendency not found' });
    }

    const { status, resolutionNotes, description, title } = req.body;
    const oldStatus = pendency.status;

    if (title !== undefined) pendency.title = title.trim();
    if (description !== undefined) pendency.description = description.trim();
    
    if (status !== undefined && ['Pending', 'In Progress', 'Resolved'].includes(status)) {
      pendency.status = status;
      if (status === 'Resolved') {
        pendency.resolvedAt = new Date();
        pendency.resolvedBy = req.user?._id || req.adminId;
        pendency.resolvedByName = req.user?.name || 'Staff';
        if (resolutionNotes !== undefined) {
          pendency.resolutionNotes = resolutionNotes;
        }
      } else if (oldStatus === 'Resolved' && status !== 'Resolved') {
        // Reopened
        pendency.resolvedAt = null;
        pendency.resolvedBy = null;
        pendency.resolvedByName = null;
      }
    }

    if (resolutionNotes !== undefined && pendency.status === 'Resolved') {
      pendency.resolutionNotes = resolutionNotes;
    }

    // If this was a Banker Query pendency, also sync status to bankerQueries array
    if (status === 'Resolved' && pendency.title && pendency.title.startsWith('Banker Query:')) {
      const docTitleFromPendency = pendency.title.replace(/^Banker Query:\s*/, '').trim();
      if (client.bankerQueries && client.bankerQueries.length > 0) {
        client.bankerQueries.forEach(bq => {
          if (bq.status !== 'Resolved' && (bq.documentTitle === docTitleFromPendency || (pendency.description && pendency.description.includes(bq.queryText)))) {
            bq.status = 'Resolved';
            bq.staffResponse = resolutionNotes || 'Resolved by staff';
            bq.respondedAt = new Date();
            bq.respondedByName = req.user?.name || 'Staff';
          }
        });
        client.markModified('bankerQueries');
      }
    }

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: req.user?.name || 'Staff',
      editorRole: req.user?.role || 'staff',
      action: 'Pendency Updated',
      details: `Pendency "${pendency.title}" status changed: ${oldStatus} ➔ ${pendency.status}`,
      timestamp: new Date()
    });

    await client.save();

    res.json({
      success: true,
      message: `Pendency marked as ${pendency.status}`,
      data: client.pendencies
    });
  } catch (error) {
    console.error('Update Pendency Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete pendency (if added by mistake)
// @route   DELETE /api/clients/:id/pendencies/:pendencyId
// @access  Private
exports.deletePendency = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const pendency = client.pendencies.id(req.params.pendencyId);
    if (!pendency) {
      return res.status(404).json({ success: false, message: 'Pendency not found' });
    }

    const pendencyTitle = pendency.title;
    client.pendencies.pull({ _id: req.params.pendencyId });

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: req.user?.name || 'Staff',
      editorRole: req.user?.role || 'staff',
      action: 'Pendency Removed',
      details: `Removed pendency: "${pendencyTitle}"`,
      timestamp: new Date()
    });

    await client.save();

    res.json({
      success: true,
      message: 'Pendency removed',
      data: client.pendencies
    });
  } catch (error) {
    console.error('Delete Pendency Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// Map key sanitizers (MongoDB Map keys cannot contain '.' or '$')
const sanitizeMapKey = (key) => (key ? String(key).replace(/\./g, '__dot__').replace(/\$/g, '__dollar__') : '');
const desanitizeMapKey = (key) => (key ? String(key).replace(/__dot__/g, '.').replace(/__dollar__/g, '$') : '');

const mapToPlainObject = (m) => {
  if (!m) return {};
  const plain = {};
  if (m instanceof Map) {
    m.forEach((val, k) => {
      const original = desanitizeMapKey(k);
      plain[original] = val;
      plain[k] = val;
    });
  } else if (typeof m === 'object') {
    Object.keys(m).forEach(k => {
      const original = desanitizeMapKey(k);
      plain[original] = m[k];
      plain[k] = m[k];
    });
  }
  return plain;
};

// Helper to normalize document titles and strip auto-increment suffixes
const getNormalizedDocName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return 'Document';
  let clean = rawName.trim();
  clean = clean.replace(/\s*\(\s*\d+\s*[\/of]\s*\d+[^)]*\)/gi, '');
  clean = clean.replace(/\s*\(\s*(?:page|part|file)\s*\d+[^)]*\)/gi, '');
  clean = clean.replace(/\s*-\s*page\s*\d+/gi, '');
  clean = clean.replace(/\s*-\s*part\s*\d+/gi, '');
  clean = clean.replace(/\s*-\s*file\s*\d+/gi, '');
  clean = clean.replace(/\s*_\s*page\s*\d+/gi, '');
  return clean.trim() || rawName.trim();
};

// Helper function to extract documents from a profile
const extractDocuments = (profile) => {
  const docs = [];
  const statusMapping = {
    'Approved': 'Verified',
    'Pending': 'Pending',
    'Rejected': 'Rejected'
  };
  const docStatus = statusMapping[profile.status] || 'Pending';

  const notesMap = profile.documentNotes || {};
  const passwordsMap = profile.documentPasswords || {};
  const customTitlesMap = profile.documentCustomTitles || {};

  const cleanNote = (val) => {
    if (!val) return '';
    const str = String(val);
    if (str.toLowerCase().includes('submitted via link') || str.toLowerCase().includes('client data collection form')) {
      return 'Link Submission';
    }
    return str;
  };

  const getCustomTitle = (key) => {
    if (!key) return '';
    const sKey = sanitizeMapKey(key);
    if (customTitlesMap instanceof Map) return customTitlesMap.get(sKey) || customTitlesMap.get(key) || '';
    if (typeof customTitlesMap === 'object') return customTitlesMap[sKey] || customTitlesMap[key] || '';
    return '';
  };

  const getNote = (name) => {
    if (!name) return '';
    let raw = '';
    if (notesMap instanceof Map) raw = notesMap.get(name) || '';
    else if (typeof notesMap === 'object') raw = notesMap[name] || '';
    return cleanNote(raw);
  };
  const getPassword = (name) => {
    if (!name) return '';
    if (passwordsMap instanceof Map) return passwordsMap.get(name) || '';
    if (typeof passwordsMap === 'object') return passwordsMap[name] || '';
    return '';
  };

  if (profile.panCardUrl) {
    docs.push({
      id: `DOC-PAN-${profile._id.toString().substring(18)}`,
      docType: 'panCardUrl',
      name: 'PAN Card',
      client: profile.fullName,
      category: 'PAN Card',
      file: profile.panCardUrl,
      notes: getNote('PAN Card') || getNote('panCardUrl'),
      password: getPassword('PAN Card') || getPassword('panCardUrl'),
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.aadhaarUrl) {
    docs.push({
      id: `DOC-AAD-${profile._id.toString().substring(18)}`,
      docType: 'aadhaarUrl',
      name: 'Aadhaar Card',
      client: profile.fullName,
      category: 'Aadhaar Card',
      file: profile.aadhaarUrl,
      notes: getNote('Aadhaar Card') || getNote('aadhaarUrl'),
      password: getPassword('Aadhaar Card') || getPassword('aadhaarUrl'),
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.salarySlipUrl) {
    docs.push({
      id: `DOC-SAL-${profile._id.toString().substring(18)}`,
      docType: 'salarySlipUrl',
      name: 'Salary Slips',
      client: profile.fullName,
      category: 'Salary Slips',
      file: profile.salarySlipUrl,
      notes: getNote('Salary Slips') || getNote('salarySlipUrl'),
      password: getPassword('Salary Slips') || getPassword('salarySlipUrl'),
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.itrUrl) {
    docs.push({
      id: `DOC-ITR-${profile._id.toString().substring(18)}`,
      docType: 'itrUrl',
      name: 'Income Tax Return (ITR)',
      client: profile.fullName,
      category: 'ITR',
      file: profile.itrUrl,
      notes: getNote('Income Tax Return (ITR)') || getNote('itrUrl'),
      password: getPassword('Income Tax Return (ITR)') || getPassword('itrUrl'),
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.form16Url) {
    docs.push({
      id: `DOC-F16-${profile._id.toString().substring(18)}`,
      docType: 'form16Url',
      name: 'Form 16',
      client: profile.fullName,
      category: 'Form 16',
      file: profile.form16Url,
      notes: getNote('Form 16') || getNote('form16Url'),
      password: getPassword('Form 16') || getPassword('form16Url'),
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.bankStatementUrl) {
    docs.push({
      id: `DOC-BANK-${profile._id.toString().substring(18)}`,
      docType: 'bankStatementUrl',
      name: 'Bank Statements',
      client: profile.fullName,
      category: 'Bank Statements',
      file: profile.bankStatementUrl,
      notes: getNote('Bank Statements') || getNote('bankStatementUrl'),
      password: getPassword('Bank Statements') || getPassword('bankStatementUrl'),
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.propertyDocUrl) {
    docs.push({
      id: `DOC-PROP-${profile._id.toString().substring(18)}`,
      docType: 'propertyDocUrl',
      name: 'Property Documents',
      client: profile.fullName,
      category: 'Property Documents',
      file: profile.propertyDocUrl,
      notes: getNote('Property Documents') || getNote('propertyDocUrl'),
      password: getPassword('Property Documents') || getPassword('propertyDocUrl'),
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.idProofUrl) {
    const idName = `ID Proof (${profile.idProofType || 'Identity'})`;
    docs.push({
      id: `DOC-ID-${profile._id.toString().substring(18)}`,
      docType: 'idProofUrl',
      name: idName,
      client: profile.fullName,
      category: 'ID Proof',
      file: profile.idProofUrl,
      notes: getNote(idName) || getNote('idProofUrl'),
      password: getPassword(idName) || getPassword('idProofUrl'),
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.addressProofUrl) {
    docs.push({
      id: `DOC-ADDR-${profile._id.toString().substring(18)}`,
      docType: 'addressProofUrl',
      name: 'Address Proof',
      client: profile.fullName,
      category: 'Address Proof',
      file: profile.addressProofUrl,
      notes: getNote('Address Proof') || getNote('addressProofUrl'),
      password: getPassword('Address Proof') || getPassword('addressProofUrl'),
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.photoUrl) {
    docs.push({
      id: `DOC-PHT-${profile._id.toString().substring(18)}`,
      docType: 'photoUrl',
      name: 'Passport Photograph',
      client: profile.fullName,
      category: 'Photograph',
      file: profile.photoUrl,
      notes: getNote('Passport Photograph') || getNote('photoUrl'),
      password: getPassword('Passport Photograph') || getPassword('photoUrl'),
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.otherDocUrl) {
    docs.push({
      id: `DOC-OTH-${profile._id.toString().substring(18)}`,
      docType: 'otherDocUrl',
      name: 'Other Document',
      client: profile.fullName,
      category: 'Other Documents',
      file: profile.otherDocUrl,
      notes: getNote('Other Document') || getNote('otherDocUrl'),
      password: getPassword('Other Document') || getPassword('otherDocUrl'),
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  
  // 1. Custom named documents (Keeps original user-given names like "Pan card", "Adhar Card")
  if (profile.customDocuments && profile.customDocuments.length > 0) {
    profile.customDocuments.forEach((doc) => {
      if (docs.some(d => d.file === doc.fileUrl)) return;
      const customTitle = getCustomTitle(doc.fileUrl) || (doc._id && getCustomTitle(doc._id.toString())) || doc.fileTitle;
      const effectiveName = customTitle || doc.name || 'Document';
      docs.push({
        id: doc._id ? doc._id.toString() : `DOC-CUS-${Math.random().toString(36).substring(7)}`,
        docType: 'customDocument',
        name: effectiveName,
        fileTitle: customTitle || doc.fileTitle || doc.name,
        client: profile.fullName,
        category: doc.category || 'General Document',
        file: doc.fileUrl,
        notes: doc.notes || getNote(effectiveName) || getNote(doc.name),
        password: doc.password || getPassword(effectiveName) || getPassword(doc.name) || '',
        uploaded: doc.uploadedAt || profile.createdAt,
        status: docStatus
      });
    });
  }

  // 2. Legacy other documents (Only if not already present in docs)
  if (profile.otherDocs && profile.otherDocs.length > 0) {
    profile.otherDocs.forEach((url, i) => {
      if (docs.some(d => d.file === url)) return;
      const legName = `Additional Document ${i+1}`;
      const customTitle = getCustomTitle(url) || getCustomTitle(legName);
      const effectiveName = customTitle || legName;
      docs.push({
        id: `DOC-OTH-${profile._id.toString().substring(18)}-${i}`,
        docType: 'otherDocs',
        name: effectiveName,
        fileTitle: effectiveName,
        client: profile.fullName,
        category: 'Other Documents',
        file: url,
        notes: getNote(effectiveName) || getNote(legName),
        password: getPassword(effectiveName) || getPassword(legName) || '',
        uploaded: profile.createdAt,
        status: docStatus
      });
    });
  }

  if (profile.customFolders && profile.customFolders.length > 0) {
    profile.customFolders.forEach((folder) => {
      const fName = folder.folderName || folder.name || 'Folder';
      if (folder.documents && folder.documents.length > 0) {
        folder.documents.forEach((doc) => {
          const customTitle = getCustomTitle(doc.fileUrl) || (doc._id && getCustomTitle(doc._id.toString())) || doc.fileTitle;
          const effectiveName = customTitle || doc.name;
          const fDocName = customTitle ? `${customTitle} (${fName})` : `${doc.name} (${fName})`;
          docs.push({
            id: doc._id ? doc._id.toString() : `DOC-FLD-${Math.random().toString(36).substring(7)}`,
            docType: 'customFolderDoc',
            name: fDocName,
            fileTitle: effectiveName,
            client: profile.fullName,
            category: fName,
            file: doc.fileUrl,
            notes: doc.notes || getNote(effectiveName) || getNote(doc.name) || getNote(fDocName),
            password: doc.password || getPassword(effectiveName) || getPassword(doc.name) || getPassword(fDocName) || '',
            uploaded: doc.uploadedAt || profile.createdAt,
            status: docStatus
          });
        });
      }
    });
  }
  
  // Link Submission mapping: simplify labels and attach submission details for staff
  const formSubmissions = profile.formSubmissions || [];
  docs.forEach(d => {
    const rawNote = d.notes ? String(d.notes) : '';
    const matchingSub = formSubmissions.find(sub => 
      sub.uploadedFiles && sub.uploadedFiles.some(f => f.fileUrl === d.file)
    );

    const isLinkDoc = matchingSub || (
      rawNote.toLowerCase().includes('link submission') || 
      rawNote.toLowerCase().includes('submitted via link') ||
      rawNote.toLowerCase().includes('client data collection form')
    );

    if (isLinkDoc) {
      d.notes = 'Link Submission';
      d.isLinkSubmission = true;
      const sub = matchingSub || formSubmissions[0];
      if (sub) {
        d.submissionDetails = {
          _id: sub._id,
          formId: sub.formId,
          formTitle: sub.formTitle || 'Client Data Collection Form',
          submittedAt: sub.submittedAt,
          submittedData: sub.submittedData || {},
          submittedFields: sub.submittedFields || [],
          uploadedFiles: sub.uploadedFiles || [],
          summaryText: sub.summaryText || '',
          sourceLabel: 'Link Submission'
        };
      }
    }
  });

  if (profile.documentOrder && Array.isArray(profile.documentOrder) && profile.documentOrder.length > 0) {
    const order = profile.documentOrder;
    docs.sort((a, b) => {
      const getRank = (item) => {
        let idx = order.indexOf(item.docType);
        if (idx !== -1) return idx;
        if (item.id && order.indexOf(item.id) !== -1) return order.indexOf(item.id);
        if (item.id && order.indexOf(`custom_${item.id}`) !== -1) return order.indexOf(`custom_${item.id}`);
        if (item.category && order.indexOf(item.category) !== -1) return order.indexOf(item.category);
        return 999;
      };
      return getRank(a) - getRank(b);
    });
  }

  return docs;
};

// @desc    Get all documents across all clients
// @route   GET /api/clients/documents/all
// @access  Private (Admin Only)
exports.getAllDocuments = async (req, res) => {
  try {
    const profiles = await ClientProfile.find().sort({ createdAt: -1 });
    let allDocs = [];
    profiles.forEach(p => {
      allDocs = allDocs.concat(extractDocuments(p));
    });
    res.json({ success: true, data: allDocs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get current user's documents
// @route   GET /api/clients/documents/my
// @access  Private (User Only)
exports.getMyDocuments = async (req, res) => {
  try {
    const profiles = await ClientProfile.find({ user: req.adminId }).sort({ createdAt: -1 });
    let allDocs = [];
    profiles.forEach(p => {
      allDocs = allDocs.concat(extractDocuments(p));
    });
    res.json({ success: true, data: allDocs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/clients/dashboard-stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    let filter = {};
    const Admin = require('../models/Admin');
    const userRole = await Admin.findById(req.adminId).select('role');
    
    if (userRole && userRole.role === 'staff') {
      filter = { user: req.adminId };
    }

    const profiles = await ClientProfile.find(filter).sort({ createdAt: -1 });
    
    const clientsCount = profiles.length;
    
    let totalDocs = 0;
    let recentDocuments = [];
    profiles.forEach(p => {
      const pDocs = extractDocuments(p);
      totalDocs += pDocs.length;
      recentDocuments = recentDocuments.concat(pDocs);
    });
    
    // Sort recent docs by date descending and take top 5
    recentDocuments.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
    recentDocuments = recentDocuments.slice(0, 5);

    const CibilReport = require('../models/CibilReport');
    let cibilFilter = {};
    if (userRole && userRole.role === 'staff') {
      cibilFilter = { user: req.adminId };
    }
    const cibilReports = await CibilReport.find(cibilFilter).sort({ createdAt: -1 }).limit(10);
    const cibilCount = await CibilReport.countDocuments(cibilFilter);

    // Client Overview (Last 7 days)
    const clientOverview = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // Count clients added up to this day for cumulative, or just on this day.
      // Usually overview line chart is cumulative or daily. Let's do cumulative.
      const count = profiles.filter(p => new Date(p.createdAt) <= d).length;
      clientOverview.push({ name: dateString, clients: count });
    }

    // Clients by Status
    let approved = 0, rejected = 0, pending = 0;
    profiles.forEach(p => {
      if (p.status === 'Approved') approved++;
      else if (p.status === 'Rejected') rejected++;
      else pending++;
    });

    const clientsByStatus = [
      { name: 'Active', value: approved, color: '#081326' },
      { name: 'Inactive', value: rejected, color: '#f59e0b' },
      { name: 'Pending', value: pending, color: '#d1d5db' },
    ];

    // Latest Clients
    const latestClients = profiles.slice(0, 5).map(p => ({
      _id: p._id,
      name: p.fullName,
      email: p.email,
      mobile: p.mobile,
      status: p.status === 'Approved' ? 'Active' : p.status === 'Rejected' ? 'Inactive' : 'Pending',
      createdAt: p.createdAt
    }));

    // Recent Activities (combine top 3 clients, 3 docs, 3 cibils)
    let activities = [];
    profiles.slice(0, 3).forEach(p => {
      activities.push({
        type: 'client',
        text: `New client "${p.fullName}" added`,
        highlight: p.fullName,
        time: p.createdAt
      });
    });
    recentDocuments.slice(0, 3).forEach(d => {
      activities.push({
        type: 'document',
        text: `Document "${d.name}" uploaded for ${d.client}`,
        highlight: d.name,
        time: d.uploaded
      });
    });
    cibilReports.slice(0, 3).forEach(c => {
      activities.push({
        type: 'cibil',
        text: `CIVIL Score checked for "${c.name}"`,
        highlight: c.name,
        time: c.createdAt
      });
    });

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    activities = activities.slice(0, 5);

    res.json({
      success: true,
      data: {
        totalClients: clientsCount,
        totalDocuments: totalDocs,
        totalCibilChecks: cibilCount,
        clientOverview,
        clientsByStatus,
        latestClients,
        recentDocuments,
        recentActivities: activities
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get client documents for public sharing (No login required)
// @route   GET /api/clients/shared/:id
// @access  Public
exports.getPublicSharedClientDocs = async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    let client = null;
    let sharedDocTokens = null;

    // 1. Check if rawId matches a short share link code (e.g. 'abc123')
    if (rawId && rawId.length <= 16) {
      const shareLink = await ShareLink.findOne({ code: rawId.toLowerCase() });
      if (shareLink) {
        client = await ClientProfile.findById(shareLink.clientId);
        sharedDocTokens = shareLink.documents || [];
      }
    }

    // 2. Fallback to direct client ObjectId / applicationId / refId
    if (!client) {
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        client = await ClientProfile.findById(rawId);
      }
    }
    
    if (!client) {
      client = await ClientProfile.findOne({
        $or: [
          { applicationId: rawId },
          { refId: rawId },
          { _id: rawId.length === 24 ? rawId : null }
        ].filter(Boolean)
      });
    }

    if (!client) {
      return res.status(404).json({ success: false, message: 'Documents not found or link has expired.' });
    }

    // Helper to sanitize URLs by stripping old localhost or external host prefixes for uploads
    const cleanDocUrl = (url) => {
      if (!url || typeof url !== 'string') return url;
      const trimmed = url.trim();
      if (trimmed.includes('/uploads/')) {
        return trimmed.substring(trimmed.indexOf('/uploads/'));
      }
      if (trimmed.includes('uploads/')) {
        return '/' + trimmed.substring(trimmed.indexOf('uploads/'));
      }
      return trimmed;
    };

    const documentsList = extractDocuments(client).map(doc => {
      const sanitized = {
        ...doc,
        url: cleanDocUrl(doc.file || doc.url)
      };
      // Internal visibility only: Never expose form submission data or submissionDetails to bankers
      delete sanitized.submissionDetails;
      delete sanitized.isLinkSubmission;
      if (sanitized.notes && (sanitized.notes.toLowerCase().includes('link submission') || sanitized.notes.toLowerCase().includes('submitted via link'))) {
        sanitized.notes = '';
      }
      return sanitized;
    });

    const customTitlesMap = client.documentCustomTitles || {};
    const getCustomTitle = (key) => {
      if (!key) return '';
      if (customTitlesMap instanceof Map) return customTitlesMap.get(key) || '';
      if (typeof customTitlesMap === 'object') return customTitlesMap[key] || '';
      return '';
    };

    const sanitizedCustomDocs = (client.customDocuments || []).map(cd => {
      let notes = cd.notes || '';
      if (notes.toLowerCase().includes('link submission') || notes.toLowerCase().includes('submitted via link')) {
        notes = '';
      }
      const customTitle = getCustomTitle(cd.fileUrl) || (cd._id && getCustomTitle(cd._id.toString())) || cd.fileTitle;
      return {
        _id: cd._id,
        name: customTitle || cd.name,
        fileTitle: customTitle || cd.fileTitle || cd.name,
        fileUrl: cleanDocUrl(cd.fileUrl),
        docType: cd.docType,
        category: cd.category,
        notes,
        password: cd.password || '',
        uploadedAt: cd.uploadedAt,
        uploadedByName: cd.uploadedByName
      };
    });

    const sanitizedFolders = (client.customFolders || []).map(f => ({
      _id: f._id,
      folderName: f.folderName || f.name,
      description: f.description,
      documents: (f.documents || []).map(d => {
        const customTitle = getCustomTitle(d.fileUrl) || (d._id && getCustomTitle(d._id.toString())) || d.fileTitle;
        return {
          _id: d._id,
          name: customTitle || d.name,
          fileTitle: customTitle || d.fileTitle || d.name,
          fileUrl: cleanDocUrl(d.fileUrl),
          notes: d.notes,
          password: d.password || '',
          uploadedAt: d.uploadedAt,
          uploadedByName: d.uploadedByName
        };
      })
    }));

    const sanitizedApplicants = (client.applicants || []).map((app, idx) => ({
      _id: app._id,
      fullName: app.fullName,
      dob: app.dob,
      age: app.dob ? calculateAge(app.dob) : (app.age || null),
      mobile: app.mobile,
      occupation: app.occupation,
      panNumber: app.panNumber,
      aadhaarNumber: app.aadhaarNumber,
      motherName: app.motherName,
      relationship: app.relationship || (idx === 0 ? 'Primary Applicant' : `Co-Applicant ${idx}`),
      addressLine1: app.addressLine1,
      city: app.city,
      state: app.state,
      pincode: app.pincode
    }));

    const clientAge = client.dob ? calculateAge(client.dob) : (client.age || null);

    res.json({
      success: true,
      data: {
        _id: client._id,
        fullName: client.fullName,
        dob: client.dob,
        age: clientAge,
        mobile: client.mobile,
        occupation: client.occupation,
        motherName: client.motherName,
        panNumber: client.panNumber,
        aadhaarNumber: client.aadhaarNumber,
        addressLine1: client.addressLine1,
        city: client.city,
        state: client.state,
        pincode: client.pincode,
        applicants: sanitizedApplicants,
        coApplicant: client.coApplicant,
        applicationId: client.applicationId || client.refId || `KTR-${client._id.toString().substring(18).toUpperCase()}`,
        caseType: client.caseType || client.loanType || 'Financial / Legal Documentation',
        loanType: client.loanType || client.caseType || 'Loan',
        loanAmount: client.loanAmount || 0,
        caseNotes: client.caseNotes || client.notes || '',
        notes: client.notes || client.caseNotes || '',
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        documentsList,
        customFolders: sanitizedFolders,
        customDocuments: sanitizedCustomDocs,
        panCardUrl: cleanDocUrl(client.panCardUrl),
        aadhaarUrl: cleanDocUrl(client.aadhaarUrl),
        salarySlipUrl: cleanDocUrl(client.salarySlipUrl),
        itrUrl: cleanDocUrl(client.itrUrl),
        form16Url: cleanDocUrl(client.form16Url),
        bankStatementUrl: cleanDocUrl(client.bankStatementUrl),
        propertyDocUrl: cleanDocUrl(client.propertyDocUrl),
        otherDocUrl: cleanDocUrl(client.otherDocUrl),
        photoUrl: cleanDocUrl(client.photoUrl),
        idProofUrl: cleanDocUrl(client.idProofUrl),
        addressProofUrl: cleanDocUrl(client.addressProofUrl),
        otherDocs: (client.otherDocs || []).map(cleanDocUrl),
        documentOrder: client.documentOrder || [],
        documentNotes: mapToPlainObject(client.documentNotes),
        documentPasswords: mapToPlainObject(client.documentPasswords),
        documentCustomTitles: mapToPlainObject(client.documentCustomTitles),
        selectedDocTokens: sharedDocTokens,
        bankerQueries: (client.bankerQueries || []).map(bq => ({
          _id: bq._id,
          queryText: bq.queryText,
          documentTitle: bq.documentTitle,
          bankerName: bq.bankerName,
          bankName: bq.bankName,
          priority: bq.priority,
          status: bq.status,
          staffResponse: bq.staffResponse,
          respondedByName: bq.respondedByName,
          respondedAt: bq.respondedAt,
          createdAt: bq.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get Public Shared Docs Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update client custom document serial order
// @route   PUT /api/clients/:id/document-order
// @access  Private
exports.updateDocumentOrder = async (req, res) => {
  try {
    const { documentOrder } = req.body;
    if (!Array.isArray(documentOrder)) {
      return res.status(400).json({ success: false, message: 'documentOrder must be an array of keys' });
    }

    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client.documentOrder = documentOrder;

    // Physically reorder customDocuments based on documentOrder
    if (client.customDocuments && client.customDocuments.length > 1) {
      client.customDocuments.sort((a, b) => {
        const idA = a._id ? a._id.toString() : '';
        const idB = b._id ? b._id.toString() : '';
        const getRank = (doc, idStr) => {
          let idx = -1;
          if (doc.fileUrl && (idx = documentOrder.indexOf(doc.fileUrl)) !== -1) return idx;
          if (idStr && (idx = documentOrder.indexOf(idStr)) !== -1) return idx;
          if (idStr && (idx = documentOrder.indexOf(`cd_${idStr}`)) !== -1) return idx;
          return 999999;
        };
        return getRank(a, idA) - getRank(b, idB);
      });
      client.markModified('customDocuments');
    }

    // Physically reorder customFolders.documents based on documentOrder
    if (client.customFolders && client.customFolders.length > 0) {
      client.customFolders.forEach(folder => {
        if (folder.documents && folder.documents.length > 1) {
          folder.documents.sort((a, b) => {
            const idA = a._id ? a._id.toString() : '';
            const idB = b._id ? b._id.toString() : '';
            const getRank = (doc, idStr) => {
              let idx = -1;
              if (doc.fileUrl && (idx = documentOrder.indexOf(doc.fileUrl)) !== -1) return idx;
              if (idStr && (idx = documentOrder.indexOf(idStr)) !== -1) return idx;
              return 999999;
            };
            return getRank(a, idA) - getRank(b, idB);
          });
        }
      });
      client.markModified('customFolders');
    }

    await client.save();

    res.json({
      success: true,
      message: 'Document and file serial order saved successfully',
      data: {
        documentOrder: client.documentOrder,
        documentsList: extractDocuments(client)
      }
    });
  } catch (error) {
    console.error('Update Document Order Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update document notes and password for client
// @route   PUT /api/clients/:id/document-notes
// @access  Private
exports.updateDocumentNotes = async (req, res) => {
  try {
    const { docName, notes, password, docId, fileUrl } = req.body;
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const noteText = (notes || '').trim();
    const pwdText = (password || '').trim();

    if (!client.documentNotes) {
      client.documentNotes = new Map();
    }
    if (!client.documentPasswords) {
      client.documentPasswords = new Map();
    }

    if (docName) {
      client.documentNotes.set(docName.trim(), noteText);
      client.documentPasswords.set(docName.trim(), pwdText);
    }

    // Update in customDocuments if found
    if (client.customDocuments && client.customDocuments.length > 0) {
      client.customDocuments.forEach(cd => {
        if ((docId && cd._id?.toString() === docId.toString()) || 
            (docName && cd.name?.trim() === docName.trim()) ||
            (fileUrl && cd.fileUrl === fileUrl)) {
          cd.notes = noteText;
          cd.password = pwdText;
        }
      });
    }

    // Update in customFolders if found
    if (client.customFolders && client.customFolders.length > 0) {
      client.customFolders.forEach(f => {
        (f.documents || []).forEach(fDoc => {
          if ((docId && fDoc._id?.toString() === docId.toString()) || 
              (docName && fDoc.name?.trim() === docName.trim()) ||
              (fileUrl && fDoc.fileUrl === fileUrl)) {
            fDoc.notes = noteText;
            fDoc.password = pwdText;
          }
        });
      });
    }

    client.markModified('documentNotes');
    client.markModified('documentPasswords');
    client.markModified('customDocuments');
    client.markModified('customFolders');
    await client.save();

    res.json({
      success: true,
      message: 'Document note and password updated successfully',
      data: {
        docName,
        notes: noteText,
        password: pwdText,
        client
      }
    });
  } catch (error) {
    console.error('Update doc notes error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update / rename document title (category or individual file)
// @route   PUT /api/clients/:id/document-title
// @access  Private (Admin / Staff)
exports.updateDocumentTitle = async (req, res) => {
  try {
    const { targetType, oldTitle, newTitle, docId, fileUrl, folderId } = req.body;
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    if (!newTitle || !newTitle.trim()) {
      return res.status(400).json({ success: false, message: 'New document title cannot be empty' });
    }

    const trimmedNew = newTitle.trim();
    const trimmedOld = (oldTitle || '').trim();
    const uploaderName = req.user?.name || 'Staff/Admin';

    if (!client.documentCustomTitles) {
      client.documentCustomTitles = new Map();
    }
    if (!client.documentNotes) {
      client.documentNotes = new Map();
    }
    if (!client.documentPasswords) {
      client.documentPasswords = new Map();
    }
    if (!client.documentOrder) {
      client.documentOrder = [];
    }

    if (targetType === 'group' || (!docId && !fileUrl)) {
      // 1. RENAMING A GROUP / CATEGORY
      const prevGroup = trimmedOld || 'Document';

      // Update customDocuments matching this group
      if (client.customDocuments && client.customDocuments.length > 0) {
        client.customDocuments.forEach(cd => {
          const normName = getNormalizedDocName(cd.name);
          const isGroupMatch = (cd.category && cd.category.trim().toLowerCase() === prevGroup.toLowerCase()) ||
                              (normName && normName.toLowerCase() === prevGroup.toLowerCase()) ||
                              (cd.name && cd.name.trim().toLowerCase() === prevGroup.toLowerCase());
          if (isGroupMatch) {
            cd.category = trimmedNew;
            if (cd.name.trim().toLowerCase() === prevGroup.toLowerCase()) {
              cd.name = trimmedNew;
            } else if (normName && normName.toLowerCase() === prevGroup.toLowerCase()) {
              // Replace prefix in cd.name, e.g. "Salary Slip (1/2)" -> "Form 16 (1/2)"
              const suffix = cd.name.substring(normName.length);
              cd.name = trimmedNew + suffix;
            }
          }
        });
      }

      // Update customFolders if folderName or document category matches
      if (client.customFolders && client.customFolders.length > 0) {
        client.customFolders.forEach(f => {
          if (f.folderName && f.folderName.trim().toLowerCase() === prevGroup.toLowerCase()) {
            f.folderName = trimmedNew;
          }
          (f.documents || []).forEach(fDoc => {
            const normName = getNormalizedDocName(fDoc.name);
            if ((fDoc.category && fDoc.category.trim().toLowerCase() === prevGroup.toLowerCase()) ||
                (normName && normName.toLowerCase() === prevGroup.toLowerCase())) {
              fDoc.category = trimmedNew;
              if (fDoc.name.trim().toLowerCase() === prevGroup.toLowerCase()) {
                fDoc.name = trimmedNew;
              }
            }
          });
        });
      }

      // Migrate notes if keyed by old group title
      if (client.documentNotes.has(prevGroup)) {
        const noteVal = client.documentNotes.get(prevGroup);
        client.documentNotes.set(trimmedNew, noteVal);
        client.documentNotes.delete(prevGroup);
      }

      // Migrate passwords if keyed by old group title
      if (client.documentPasswords.has(prevGroup)) {
        const pwdVal = client.documentPasswords.get(prevGroup);
        client.documentPasswords.set(trimmedNew, pwdVal);
        client.documentPasswords.delete(prevGroup);
      }

      // Update documentOrder
      client.documentOrder = client.documentOrder.map(item => (item === prevGroup ? trimmedNew : item));

      // Record in documentCustomTitles
      client.documentCustomTitles.set(sanitizeMapKey(prevGroup), trimmedNew);
      if (fileUrl) {
        client.documentCustomTitles.set(sanitizeMapKey(fileUrl), trimmedNew);
      }

      // Add to editHistory
      if (!client.editHistory) client.editHistory = [];
      client.editHistory.push({
        editedBy: req.user?._id || req.adminId,
        editorName: uploaderName,
        editorRole: req.user?.role || 'staff',
        action: 'Document Category Renamed',
        details: `Renamed document category "${prevGroup}" to "${trimmedNew}"`,
        timestamp: new Date()
      });

    } else {
      // 2. RENAMING AN INDIVIDUAL FILE
      let matched = false;

      // Update customDocuments
      if (client.customDocuments && client.customDocuments.length > 0) {
        client.customDocuments.forEach(cd => {
          const isDocMatch = (docId && cd._id?.toString() === docId.toString()) ||
                             (fileUrl && cd.fileUrl === fileUrl);
          if (isDocMatch) {
            cd.fileTitle = trimmedNew;
            // Ensure group category is preserved
            const currentGroup = trimmedOld ? getNormalizedDocName(trimmedOld) : getNormalizedDocName(cd.name);
            if (!cd.category || ['Document', 'Case Document', 'General Documents', 'Uploaded File'].includes(cd.category)) {
              if (currentGroup) cd.category = currentGroup;
            }
            matched = true;
          }
        });
      }

      // Update customFolders
      if (client.customFolders && client.customFolders.length > 0) {
        client.customFolders.forEach(f => {
          (f.documents || []).forEach(fDoc => {
            const isDocMatch = (docId && fDoc._id?.toString() === docId.toString()) ||
                               (fileUrl && fDoc.fileUrl === fileUrl);
            if (isDocMatch) {
              fDoc.fileTitle = trimmedNew;
              matched = true;
            }
          });
        });
      }

      // Save in documentCustomTitles
      if (fileUrl) {
        client.documentCustomTitles.set(sanitizeMapKey(fileUrl), trimmedNew);
      }
      if (docId) {
        client.documentCustomTitles.set(sanitizeMapKey(docId.toString()), trimmedNew);
      }

      // Add to editHistory
      if (!client.editHistory) client.editHistory = [];
      client.editHistory.push({
        editedBy: req.user?._id || req.adminId,
        editorName: uploaderName,
        editorRole: req.user?.role || 'staff',
        action: 'Document File Renamed',
        details: `Renamed document file "${trimmedOld || 'File'}" to "${trimmedNew}"`,
        timestamp: new Date()
      });
    }

    client.markModified('documentCustomTitles');
    client.markModified('documentNotes');
    client.markModified('documentPasswords');
    client.markModified('documentOrder');
    client.markModified('customDocuments');
    client.markModified('customFolders');
    client.markModified('editHistory');
    await client.save();

    const clientData = client.toObject();
    clientData.documentCustomTitles = mapToPlainObject(client.documentCustomTitles);
    clientData.documentNotes = mapToPlainObject(client.documentNotes);
    clientData.documentPasswords = mapToPlainObject(client.documentPasswords);

    res.json({
      success: true,
      message: 'Document title updated successfully',
      data: {
        client: clientData,
        documentsList: extractDocuments(client)
      }
    });
  } catch (error) {
    console.error('Update document title error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Raise a Query from Banker Document Portal (Public)
// @route   POST /api/clients/shared/:id/query
// @access  Public
exports.addBankerQuery = async (req, res) => {
  try {
    const rawId = req.params.id;
    const { queryText, documentTitle, bankerName, bankerDesignation, bankName, bankerMobile, bankerEmail, priority } = req.body;

    if (!queryText || !queryText.trim()) {
      return res.status(400).json({ success: false, message: 'Query message is required.' });
    }

    let client = null;
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      client = await ClientProfile.findById(rawId);
    }
    if (!client) {
      client = await ClientProfile.findOne({
        $or: [
          { applicationId: rawId },
          { refId: rawId },
          { _id: rawId.length === 24 ? rawId : null }
        ].filter(Boolean)
      });
    }

    if (!client) {
      return res.status(404).json({ success: false, message: 'Case not found or link has expired.' });
    }

    const newQuery = {
      queryText: queryText.trim(),
      documentTitle: (documentTitle || 'General Case Query').trim(),
      bankerName: (bankerName || 'Bank Official').trim(),
      bankerDesignation: (bankerDesignation || '').trim(),
      bankName: (bankName || '').trim(),
      bankerMobile: (bankerMobile || '').trim(),
      bankerEmail: (bankerEmail || '').trim(),
      priority: ['Normal', 'High', 'Urgent'].includes(priority) ? priority : 'Normal',
      status: 'Pending',
      whatsappLogs: [
        {
          recipientType: 'Staff',
          messageType: 'Banker Query Notification',
          status: 'Logged',
          sentAt: new Date()
        }
      ],
      createdAt: new Date()
    };

    if (!client.bankerQueries) {
      client.bankerQueries = [];
    }

    client.bankerQueries.unshift(newQuery);

    // Format banker details for pendency description
    const bankerInfo = [
      newQuery.bankerName,
      newQuery.bankerDesignation ? `(${newQuery.bankerDesignation})` : '',
      newQuery.bankName ? `- ${newQuery.bankName}` : '',
      newQuery.bankerMobile ? `[📞 ${newQuery.bankerMobile}]` : ''
    ].filter(Boolean).join(' ');

    // Push into Pendencies so staff can track and resolve it directly in the Pendency section
    const newPendency = {
      title: `Banker Query: ${newQuery.documentTitle}`,
      description: `${newQuery.queryText}\n\nRaised by: ${bankerInfo || 'Bank Official'}${newQuery.bankerEmail ? ` | Email: ${newQuery.bankerEmail}` : ''}`,
      status: 'Pending',
      addedAt: new Date(),
      addedByName: newQuery.bankerName ? `${newQuery.bankerName} (Banker)` : 'Bank Official'
    };

    if (!client.pendencies) client.pendencies = [];
    client.pendencies.unshift(newPendency);

    await client.save();

    res.json({
      success: true,
      message: 'Your query has been submitted successfully to the case handling team.',
      data: newQuery
    });
  } catch (error) {
    console.error('Add Banker Query Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Staff / Admin respond to Banker Query
// @route   POST /api/clients/:id/banker-queries/:queryId/respond
// @access  Private (Staff/Admin)
exports.respondBankerQuery = async (req, res) => {
  try {
    const { id, queryId } = req.params;
    const { staffResponse, status } = req.body;

    const client = await ClientProfile.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const query = (client.bankerQueries || []).id(queryId);
    if (!query) {
      return res.status(404).json({ success: false, message: 'Query not found.' });
    }

    if (staffResponse !== undefined) {
      query.staffResponse = staffResponse.trim();
    }
    if (status) {
      query.status = status;
    }
    query.respondedBy = req.adminId || null;
    query.respondedByName = req.user?.name || 'Staff';
    query.respondedAt = new Date();

    // Prepare WhatsApp automated log entry for client/banker communication
    query.whatsappLogs.push({
      recipientType: 'Banker',
      recipientMobile: query.bankerMobile || '',
      messageType: 'Staff Query Resolution',
      status: 'Logged',
      sentAt: new Date()
    });

    if (!client.editHistory) client.editHistory = [];
    client.editHistory.push({
      editedBy: req.adminId,
      editorName: req.user?.name || 'Staff',
      editorRole: req.user?.role || 'staff',
      action: 'Banker Query Responded',
      details: `Status: ${query.status} | Response: ${query.staffResponse || 'Updated'}`,
      timestamp: new Date()
    });

    await client.save();

    res.json({
      success: true,
      message: 'Query response saved successfully.',
      data: client.bankerQueries
    });
  } catch (error) {
    console.error('Respond Banker Query Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete / Dismiss Banker Query
// @route   DELETE /api/clients/:id/banker-queries/:queryId
// @access  Private (Staff/Admin)
exports.deleteBankerQuery = async (req, res) => {
  try {
    const { id, queryId } = req.params;
    const client = await ClientProfile.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const queryToDelete = (client.bankerQueries || []).find(q => q._id.toString() === queryId.toString());
    client.bankerQueries = (client.bankerQueries || []).filter(q => q._id.toString() !== queryId.toString());

    if (queryToDelete) {
      if (!client.editHistory) client.editHistory = [];
      client.editHistory.push({
        editedBy: req.user?._id || req.adminId,
        editorName: req.user?.name || 'Staff/Admin',
        editorRole: req.user?.role || 'staff',
        action: 'Banker Query Removed',
        details: `Removed banker query from ${queryToDelete.bankerName || 'Banker'} (${queryToDelete.bankName || 'Bank'}): "${queryToDelete.queryText || ''}"`,
        timestamp: new Date()
      });
    }

    await client.save();

    res.json({
      success: true,
      message: 'Banker query removed successfully.',
      data: client.bankerQueries
    });
  } catch (error) {
    console.error('Delete Banker Query Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Generate or retrieve a short branded share link for client documents
// @route   POST /api/clients/:id/share-link or POST /api/clients/shared/:id/share-link
// @access  Public / Private
exports.createShareLink = async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    const { documents } = req.body;

    let client = null;
    if (rawId && rawId.length <= 16) {
      const existingShare = await ShareLink.findOne({ code: rawId.toLowerCase() });
      if (existingShare) {
        client = await ClientProfile.findById(existingShare.clientId);
      }
    }
    if (!client && mongoose.Types.ObjectId.isValid(rawId)) {
      client = await ClientProfile.findById(rawId);
    }
    if (!client) {
      client = await ClientProfile.findOne({
        $or: [
          { applicationId: rawId },
          { refId: rawId },
          { _id: rawId.length === 24 ? rawId : null }
        ].filter(Boolean)
      });
    }

    if (!client) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Clean documents list: array of string tokens
    const docList = Array.isArray(documents) ? documents.filter(d => typeof d === 'string' && d.trim().length > 0).map(d => d.trim()) : [];
    docList.sort();

    // Helper to generate a random 6-character alphanumeric code
    const generateCode = () => {
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Check if an existing active ShareLink matches this client and exact document set
    let existingLink = null;
    if (docList.length === 0) {
      existingLink = await ShareLink.findOne({
        clientId: client._id,
        $or: [{ documents: { $size: 0 } }, { documents: { $exists: false } }]
      });
    } else {
      existingLink = await ShareLink.findOne({
        clientId: client._id,
        documents: { $all: docList, $size: docList.length }
      });
    }

    if (existingLink) {
      return res.json({
        success: true,
        code: existingLink.code,
        shortUrl: `https://ktrconsultants.in/d/${existingLink.code}`
      });
    }

    // Generate a unique 6-character code
    let code = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      code = generateCode();
      const duplicate = await ShareLink.findOne({ code });
      if (!duplicate) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      code = client._id.toString().slice(-6);
    }

    const shareLink = new ShareLink({
      code,
      clientId: client._id,
      documents: docList
    });

    await shareLink.save();

    res.json({
      success: true,
      code,
      shortUrl: `https://ktrconsultants.in/d/${code}`
    });
  } catch (error) {
    console.error('Create Share Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

