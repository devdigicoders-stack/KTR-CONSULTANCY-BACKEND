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
      pricing,
      reportType,
      companyName,
      companyType,
      companyPan,
      doi,
      companyAddress,
      pinCode,
      email,
      directors
    } = req.body;

    let invoiceNumber = req.body.invoiceNumber;
    if (!invoiceNumber && (status === 'success' || status === 'notFound' || status === 'pending_fulfillment')) {
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
      if (reportType) report.reportType = reportType;
      if (companyName) report.companyName = companyName;
      if (companyType) report.companyType = companyType;
      if (companyPan) report.companyPan = companyPan;
      if (doi) report.doi = doi;
      if (companyAddress) report.companyAddress = companyAddress;
      if (pinCode) report.pinCode = pinCode;
      if (email) report.email = email;
      if (directors) report.directors = directors;
      await report.save();
    } else {
      report = new CibilReport({
        name,
        mobile,
        pan,
        gender: gender || 'N/A',
        bureau: bureau || 'Company CMR (TransUnion CIBIL)',
        score,
        pdfLink,
        paymentId,
        invoiceNumber,
        pricing: pricing || {},
        status: status || 'success',
        message,
        client_id,
        user: user || (req.adminId ? req.adminId : null),
        reportType: reportType || 'individual',
        companyName: companyName || null,
        companyType: companyType || null,
        companyPan: companyPan || null,
        doi: doi || null,
        companyAddress: companyAddress || null,
        pinCode: pinCode || null,
        email: email || null,
        directors: directors || []
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

// Download Invoice PDF directly as attachment
exports.downloadInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { generateInvoicePDFBuffer } = require('../services/invoicePdfService');

    let report = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      report = await CibilReport.findById(id);
    }
    if (!report) {
      report = await CibilReport.findOne({ paymentId: id });
    }

    if (!report) {
      return res.status(404).json({ success: false, message: 'Invoice / Report record not found' });
    }

    const bureau = report.bureau || 'TransUnion CIBIL';
    const pricing = report.pricing || {};
    const basePrice = pricing.basePrice || (report.reportType === 'company_cmr' ? 1500 : bureau.includes('CRIF') ? 450 : bureau.includes('Experian') ? 400 : bureau.includes('Equifax') ? 350 : 500);
    const discountAmount = pricing.discountAmount || 0;
    const couponCode = pricing.couponCode || null;
    const taxableValue = Math.max(0, basePrice - discountAmount);
    const totalGst = pricing.gstAmount !== undefined ? pricing.gstAmount : Math.round(taxableValue * 0.18);
    const cgst = (totalGst / 2).toFixed(2);
    const sgst = (totalGst / 2).toFixed(2);
    const totalAmount = pricing.totalAmount || pricing.totalPayable || (taxableValue + totalGst);

    const invoiceData = {
      invoiceNumber: report.invoiceNumber || `KTR/INV/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`,
      clientName: report.companyName || report.name || 'Valued Customer',
      clientMobile: report.mobile || 'N/A',
      pan: report.companyPan || report.pan || 'N/A',
      serviceName: report.reportType === 'company_cmr' ? 'Company CIBIL CMR Report' : `Credit Bureau Report (${bureau})`,
      serviceDetails: `Comprehensive credit analysis & official report fetch (${bureau})`,
      bureau,
      basePrice,
      discountAmount,
      couponCode,
      taxableValue,
      cgst,
      sgst,
      totalAmount,
      paymentId: report.paymentId || 'N/A',
      date: new Date(report.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    const pdfBuffer = await generateInvoicePDFBuffer(invoiceData);

    const safeFilename = `Invoice_${(invoiceData.invoiceNumber || 'KTR_CIBIL').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating Invoice PDF:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate invoice PDF' });
  }
};

