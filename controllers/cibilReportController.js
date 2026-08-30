const CibilReport = require('../models/CibilReport');

// Save a new CIBIL report
exports.saveCibilReport = async (req, res) => {
  try {
    const { name, mobile, pan, gender, bureau, score, pdfLink, paymentId, status, message, client_id, user } = req.body;

    const newReport = new CibilReport({
      name,
      mobile,
      pan,
      gender,
      bureau,
      score,
      pdfLink,
      paymentId,
      status,
      message,
      client_id,
      user: user || (req.adminId ? req.adminId : null)
    });

    await newReport.save();

    res.status(201).json({
      success: true,
      message: 'CIBIL Report saved successfully',
      data: newReport
    });
  } catch (error) {
    console.error('Error saving CIBIL report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save CIBIL report'
    });
  }
};

// Get all CIBIL reports for Admin
exports.getAllCibilReports = async (req, res) => {
  try {
    const reports = await CibilReport.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching CIBIL reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CIBIL reports'
    });
  }
};

// Get current user's CIBIL reports
exports.getMyCibilReports = async (req, res) => {
  try {
    const reports = await CibilReport.find({ user: req.adminId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching CIBIL reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CIBIL reports'
    });
  }
};

// Delete a CIBIL report
exports.deleteCibilReport = async (req, res) => {
  try {
    const report = await CibilReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'CIBIL Report not found' });
    }
    await CibilReport.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'CIBIL Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting CIBIL report:', error);
    res.status(500).json({ success: false, message: 'Failed to delete CIBIL report' });
  }
};
