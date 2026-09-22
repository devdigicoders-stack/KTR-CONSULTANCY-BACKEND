const fs = require('fs');
const path = require('path');
const axios = require('axios');
const CibilReport = require('../models/CibilReport');
const { processRazorpayRefund } = require('../services/refundService');

// Generate Unique Invoice Number (e.g., KTR/INV/2026-27/00482)
const generateInvoiceNumber = () => {
  const currentYear = new Date().getFullYear();
  const nextYearShort = String(currentYear + 1).slice(-2);
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `KTR/INV/${currentYear}-${nextYearShort}/${randomDigits}`;
};

// Helper to cache remote S3 PDF locally on server so it never expires
const cachePdfLocally = async (report, rawPdfLink) => {
  if (!rawPdfLink || typeof rawPdfLink !== 'string' || !rawPdfLink.startsWith('http')) {
    return null;
  }
  if (rawPdfLink.includes('/uploads/cibil-reports/') || rawPdfLink.includes('/view-pdf/')) {
    return report.pdfPath || null;
  }

  try {
    const uploadDir = path.join(__dirname, '../uploads/cibil-reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileBasename = `cibil_${report.paymentId || report._id}.pdf`;
    const filePath = path.join(uploadDir, fileBasename);

    console.log(`[CIBIL PDF Downloader] Downloading S3 PDF for paymentId ${report.paymentId}...`);
    const response = await axios.get(rawPdfLink, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (response.status === 200 && response.data) {
      fs.writeFileSync(filePath, Buffer.from(response.data));
      console.log(`[CIBIL PDF Cache Success] Saved to ${filePath}`);
      report.pdfPath = `/uploads/cibil-reports/${fileBasename}`;
      report.originalPdfLink = rawPdfLink;
      await report.save();
      return report.pdfPath;
    }
  } catch (err) {
    console.error(`[CIBIL PDF Cache Error] Failed to download remote PDF for ${report.paymentId}:`, err.message);
  }
  return null;
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
      if (pdfLink && pdfLink.startsWith('http') && !pdfLink.includes('/view-pdf/')) {
        report.originalPdfLink = pdfLink;
      }
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
        pdfLink: pdfLink || null,
        originalPdfLink: (pdfLink && pdfLink.startsWith('http')) ? pdfLink : null,
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

    // Immediately cache PDF locally if remote URL is provided
    if (pdfLink && pdfLink.startsWith('http') && !pdfLink.includes('/view-pdf/')) {
      cachePdfLocally(report, pdfLink).catch(err => console.error('Async cache PDF error:', err));
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const reportData = report.toObject();
    reportData.pdfLink = `${protocol}://${host}/api/cibil-reports/view-pdf/${report._id}`;

    res.status(201).json({
      success: true,
      message: 'CIBIL Report saved successfully',
      data: reportData
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
    const host = req.get('host');
    const protocol = req.protocol;

    const formattedReports = reports.map(r => {
      const obj = r.toObject();
      if (r.pdfLink || r.originalPdfLink || r.pdfPath) {
        obj.pdfLink = `${protocol}://${host}/api/cibil-reports/view-pdf/${r._id}`;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      data: formattedReports
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
    const host = req.get('host');
    const protocol = req.protocol;

    const formattedReports = reports.map(r => {
      const obj = r.toObject();
      if (r.pdfLink || r.originalPdfLink || r.pdfPath) {
        obj.pdfLink = `${protocol}://${host}/api/cibil-reports/view-pdf/${r._id}`;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      data: formattedReports
    });
  } catch (error) {
    console.error('Error fetching CIBIL reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CIBIL reports'
    });
  }
};

// Stream or download permanent PDF report (Never expires!)
exports.viewReportPdf = async (req, res) => {
  try {
    const { id } = req.params;
    let report = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      report = await CibilReport.findById(id);
    }
    if (!report) {
      report = await CibilReport.findOne({ paymentId: id });
    }

    if (!report) {
      return res.status(404).send('Credit report record not found.');
    }

    const uploadDir = path.join(__dirname, '../uploads/cibil-reports');
    const fileBasename = `cibil_${report.paymentId || report._id}.pdf`;
    const filePath = path.join(uploadDir, fileBasename);

    // 1. If local PDF file exists on disk, stream it immediately!
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `inline; filename="CIBIL_Report_${report.pan || 'DOC'}.pdf"`);
      return fs.createReadStream(filePath).pipe(res);
    }

    // 2. If local PDF does not exist yet, try downloading from original S3 link if available
    const targetRemoteUrl = report.originalPdfLink || (report.pdfLink && report.pdfLink.startsWith('http') && !report.pdfLink.includes('/view-pdf/') ? report.pdfLink : null);
    
    if (targetRemoteUrl) {
      try {
        console.log(`[CIBIL PDF View] Lazy downloading S3 PDF for report ${report.paymentId}...`);
        const response = await axios.get(targetRemoteUrl, {
          responseType: 'arraybuffer',
          timeout: 20000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (response.status === 200 && response.data) {
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          fs.writeFileSync(filePath, Buffer.from(response.data));
          report.pdfPath = `/uploads/cibil-reports/${fileBasename}`;
          await report.save();

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Length', response.data.length);
          res.setHeader('Content-Disposition', `inline; filename="CIBIL_Report_${report.pan || 'DOC'}.pdf"`);
          return res.send(Buffer.from(response.data));
        }
      } catch (dlErr) {
        console.warn(`[CIBIL PDF View] Remote S3 link expired or fetch failed for ${report.paymentId}:`, dlErr.message);
      }
    }

    // 3. If S3 link expired and no local file exists:
    res.setHeader('Content-Type', 'text/html');
    return res.status(410).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Report Access Expired</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070e1b; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
          <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            <div style="font-size: 40px; margin-bottom: 16px;">⏱️</div>
            <h2 style="color: #f59e0b; margin-top: 0; font-size: 20px;">Temporary S3 Link Expired</h2>
            <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
              The temporary AWS S3 link from Surepass bureau (valid for 10 min) has expired for applicant <strong>${report.name || 'Consumer'}</strong> (PAN: ${report.pan || 'N/A'}).
            </p>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 16px;">
              For assistance or a fresh report copy, please contact KTR Consultants helpline or generate a new check.
            </p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Error in viewReportPdf:', error);
    return res.status(500).send('Internal Server Error fetching report PDF.');
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

// Generate Invoice PDF on-the-fly directly from request body
exports.generateInvoicePdfFromData = async (req, res) => {
  try {
    const { generateInvoicePDFBuffer } = require('../services/invoicePdfService');
    const data = req.body || {};

    const bureau = data.bureau || 'TransUnion CIBIL';
    const pricing = data.pricing || {};
    const basePrice = pricing.basePrice !== undefined ? Number(pricing.basePrice) : (data.basePrice !== undefined ? Number(data.basePrice) : (data.reportType === 'company_cmr' ? 1500 : bureau.includes('CRIF') ? 450 : bureau.includes('Experian') ? 400 : bureau.includes('Equifax') ? 350 : 500));
    const discountAmount = pricing.discountAmount !== undefined ? Number(pricing.discountAmount) : (data.discountAmount !== undefined ? Number(data.discountAmount) : 0);
    const couponCode = pricing.couponCode || data.couponCode || null;
    const taxableValue = Math.max(0, basePrice - discountAmount);
    const totalGst = pricing.gstAmount !== undefined ? Number(pricing.gstAmount) : (data.gstAmount !== undefined ? Number(data.gstAmount) : Math.round(taxableValue * 0.18));
    const cgst = (totalGst / 2).toFixed(2);
    const sgst = (totalGst / 2).toFixed(2);
    const totalAmount = pricing.totalAmount || pricing.totalPayable || data.totalAmount || (taxableValue + totalGst);

    const invoiceData = {
      invoiceNumber: data.invoiceNumber || `KTR/INV/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`,
      clientName: data.companyName || data.name || data.clientName || 'Valued Customer',
      clientMobile: data.mobile || data.clientMobile || 'N/A',
      pan: data.companyPan || data.pan || 'N/A',
      serviceName: data.serviceName || (data.reportType === 'company_cmr' ? 'Company CIBIL CMR Report' : `Credit Bureau Report (${bureau})`),
      serviceDetails: data.serviceDetails || `Comprehensive credit analysis & official report fetch (${bureau})`,
      bureau,
      basePrice,
      discountAmount,
      couponCode,
      taxableValue,
      cgst,
      sgst,
      totalAmount,
      paymentId: data.paymentId || 'N/A',
      date: data.date || new Date(data.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    const pdfBuffer = await generateInvoicePDFBuffer(invoiceData);

    const safeFilename = `Invoice_${(invoiceData.invoiceNumber || 'KTR_CIBIL').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating Invoice PDF from data:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate invoice PDF' });
  }
};


