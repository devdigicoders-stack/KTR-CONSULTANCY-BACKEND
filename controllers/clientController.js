const ClientProfile = require('../models/ClientProfile');

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

    let coApplicantObj = null;
    if (req.body.hasCoApplicant === 'true' || req.body.hasCoApplicant === true) {
      coApplicantObj = {
        fullName: req.body.coApplicant_fullName || '',
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

    const profileData = {
      ...req.body,
      ...docUpdates,
      hasCoApplicant: req.body.hasCoApplicant === 'true' || req.body.hasCoApplicant === true,
      ...(coApplicantObj ? { coApplicant: coApplicantObj } : {}),
      user: userId,
      status: 'Pending'
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
// @access  Private (User Only)
exports.getMyClients = async (req, res) => {
  try {
    const clients = await ClientProfile.find({ user: req.adminId }).populate('user', 'name email').sort({ createdAt: -1 });
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
    const clients = await ClientProfile.find().populate('user', 'name email').sort({ createdAt: -1 });
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

// @desc    Update client status (Approve/Reject)
// @route   PATCH /api/clients/:id/status
// @access  Private (Admin Only)
exports.updateClientStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client.status = status;
    if (adminRemarks) {
      client.adminRemarks = adminRemarks;
    }

    await client.save();
    res.json({ success: true, message: `Client profile marked as ${status}`, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
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

    const { docType, docName, category, folderId } = req.body;
    const baseCategory = category || (docType && docType !== 'otherDocs' && docType !== 'customDocument' ? docType : 'Document');
    const uploaderName = req.user?.name || 'Staff';
    const addedDocNames = [];

    if (!client.customDocuments) client.customDocuments = [];
    if (!client.otherDocs) client.otherDocs = [];

    // If target is a custom folder
    let targetFolder = null;
    if (folderId && client.customFolders) {
      targetFolder = client.customFolders.id(folderId);
    }

    uploadedFiles.forEach((file, index) => {
      const fileUrl = `/uploads/${file.filename}`;
      let displayName = '';

      if (uploadedFiles.length === 1) {
        displayName = docName || file.originalname || 'Document';
      } else {
        if (docName) {
          displayName = `${docName} (Part ${index + 1})`;
        } else {
          displayName = file.originalname;
        }
      }

      if (targetFolder) {
        targetFolder.documents.push({
          name: displayName,
          fileUrl: fileUrl,
          category: `Folder: ${targetFolder.folderName || targetFolder.name}`,
          uploadedAt: new Date(),
          uploadedByName: uploaderName
        });
      } else if (docType && docType !== 'otherDocs' && docType !== 'customDocument' && client[docType] !== undefined && index === 0) {
        // Standard document slot (e.g. panCardUrl, itrUrl, propertyDocUrl)
        if (client[docType]) {
          client.deletedDocuments.push({
            docType,
            docName: `${displayName} (Replaced)`,
            fileUrl: client[docType],
            deletedBy: req.user?._id || req.adminId,
            deletedByName: uploaderName,
            deletedAt: new Date(),
            reason: 'Replaced with new document'
          });
        }
        client[docType] = fileUrl;
      } else {
        // Custom named standalone document stored separately
        client.customDocuments.push({
          name: displayName,
          fileUrl: fileUrl,
          category: baseCategory,
          uploadedAt: new Date(),
          uploadedByName: uploaderName
        });
        client.otherDocs.push(fileUrl);
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
    } else if (docType === 'otherDocs' || (client.otherDocs && client.otherDocs.includes(fileUrl))) {
      client.otherDocs = client.otherDocs.filter(url => url !== fileUrl);
    } else {
      // Search standard doc fields to clear match
      const standardFields = ['photoUrl', 'panCardUrl', 'idProofUrl', 'addressProofUrl', 'aadhaarUrl', 'salarySlipUrl', 'itrUrl', 'form16Url', 'bankStatementUrl', 'propertyDocUrl', 'otherDocUrl'];
      standardFields.forEach(field => {
        if (client[field] === fileUrl) {
          client[field] = null;
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

    const folder = client.customFolders.id(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    const folderName = folder.folderName;

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

    client.customFolders.pull({ _id: req.params.folderId });

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

    const folder = client.customFolders.id(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const docName = req.body.docName || req.file.originalname;
    const fileUrl = `/uploads/${req.file.filename}`;

    const newDoc = {
      name: docName,
      fileUrl: fileUrl,
      category: `Folder: ${folder.folderName}`,
      uploadedAt: new Date(),
      uploadedByName: req.user?.name || 'Staff/Admin'
    };

    folder.documents.push(newDoc);

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: req.user?.name || 'Staff/Admin',
      editorRole: req.user?.role || 'staff',
      action: 'File Uploaded to Folder',
      details: `Uploaded "${docName}" into folder "${folder.folderName}"`,
      timestamp: new Date()
    });

    await client.save();

    res.json({
      success: true,
      message: `File uploaded to folder "${folder.folderName}"`,
      data: {
        folder,
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

    const folder = client.customFolders.id(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    const doc = folder.documents.id(req.params.docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found in folder' });
    }

    const docName = doc.name;
    const fileUrl = doc.fileUrl;

    // Backup to deletedDocuments
    client.deletedDocuments.push({
      docType: 'customFolderFile',
      docName: `${docName} (Folder: ${folder.folderName})`,
      fileUrl: fileUrl,
      deletedBy: req.user?._id || req.adminId,
      deletedByName: req.user?.name || 'Staff/Admin',
      deletedAt: new Date(),
      reason: req.body.reason || `Deleted from folder "${folder.folderName}"`
    });

    folder.documents.pull({ _id: req.params.docId });

    client.editHistory.push({
      editedBy: req.user?._id || req.adminId,
      editorName: req.user?.name || 'Staff/Admin',
      editorRole: req.user?.role || 'staff',
      action: 'File Soft-Deleted from Folder',
      details: `Deleted "${docName}" from folder "${folder.folderName}" (Backed up in DB)`,
      timestamp: new Date()
    });

    await client.save();

    res.json({
      success: true,
      message: `File deleted from folder "${folder.folderName}"`,
      data: {
        folder,
        documentsList: extractDocuments(client)
      }
    });
  } catch (error) {
    console.error('Delete Folder File Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete client and related data
// @route   DELETE /api/clients/:id
// @access  Private (Admin Only)
exports.deleteClient = async (req, res) => {
  try {
    const client = await ClientProfile.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Delete related CreditInfo
    const CreditInfo = require('../models/CreditInfo');
    await CreditInfo.findOneAndDelete({ client: client._id });

    // Delete related CibilReport
    const CibilReport = require('../models/CibilReport');
    await CibilReport.deleteMany({ client_id: client._id.toString() });

    // Delete the client
    await ClientProfile.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Client and associated data deleted successfully' });
  } catch (error) {
    console.error('Delete Client Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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

// Helper function to extract documents from a profile
const extractDocuments = (profile) => {
  const docs = [];
  const statusMapping = {
    'Approved': 'Verified',
    'Pending': 'Pending',
    'Rejected': 'Rejected'
  };
  const docStatus = statusMapping[profile.status] || 'Pending';

  if (profile.panCardUrl) {
    docs.push({
      id: `DOC-PAN-${profile._id.toString().substring(18)}`,
      docType: 'panCardUrl',
      name: 'PAN Card',
      client: profile.fullName,
      category: 'PAN Card',
      file: profile.panCardUrl,
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
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.idProofUrl) {
    docs.push({
      id: `DOC-ID-${profile._id.toString().substring(18)}`,
      docType: 'idProofUrl',
      name: `ID Proof (${profile.idProofType || 'Identity'})`,
      client: profile.fullName,
      category: 'ID Proof',
      file: profile.idProofUrl,
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
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  
  if (profile.otherDocs && profile.otherDocs.length > 0) {
    profile.otherDocs.forEach((url, i) => {
      docs.push({
        id: `DOC-OTH-${profile._id.toString().substring(18)}-${i}`,
        docType: 'otherDocs',
        name: `Additional Document ${i+1}`,
        client: profile.fullName,
        category: 'Other Documents',
        file: url,
        uploaded: profile.createdAt,
        status: docStatus
      });
    });
  }

  if (profile.customDocuments && profile.customDocuments.length > 0) {
    profile.customDocuments.forEach((doc) => {
      docs.push({
        id: doc._id ? doc._id.toString() : `DOC-CUS-${Math.random().toString(36).substring(7)}`,
        docType: 'customDocument',
        name: doc.name || 'Document',
        client: profile.fullName,
        category: doc.category || 'General Document',
        file: doc.fileUrl,
        uploaded: doc.uploadedAt || profile.createdAt,
        status: docStatus
      });
    });
  }

  if (profile.customFolders && profile.customFolders.length > 0) {
    profile.customFolders.forEach((folder) => {
      const fName = folder.folderName || folder.name || 'Folder';
      if (folder.documents && folder.documents.length > 0) {
        folder.documents.forEach((doc) => {
          docs.push({
            id: doc._id ? doc._id.toString() : `DOC-FLD-${Math.random().toString(36).substring(7)}`,
            docType: 'customFolderDoc',
            name: `${doc.name} (${fName})`,
            client: profile.fullName,
            category: fName,
            file: doc.fileUrl,
            uploaded: doc.uploadedAt || profile.createdAt,
            status: docStatus
          });
        });
      }
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
