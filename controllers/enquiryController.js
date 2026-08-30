const Enquiry = require('../models/Enquiry');

// @desc    Submit a new enquiry (public)
// @route   POST /api/enquiries/submit
exports.submitEnquiry = async (req, res) => {
  try {
    const { fullName, email, phone, subject, serviceInterested, message } = req.body;
    if (!fullName || !phone || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }
    const enquiry = await Enquiry.create({ fullName, email, phone, subject, serviceInterested, message });
    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: enquiry });
  } catch (error) {
    console.error('Error submitting enquiry:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again.' });
  }
};

// @desc    Get all enquiries (admin)
// @route   GET /api/enquiries
exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: enquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get unread enquiries count
// @route   GET /api/enquiries/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Enquiry.countDocuments({ status: 'Unread' });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update enquiry status
// @route   PATCH /api/enquiries/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Unread', 'Read', 'Replied'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update enquiry remark
// @route   PATCH /api/enquiries/:id/remark
exports.updateRemark = async (req, res) => {
  try {
    const { remark } = req.body;
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { remark }, { new: true });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete enquiry
// @route   DELETE /api/enquiries/:id
exports.deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.status(200).json({ success: true, message: 'Enquiry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
