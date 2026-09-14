const PaymentLink = require('../models/PaymentLink');
const CibilReport = require('../models/CibilReport');

// Helper to generate Invoice Number
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `KTR/INV/${year}/${randomNum}`;
};

// Helper to generate Unique Link ID
const generateLinkId = () => {
  return 'pay_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

// @desc    Create a new payment link
// @route   POST /api/payments/create-link
// @access  Private (Admin)
exports.createPaymentLink = async (req, res) => {
  try {
    const { clientName, clientMobile, serviceName, serviceDetails, amount, taxRate, discount } = req.body;

    if (!clientName || !clientMobile || !serviceName || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Client Name, Mobile, Service Name, and Amount are required.',
      });
    }

    const numAmount = parseFloat(amount) || 0;
    const numTaxRate = parseFloat(taxRate) || 0;
    const numDiscount = parseFloat(discount) || 0;

    const taxAmount = Math.round((numAmount * numTaxRate) / 100);
    const totalAmount = Math.max(0, Math.round(numAmount + taxAmount - numDiscount));

    const linkId = generateLinkId();
    const invoiceNumber = generateInvoiceNumber();

    const paymentLink = await PaymentLink.create({
      linkId,
      clientName,
      clientMobile,
      serviceName,
      serviceDetails: serviceDetails || '',
      amount: numAmount,
      taxRate: numTaxRate,
      taxAmount,
      discount: numDiscount,
      totalAmount,
      status: 'Pending',
      invoiceNumber,
      createdBy: req.adminId,
    });

    res.status(201).json({
      success: true,
      message: 'Payment link created successfully',
      data: paymentLink,
    });
  } catch (error) {
    console.error('Create Payment Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get payment link details by linkId (Public)
// @route   GET /api/payments/link/:linkId
// @access  Public
exports.getPaymentLinkById = async (req, res) => {
  try {
    const { linkId } = req.params;
    const paymentLink = await PaymentLink.findOne({ linkId });

    if (!paymentLink) {
      return res.status(404).json({ success: false, message: 'Payment link not found or expired' });
    }

    res.json({ success: true, data: paymentLink });
  } catch (error) {
    console.error('Get Payment Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Verify and mark payment as completed (Public)
// @route   POST /api/payments/verify-link
// @access  Public
exports.verifyLinkPayment = async (req, res) => {
  try {
    const { linkId, paymentId } = req.body;

    const paymentLink = await PaymentLink.findOne({ linkId });
    if (!paymentLink) {
      return res.status(404).json({ success: false, message: 'Payment link not found' });
    }

    paymentLink.status = 'Paid';
    paymentLink.paymentId = paymentId || `PAY_${Date.now()}`;
    paymentLink.paidAt = new Date();

    await paymentLink.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: paymentLink,
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get all payment links & invoices for admin
// @route   GET /api/payments/invoices
// @access  Private (Admin)
exports.getAllInvoices = async (req, res) => {
  try {
    // 1. Fetch Payment Links
    const paymentLinks = await PaymentLink.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // 2. Fetch CIBIL Report Invoices for unified tracking
    const cibilReports = await CibilReport.find({ invoiceNumber: { $exists: true, $ne: '' } })
      .sort({ createdAt: -1 });

    // Format CIBIL reports to unified structure
    const formattedCibil = cibilReports.map(c => ({
      _id: c._id,
      invoiceNumber: c.invoiceNumber,
      clientName: c.fullName || 'N/A',
      clientMobile: c.mobile || 'N/A',
      serviceName: `CIBIL / ${c.bureau || 'Bureau'} Report`,
      serviceDetails: `CIBIL Report check for ${c.pan || 'PAN'}`,
      amount: parseFloat(c.amountPaid) || 500,
      taxRate: 18,
      taxAmount: Math.round(((parseFloat(c.amountPaid) || 500) * 18) / 118), // Included GST calculation
      discount: 0,
      totalAmount: parseFloat(c.amountPaid) || 500,
      status: c.status === 'failed' ? 'Failed' : 'Paid',
      paymentId: c.paymentId || 'N/A',
      paidAt: c.createdAt,
      createdAt: c.createdAt,
      type: 'CIBIL',
    }));

    // Format Payment Links
    const formattedLinks = paymentLinks.map(p => ({
      _id: p._id,
      linkId: p.linkId,
      invoiceNumber: p.invoiceNumber,
      clientName: p.clientName,
      clientMobile: p.clientMobile,
      serviceName: p.serviceName,
      serviceDetails: p.serviceDetails,
      amount: p.amount,
      taxRate: p.taxRate,
      taxAmount: p.taxAmount,
      discount: p.discount,
      totalAmount: p.totalAmount,
      status: p.status,
      paymentId: p.paymentId || 'N/A',
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      createdBy: p.createdBy,
      type: 'PaymentLink',
    }));

    // Combine and sort by createdAt descending
    const allInvoices = [...formattedLinks, ...formattedCibil].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      paymentLinks: formattedLinks,
      invoices: allInvoices,
    });
  } catch (error) {
    console.error('Get All Invoices Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a payment link
// @route   DELETE /api/payments/:id
// @access  Private (Admin)
exports.deletePaymentLink = async (req, res) => {
  try {
    const paymentLink = await PaymentLink.findById(req.params.id);
    if (!paymentLink) {
      return res.status(404).json({ success: false, message: 'Payment link not found' });
    }

    await paymentLink.deleteOne();
    res.json({ success: true, message: 'Payment link deleted successfully' });
  } catch (error) {
    console.error('Delete Payment Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
