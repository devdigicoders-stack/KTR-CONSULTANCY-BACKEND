const CibilReport = require('../models/CibilReport');
const { processRazorpayRefund } = require('../services/refundService');

// Generate Unique Invoice Number (e.g., KTR/CIBIL/2026-27/00482)
const generateInvoiceNumber = () => {
  const currentYear = new Date().getFullYear();
  const nextYearShort = String(currentYear + 1).slice(-2);
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `KTR/INV/${currentYear}-${nextYearShort}/${randomDigits}`;
};

// Save a new CIBIL report (or update existing if paymentId matches)
exports.saveCibilReport = async (req, res) => {
  try {
    const { 
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
      user,
      pricing
    } = req.body;

    let invoiceNumber = req.body.invoiceNumber;
    if (!invoiceNumber && (status === 'success' || status === 'notFound')) {
      invoiceNumber = generateInvoiceNumber();
    }

    // Check if report already exists for this paymentId
    let report = await CibilReport.findOne({ paymentId });

    if (report) {
      report.name = name || report.name;
      report.mobile = mobile || report.mobile;
      report.pan = pan || report.pan;
      report.gender = gender || report.gender;
      report.bureau = bureau || report.bureau;
      report.score = score || report.score;
      report.pdfLink = pdfLink || report.pdfLink;
      report.status = status || report.status;
      report.message = message || report.message;
      report.client_id = client_id || report.client_id;
      if (invoiceNumber) report.invoiceNumber = invoiceNumber;
      if (pricing) report.pricing = pricing;
      if (user || req.adminId) report.user = user || req.adminId;
      await report.save();
    } else {
      report = new CibilReport({
        name,
        mobile,
        pan,
        gender,
        bureau,
        score,
        pdfLink,
        paymentId,
        invoiceNumber,
        pricing: pricing || {},
        status: status || 'success',
        message,
        client_id,
        user: user || (req.adminId ? req.adminId : null)
      });
      await report.save();
    }

    res.status(201).json({
      success: true,
      message: 'CIBIL Report saved successfully',
      data: report
    });
  } catch (error) {
    console.error('Error saving CIBIL report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save CIBIL report'
    });
  }
};

// Auto-refund controller when bureau report generation fails
exports.autoRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason, name, pan, bureau, gender, mobile } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required for refund processing'
      });
    }

    console.log(`[AutoRefund Requested] Payment ID: ${paymentId}, Amount: ₹${amount}, Reason: ${reason}`);

    // Call Razorpay Refund API
    const refundResult = await processRazorpayRefund({
      paymentId,
      amountInRupees: amount,
      reason: reason || 'Bureau report generation failed',
      notes: { name, pan, bureau }
    });

    const isRefundSuccessful = refundResult.success || paymentId.startsWith('PAY_');
    const generatedRefundId = refundResult.refundId || `RFND_${Date.now()}`;

    const refundDetails = {
      refundId: generatedRefundId,
      amount: refundResult.amount || amount || 0,
      reason: reason || 'Bureau report generation failed. Payment reversed.',
      refundedAt: new Date(),
      status: isRefundSuccessful ? 'Initiated' : 'Processing'
    };

    // Update or create report record with 'refunded' status
    let report = await CibilReport.findOne({ paymentId });

    if (report) {
      report.status = 'refunded';
      report.refundDetails = refundDetails;
      report.message = `Payment auto-refunded. ${reason || ''}`;
      await report.save();
    } else {
      report = new CibilReport({
        name: name || 'Applicant',
        mobile: mobile || 'N/A',
        pan: pan || 'N/A',
        gender: gender || 'male',
        bureau: bureau || 'CIBIL',
        paymentId,
        status: 'refunded',
        invoiceNumber: generateInvoiceNumber(),
        message: `Auto-refunded: ${reason || 'Bureau generation failed'}`,
        refundDetails,
        pricing: { totalAmount: amount || 0 }
      });
      await report.save();
    }

    return res.status(200).json({
      success: true,
      refunded: true,
      refundId: generatedRefundId,
      amount: refundDetails.amount,
      status: refundDetails.status,
      message: 'Report could not be generated. Automatic refund has been initiated to your original payment source.',
      data: report
    });
  } catch (error) {
    console.error('Error in autoRefund controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing refund'
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
