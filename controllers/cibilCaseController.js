const CibilCase = require('../models/CibilCase');
const path = require('path');

// Generate unique Case ID
const generateCaseId = () => {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `KTR-FLR-${ts}${rand}`;
};

// @desc    Submit a new CIBIL case (public, with file upload)
// @route   POST /api/cibil-cases/submit
exports.submitCase = async (req, res) => {
  try {
    const { name, mobile, pan, lenderName, disputedAmount, accountNumber, notes, paymentId } = req.body;
    if (!name || !mobile || !pan) {
      return res.status(400).json({ success: false, message: 'Name, Mobile, and PAN are required.' });
    }

    const caseId = generateCaseId();
    const panFileUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const panFileName = req.file ? req.file.originalname : '';

    const newCase = await CibilCase.create({
      caseId, name, mobile, pan, lenderName, disputedAmount, accountNumber, notes,
      paymentId: paymentId || '',
      panFileUrl, panFileName
    });

    res.status(201).json({ success: true, message: 'Case submitted successfully', data: newCase });
  } catch (error) {
    console.error('Error submitting case:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again.' });
  }
};

// @desc    Get all cases (admin)
// @route   GET /api/cibil-cases
exports.getAllCases = async (req, res) => {
  try {
    const cases = await CibilCase.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get new cases count
// @route   GET /api/cibil-cases/new-count
exports.getNewCount = async (req, res) => {
  try {
    const count = await CibilCase.countDocuments({ status: 'New' });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update case status
// @route   PATCH /api/cibil-cases/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['New', 'Under Review', 'Resolved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const doc = await CibilCase.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Case not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update case remark
// @route   PATCH /api/cibil-cases/:id/remark
exports.updateRemark = async (req, res) => {
  try {
    const { remark } = req.body;
    const doc = await CibilCase.findByIdAndUpdate(req.params.id, { remark }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Case not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete case
// @route   DELETE /api/cibil-cases/:id
exports.deleteCase = async (req, res) => {
  try {
    const doc = await CibilCase.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Case not found' });
    res.status(200).json({ success: true, message: 'Case deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
