const ChainDeed = require('../models/ChainDeed');
const path = require('path');

const generateAppId = () => {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `KTR-CD-${ts}${rand}`;
};

// @desc    Submit a Chain Deed Application (public)
// @route   POST /api/chain-deeds/submit
exports.submitApplication = async (req, res) => {
  try {
    const { deedType, name, mobile, email, paymentId, amountPaid } = req.body;
    
    if (!deedType || !name || !mobile || !paymentId || !amountPaid) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Registry document must be uploaded.' });
    }

    const applicationId = generateAppId();
    const documentUrl = `/uploads/${req.file.filename}`;
    const documentName = req.file.originalname;

    const application = await ChainDeed.create({
      applicationId,
      deedType,
      name,
      mobile,
      email: email || '',
      paymentId,
      amountPaid: Number(amountPaid),
      documentUrl,
      documentName
    });

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: application });
  } catch (error) {
    console.error('Error submitting Chain Deed:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// @desc    Get all applications (admin)
// @route   GET /api/chain-deeds
exports.getAllApplications = async (req, res) => {
  try {
    const apps = await ChainDeed.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get new count (admin)
// @route   GET /api/chain-deeds/new-count
exports.getNewCount = async (req, res) => {
  try {
    const count = await ChainDeed.countDocuments({ status: 'New' });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update status (admin)
// @route   PATCH /api/chain-deeds/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['New', 'Processing', 'Completed', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const app = await ChainDeed.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.status(200).json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update remark (admin)
// @route   PATCH /api/chain-deeds/:id/remark
exports.updateRemark = async (req, res) => {
  try {
    const { remark } = req.body;
    const app = await ChainDeed.findByIdAndUpdate(req.params.id, { remark }, { new: true });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.status(200).json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete application (admin)
// @route   DELETE /api/chain-deeds/:id
exports.deleteApplication = async (req, res) => {
  try {
    const app = await ChainDeed.findByIdAndDelete(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.status(200).json({ success: true, message: 'Application deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
