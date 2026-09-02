const CAQuote = require('../models/CAQuote');

const generateQuoteId = () => {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `KTR-CAQ-${ts}${rand}`;
};

// @desc    Submit a CA quote / application request (public)
// @route   POST /api/ca-quotes/submit
exports.submitQuote = async (req, res) => {
  try {
    const { serviceType, fullName, mobile, email, city, businessName, businessConstitution, message } = req.body;
    if (!serviceType || !fullName || !mobile) {
      return res.status(400).json({ success: false, message: 'Full Name and Mobile Number are required.' });
    }

    const quoteId = generateQuoteId();

    // Process uploaded documents if any
    let documents = [];
    if (req.files && req.files.length > 0) {
      documents = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        url: `/uploads/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
      }));
    }

    const quote = await CAQuote.create({
      quoteId,
      serviceType,
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      email: email ? email.trim() : '',
      city: city.trim(),
      businessName: businessName ? businessName.trim() : '',
      businessConstitution: businessConstitution ? businessConstitution.trim() : '',
      message: message ? message.trim() : '',
      documents
    });

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: quote });
  } catch (error) {
    console.error('Error submitting CA quote/application:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// @desc    Get all CA quotes (admin)
// @route   GET /api/ca-quotes
exports.getAllQuotes = async (req, res) => {
  try {
    const quotes = await CAQuote.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get new quotes count (admin)
// @route   GET /api/ca-quotes/new-count
exports.getNewCount = async (req, res) => {
  try {
    const count = await CAQuote.countDocuments({ status: 'New' });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update quote status (admin)
// @route   PATCH /api/ca-quotes/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['New', 'In Discussion', 'Quote Sent', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const quote = await CAQuote.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update quote remark (admin)
// @route   PATCH /api/ca-quotes/:id/remark
exports.updateRemark = async (req, res) => {
  try {
    const { remark } = req.body;
    const quote = await CAQuote.findByIdAndUpdate(req.params.id, { remark }, { new: true });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete quote (admin)
// @route   DELETE /api/ca-quotes/:id
exports.deleteQuote = async (req, res) => {
  try {
    const quote = await CAQuote.findByIdAndDelete(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    res.status(200).json({ success: true, message: 'Quote deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
