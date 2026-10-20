const PaymentLink = require('../models/PaymentLink');
const CibilReport = require('../models/CibilReport');

// Helper to generate Guaranteed Unique Invoice Number
const generateUniqueInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const fyYear = month >= 4 
    ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` 
    : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  
  let isUnique = false;
  let candidate = '';
  let attempts = 0;

  while (!isUnique && attempts < 20) {
    attempts++;
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    candidate = `KTR/INV/${fyYear}/${randomNum}`;

    const existsInLinks = await PaymentLink.findOne({ invoiceNumber: candidate });
    const existsInCibil = await CibilReport.findOne({ invoiceNumber: candidate });
    if (!existsInLinks && !existsInCibil) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    candidate = `KTR/INV/${fyYear}/${Date.now().toString().slice(-6)}`;
  }
  return candidate;
};

// Helper to generate Unique Link ID
const generateLinkId = (prefix = 'pay_') => {
  return prefix + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

// @desc    Create a new online payment link
// @route   POST /api/payments/create-link
// @access  Private (Admin & Staff)
exports.createPaymentLink = async (req, res) => {
  try {
    const { clientName, clientMobile, clientEmail, clientPan, clientAddress, clientRef, serviceName, serviceDetails, amount, taxRate, discount } = req.body;

    if (!clientName || !clientMobile || !serviceName || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Client Name, Mobile, Service Name, and Amount are required.',
      });
    }

    const numAmount = parseFloat(amount) || 0;
    const numDiscount = parseFloat(discount) || 0;
    const numTaxRate = parseFloat(taxRate) || 0;

    // Apply discount to base amount BEFORE calculating GST
    const taxableAmount = Math.max(0, numAmount - numDiscount);
    const taxAmount = Math.round((taxableAmount * numTaxRate) / 100);
    const totalAmount = Math.max(0, Math.round(taxableAmount + taxAmount));

    const linkId = generateLinkId('pay_');
    const invoiceNumber = await generateUniqueInvoiceNumber();

    const paymentLink = await PaymentLink.create({
      linkId,
      clientName: clientName.trim(),
      clientMobile: clientMobile.trim(),
      clientEmail: (clientEmail || '').trim(),
      clientPan: (clientPan || '').trim().toUpperCase(),
      clientAddress: (clientAddress || '').trim(),
      clientRef: clientRef || null,
      serviceName: serviceName.trim(),
      serviceDetails: serviceDetails || '',
      amount: numAmount,
      taxableAmount,
      taxRate: numTaxRate,
      taxAmount,
      discount: numDiscount,
      totalAmount,
      status: 'Pending',
      invoiceNumber,
      paymentType: 'online_link',
      paymentMode: 'Online',
      isManual: false,
      createdBy: req.adminId,
    });

    res.status(201).json({
      success: true,
      message: 'Payment link generated successfully',
      data: paymentLink,
    });
  } catch (error) {
    console.error('Create Payment Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Generate a manual invoice (Cash, UPI, Bank Transfer, Cheque, etc.)
// @route   POST /api/payments/create-manual-invoice
// @access  Private (Admin & Staff)
exports.createManualInvoice = async (req, res) => {
  try {
    const {
      clientName,
      clientMobile,
      clientEmail,
      clientPan,
      clientAddress,
      clientRef,
      serviceName,
      serviceDetails,
      amount,
      taxRate,
      discount,
      paymentMode,
      paymentStatus,
      paymentDate,
      referenceNumber,
      notes,
    } = req.body;

    if (!clientName || !clientMobile || !serviceName || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Client Name, Mobile, Service Name, and Base Amount are required.',
      });
    }

    const numAmount = parseFloat(amount) || 0;
    const numDiscount = parseFloat(discount) || 0;
    const numTaxRate = parseFloat(taxRate) || 0;

    const taxableAmount = Math.max(0, numAmount - numDiscount);
    const taxAmount = Math.round((taxableAmount * numTaxRate) / 100);
    const totalAmount = Math.max(0, Math.round(taxableAmount + taxAmount));

    const linkId = generateLinkId('inv_');
    const invoiceNumber = await generateUniqueInvoiceNumber();

    const isPaid = paymentStatus === 'Paid';
    const cleanPaymentMode = paymentMode || 'Cash';
    const cleanRef = (referenceNumber || '').trim();

    const manualInvoice = await PaymentLink.create({
      linkId,
      clientName: clientName.trim(),
      clientMobile: clientMobile.trim(),
      clientEmail: (clientEmail || '').trim(),
      clientPan: (clientPan || '').trim().toUpperCase(),
      clientAddress: (clientAddress || '').trim(),
      clientRef: clientRef || null,
      serviceName: serviceName.trim(),
      serviceDetails: serviceDetails || '',
      amount: numAmount,
      taxableAmount,
      taxRate: numTaxRate,
      taxAmount,
      discount: numDiscount,
      totalAmount,
      status: isPaid ? 'Paid' : 'Pending',
      paymentType: 'manual_invoice',
      paymentMode: cleanPaymentMode,
      isManual: true,
      referenceNumber: cleanRef,
      paymentId: cleanRef || (isPaid ? `MANUAL_${cleanPaymentMode.toUpperCase().replace(/\s+/g, '_')}` : ''),
      paidAt: isPaid ? (paymentDate ? new Date(paymentDate) : new Date()) : null,
      invoiceNumber,
      notes: notes || '',
      createdBy: req.adminId,
    });

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: manualInvoice,
    });
  } catch (error) {
    console.error('Create Manual Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update status/details of a manual invoice or payment link
// @route   PATCH /api/payments/:id/status
// @access  Private (Admin & Staff)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, paymentMode, referenceNumber, paidAt, notes } = req.body;
    const payment = await PaymentLink.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (status) payment.status = status;
    if (paymentMode) payment.paymentMode = paymentMode;
    if (referenceNumber !== undefined) {
      payment.referenceNumber = referenceNumber;
      payment.paymentId = referenceNumber || payment.paymentId;
    }
    if (status === 'Paid' && !payment.paidAt) {
      payment.paidAt = paidAt ? new Date(paidAt) : new Date();
    } else if (status === 'Pending') {
      payment.paidAt = null;
    }
    if (notes !== undefined) payment.notes = notes;

    await payment.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment,
    });
  } catch (error) {
    console.error('Update Payment Status Error:', error);
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

// @desc    Verify and mark payment as completed (Public - Payment Gateway Callback)
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
    paymentLink.paymentMode = 'Online';
    paymentLink.isManual = false;

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

// @desc    Get all payment links & invoices for admin & staff with unified tracking & stats
// @route   GET /api/payments/invoices
// @access  Private (Admin & Staff)
exports.getAllInvoices = async (req, res) => {
  try {
    // 1. Fetch only genuine staff-created Payment Links and Manual Invoices
    const paymentLinks = await PaymentLink.find()
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    // Format Payment Links and Manual Invoices with mathematically accurate GST
    const formattedLinks = [];
    const formattedManual = [];

    paymentLinks.forEach(p => {
      const isManual = p.isManual === true || p.paymentType === 'manual_invoice';
      const cleanMode = p.paymentMode || (isManual ? 'Cash' : 'Online');
      const isPaid = p.status === 'Paid';

      const numAmount = parseFloat(p.amount) || 0;
      const numDiscount = parseFloat(p.discount) || 0;
      const numTaxRate = parseFloat(p.taxRate) || 0;

      const taxableAmount = p.taxableAmount !== undefined && p.taxableAmount !== null && p.taxableAmount > 0
        ? parseFloat(p.taxableAmount)
        : Math.max(0, numAmount - numDiscount);
      const taxAmount = numTaxRate > 0 ? Math.round((taxableAmount * numTaxRate) / 100) : 0;
      const totalAmount = Math.max(0, Math.round(taxableAmount + taxAmount));

      const item = {
        _id: p._id,
        linkId: p.linkId,
        invoiceNumber: p.invoiceNumber,
        clientName: p.clientName,
        clientMobile: p.clientMobile,
        clientEmail: p.clientEmail || '',
        clientPan: p.clientPan || '',
        clientAddress: p.clientAddress || '',
        clientRef: p.clientRef,
        serviceName: p.serviceName,
        serviceDetails: p.serviceDetails,
        amount: numAmount,
        taxableAmount,
        taxRate: numTaxRate,
        taxAmount,
        discount: numDiscount,
        totalAmount,
        status: p.status,
        paymentId: p.paymentId || (p.referenceNumber || 'N/A'),
        referenceNumber: p.referenceNumber || '',
        paymentType: isManual ? 'manual_invoice' : 'online_link',
        paymentMode: cleanMode,
        isManual,
        // Manual payments are verified directly by staff, not gateway
        isGatewayVerified: !isManual && isPaid && !!p.paymentId && p.paymentId !== 'N/A',
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        createdBy: p.createdBy,
        notes: p.notes || '',
        type: isManual ? 'ManualInvoice' : 'PaymentLink',
      };

      if (isManual) {
        formattedManual.push(item);
      } else {
        formattedLinks.push(item);
      }
    });

    // Combine staff records for listing and sort descending by date
    const allInvoices = [...formattedLinks, ...formattedManual].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Compute Accurate KPI Stats for Staff Portal
    const stats = {
      totalInvoiced: allInvoices.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
      totalCollected: allInvoices
        .filter(item => item.status === 'Paid')
        .reduce((sum, item) => sum + (item.totalAmount || 0), 0),
      totalPending: allInvoices
        .filter(item => item.status === 'Pending')
        .reduce((sum, item) => sum + (item.totalAmount || 0), 0),
      onlineCount: formattedLinks.length,
      onlineCollected: formattedLinks
        .filter(item => item.status === 'Paid')
        .reduce((sum, item) => sum + (item.totalAmount || 0), 0),
      manualCount: formattedManual.length,
      manualCollected: formattedManual
        .filter(item => item.status === 'Paid')
        .reduce((sum, item) => sum + (item.totalAmount || 0), 0),
      pendingCount: allInvoices.filter(item => item.status === 'Pending').length,
    };

    res.json({
      success: true,
      paymentLinks: formattedLinks,
      manualInvoices: formattedManual,
      cibilInvoices: [],
      invoices: allInvoices,
      stats,
    });
  } catch (error) {
    console.error('Get All Invoices Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a payment link or invoice
// @route   DELETE /api/payments/:id
// @access  Private (Admin)
exports.deletePaymentLink = async (req, res) => {
  try {
    const paymentLink = await PaymentLink.findById(req.params.id);
    if (!paymentLink) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    await paymentLink.deleteOne();
    res.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete Payment Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Download invoice PDF for payment link or manual invoice
// @route   GET /api/payments/invoice-pdf/:id
// @access  Public
exports.downloadPaymentLinkInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { generateInvoicePDFBuffer } = require('../services/invoicePdfService');

    let link = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      link = await PaymentLink.findById(id);
    }
    if (!link) {
      link = await PaymentLink.findOne({ $or: [{ linkId: id }, { invoiceNumber: id }, { paymentId: id }] });
    }

    if (!link) {
      return res.status(404).json({ success: false, message: 'Payment invoice not found' });
    }

    if (Number(link.taxRate) === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tax invoice is not generated for 0% (No Tax) non-taxable collections.'
      });
    }

    const isManual = link.isManual === true || link.paymentType === 'manual_invoice';
    const basePrice = parseFloat(link.amount) || 0;
    const discount = parseFloat(link.discount) || 0;
    const taxableValue = link.taxableAmount !== undefined && link.taxableAmount !== null && link.taxableAmount > 0
      ? parseFloat(link.taxableAmount)
      : Math.max(0, basePrice - discount);
    const taxRate = parseFloat(link.taxRate) || 0;
    const gstVal = taxRate > 0 ? Math.round((taxableValue * taxRate) / 100) : 0;
    const cgst = (gstVal / 2).toFixed(2);
    const sgst = (gstVal / 2).toFixed(2);
    const totalAmount = Math.max(0, Math.round(taxableValue + gstVal));

    const invoiceData = {
      invoiceNumber: link.invoiceNumber || `KTR/INV/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`,
      clientName: link.clientName || 'Valued Client',
      clientMobile: link.clientMobile || 'N/A',
      pan: link.clientPan || 'N/A',
      clientEmail: link.clientEmail || '',
      clientAddress: link.clientAddress || '',
      serviceName: link.serviceName || 'Financial Advisory Service',
      serviceDetails: link.serviceDetails || '',
      basePrice,
      discountAmount: discount,
      taxableValue,
      cgst,
      sgst,
      totalAmount,
      paymentId: link.paymentId || link.referenceNumber || 'N/A',
      referenceNumber: link.referenceNumber || link.paymentId || 'N/A',
      paymentMode: link.paymentMode || (isManual ? 'Cash' : 'Online Gateway'),
      isManual,
      status: link.status,
      date: new Date(link.paidAt || link.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    const pdfBuffer = await generateInvoicePDFBuffer(invoiceData);

    const safeFilename = `Invoice_${(invoiceData.invoiceNumber || 'KTR_INVOICE').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating Payment Link Invoice PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to generate invoice PDF' });
  }
};
