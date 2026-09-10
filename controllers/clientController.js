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
    if (files.otherDocs) {
      docUpdates.otherDocs = files.otherDocs.map(f => `/uploads/${f.filename}`);
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
        addressLine1: req.body.coApplicant_addressLine1 || '',
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
    if (files.otherDocs) {
      docUpdates.otherDocs = files.otherDocs.map(f => `/uploads/${f.filename}`);
    }

    // Merge existing docs with new ones (we don't delete old ones from FS here for simplicity)
    const updatedData = {
      ...req.body,
      ...docUpdates
    };

    const updatedClient = await ClientProfile.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    res.json({ success: true, message: 'Client updated successfully', data: updatedClient });
  } catch (error) {
    console.error('Update Client Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
      name: 'PAN Card',
      client: profile.fullName,
      category: 'Identity Proof',
      file: profile.panCardUrl,
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.idProofUrl) {
    docs.push({
      id: `DOC-ID-${profile._id.toString().substring(18)}`,
      name: `ID Proof (${profile.idProofType || 'Aadhaar'})`,
      client: profile.fullName,
      category: 'Identity Proof',
      file: profile.idProofUrl,
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  if (profile.addressProofUrl) {
    docs.push({
      id: `DOC-ADDR-${profile._id.toString().substring(18)}`,
      name: 'Address Proof',
      client: profile.fullName,
      category: 'Address Proof',
      file: profile.addressProofUrl,
      uploaded: profile.createdAt,
      status: docStatus
    });
  }
  
  if (profile.otherDocs && profile.otherDocs.length > 0) {
    profile.otherDocs.forEach((url, i) => {
      docs.push({
        id: `DOC-OTH-${profile._id.toString().substring(18)}-${i}`,
        name: `Other Document ${i+1}`,
        client: profile.fullName,
        category: 'Additional',
        file: url,
        uploaded: profile.createdAt,
        status: docStatus
      });
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
