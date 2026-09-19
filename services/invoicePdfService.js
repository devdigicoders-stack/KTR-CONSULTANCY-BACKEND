const PDFDocument = require('pdfkit');

/**
 * Generate a professional Tax Invoice PDF buffer using PDFKit
 * @param {Object} invoiceData
 * @returns {Promise<Buffer>}
 */
function generateInvoicePDFBuffer(invoiceData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const {
        invoiceNumber = 'KTR/INV/2026/001',
        clientName = 'Customer',
        clientMobile = 'N/A',
        pan = 'N/A',
        serviceName = 'Financial Service',
        serviceDetails = '',
        bureau = 'TransUnion CIBIL',
        basePrice = 500,
        discountAmount = 0,
        couponCode = null,
        taxableValue = 500,
        cgst = '45.00',
        sgst = '45.00',
        totalAmount = 590,
        paymentId = 'N/A',
        date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      } = invoiceData;

      // Primary Colors
      const brandDark = '#081326';
      const brandGold = '#f59e0b';
      const textGray = '#4b5563';
      const borderGray = '#e5e7eb';

      // Header Brand Box
      doc.rect(40, 40, 515, 75).fill('#f8fafc');

      // Brand Logo Icon Square
      doc.rect(55, 52, 44, 44).fill(brandDark);
      doc.fillColor(brandGold).fontSize(24).font('Helvetica-Bold').text('K', 69, 62);

      // Company Name & Subtitle
      doc.fillColor(brandDark).fontSize(16).font('Helvetica-Bold').text('KTR CONSULTANTS', 110, 52);
      doc.fillColor(brandGold).fontSize(9).font('Helvetica-Bold').text('FINANCIAL & CREDIT ADVISORY SERVICES', 110, 72);
      doc.fillColor(textGray).fontSize(8).font('Helvetica').text('Website: www.ktrconsultants.in  |  Email: info@ktrconsultants.in  |  Helpline: +91 99186 99696', 110, 86);

      // Invoice Badge on Top Right
      doc.rect(400, 52, 140, 22).fill(brandDark);
      doc.fillColor(brandGold).fontSize(9).font('Helvetica-Bold').text('ORIGINAL TAX INVOICE', 400, 58, { width: 140, align: 'center' });

      doc.fillColor(brandDark).fontSize(8.5).font('Helvetica-Bold').text(`Invoice No: ${invoiceNumber}`, 370, 78, { width: 170, align: 'right' });
      doc.fillColor(textGray).fontSize(8).font('Helvetica').text(`Date: ${date}`, 370, 90, { width: 170, align: 'right' });
      doc.fillColor(textGray).fontSize(8).font('Helvetica').text('Place of Supply: UP (09)', 370, 101, { width: 170, align: 'right' });

      // Separator Line
      doc.strokeColor(brandDark).lineWidth(1.5).moveTo(40, 125).lineTo(555, 125).stroke();

      // Billed To & Payment Meta Boxes
      const boxY = 135;
      const boxHeight = 75;
      const boxWidth = 248;

      // Box 1: Billed To
      doc.rect(40, boxY, boxWidth, boxHeight).fillAndStroke('#f9fafb', borderGray);
      doc.fillColor(brandGold).fontSize(8).font('Helvetica-Bold').text('BILLED TO (APPLICANT DETAILS)', 52, boxY + 10);
      doc.fillColor(brandDark).fontSize(11).font('Helvetica-Bold').text(clientName, 52, boxY + 24);
      if (pan && pan !== 'N/A') {
        doc.fillColor(textGray).fontSize(8.5).font('Helvetica').text(`PAN Number: `, 52, boxY + 40);
        doc.fillColor(brandDark).font('Helvetica-Bold').text(pan, 115, boxY + 40);
      }
      doc.fillColor(textGray).fontSize(8.5).font('Helvetica').text(`Mobile Number: `, 52, boxY + 54);
      doc.fillColor(brandDark).font('Helvetica-Bold').text(clientMobile.startsWith('+91') ? clientMobile : `+91 ${clientMobile}`, 115, boxY + 54);

      // Box 2: Payment Meta
      doc.rect(307, boxY, boxWidth, boxHeight).fillAndStroke('#f9fafb', borderGray);
      doc.fillColor(brandGold).fontSize(8).font('Helvetica-Bold').text('PAYMENT & TRANSACTION META', 319, boxY + 10);
      doc.fillColor(textGray).fontSize(8.5).font('Helvetica').text('Payment Gateway:', 319, boxY + 24);
      doc.fillColor(brandDark).font('Helvetica-Bold').text('Online (Razorpay Gateway)', 410, boxY + 24);
      doc.fillColor(textGray).fontSize(8.5).font('Helvetica').text('Transaction ID:', 319, boxY + 40);
      doc.fillColor('#16a34a').font('Helvetica-Bold').text(paymentId, 410, boxY + 40);
      doc.fillColor(textGray).fontSize(8.5).font('Helvetica').text('Payment Status:', 319, boxY + 54);
      doc.fillColor('#16a34a').font('Helvetica-Bold').text('Captured & Verified', 410, boxY + 54);

      // Itemized Services Table
      const tableY = 225;
      doc.rect(40, tableY, 515, 24).fill(brandDark);
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      doc.text('DESCRIPTION OF SERVICE', 52, tableY + 7);
      doc.text('SAC', 290, tableY + 7);
      doc.text('QTY', 345, tableY + 7);
      doc.text('RATE (Rs.)', 395, tableY + 7, { width: 60, align: 'right' });
      doc.text('AMOUNT (Rs.)', 465, tableY + 7, { width: 75, align: 'right' });

      // Table Row 1
      const row1Y = tableY + 30;
      doc.rect(40, tableY + 24, 515, 45).fillAndStroke('#ffffff', borderGray);
      doc.fillColor(brandDark).fontSize(9.5).font('Helvetica-Bold').text(serviceName, 52, row1Y);
      doc.fillColor(textGray).fontSize(8).font('Helvetica').text(serviceDetails || `Official Credit Bureau PDF Report (${bureau}) with account history`, 52, row1Y + 14);

      doc.fillColor(textGray).fontSize(8.5).font('Helvetica').text('998311', 290, row1Y + 4);
      doc.text('1', 350, row1Y + 4);
      doc.text(Number(basePrice).toFixed(2), 395, row1Y + 4, { width: 60, align: 'right' });
      doc.fillColor(brandDark).font('Helvetica-Bold').text(Number(basePrice).toFixed(2), 465, row1Y + 4, { width: 75, align: 'right' });

      let currentY = tableY + 75;

      // Discount Row if applied
      if (discountAmount > 0) {
        doc.rect(40, currentY, 515, 22).fillAndStroke('#f0fdf4', borderGray);
        doc.fillColor('#16a34a').fontSize(8.5).font('Helvetica-Bold').text(`Promo Discount Applied (${couponCode || 'FLAT25'})`, 52, currentY + 6);
        doc.text(`-${Number(discountAmount).toFixed(2)}`, 465, currentY + 6, { width: 75, align: 'right' });
        currentY += 25;
      }

      // Calculation Box on Bottom Right
      const calcY = currentY + 10;
      doc.rect(320, calcY, 235, 100).fillAndStroke('#f8fafc', borderGray);

      const addCalcLine = (label, value, y, isBold = false, isFinal = false) => {
        doc.fillColor(isFinal ? brandDark : textGray).fontSize(isFinal ? 10 : 8.5).font(isBold ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(label, 335, y);
        doc.fillColor(isFinal ? brandGold : brandDark).font('Helvetica-Bold').text(value, 450, y, { width: 90, align: 'right' });
      };

      addCalcLine('Taxable Value:', `Rs. ${Number(taxableValue).toFixed(2)}`, calcY + 12);
      addCalcLine('CGST (9%):', `Rs. ${Number(cgst).toFixed(2)}`, calcY + 28);
      addCalcLine('SGST (9%):', `Rs. ${Number(sgst).toFixed(2)}`, calcY + 44);

      doc.strokeColor(brandDark).lineWidth(1).moveTo(335, calcY + 62).lineTo(540, calcY + 62).stroke();
      addCalcLine('Total Amount:', `Rs. ${Number(totalAmount).toFixed(2)}`, calcY + 72, true, true);

      // Left Info Box (Compliance)
      doc.rect(40, calcY, 260, 100).fillAndStroke('#ffffff', borderGray);
      doc.fillColor(brandDark).fontSize(8.5).font('Helvetica-Bold').text('100% Tax Compliant Digital Invoice', 52, calcY + 12);
      doc.fillColor(textGray).fontSize(7.8).font('Helvetica').text('This invoice is electronically generated and digitally issued under Section 65B of the Indian Evidence Act.', 52, calcY + 26, { width: 236, lineGap: 2 });
      doc.text('All payments are processed securely via Razorpay Payment Gateway.', 52, calcY + 60, { width: 236 });

      // Terms & Conditions Footer
      const footerY = calcY + 120;
      doc.strokeColor(borderGray).lineWidth(0.8).moveTo(40, footerY).lineTo(555, footerY).stroke();

      doc.fillColor(brandDark).fontSize(8).font('Helvetica-Bold').text('Terms & Conditions:', 40, footerY + 8);
      doc.fillColor(textGray).fontSize(7.5).font('Helvetica').text('1. Official credit reports are retrieved in real-time from authorized credit bureau registries.\n2. For customer support or dispute resolutions, contact info@ktrconsultants.in.\n3. All legal matters are subject to Lucknow (UP) Jurisdiction only.', 40, footerY + 20, { lineGap: 2 });

      // Digitally Verified Stamp Box
      doc.rect(420, footerY + 8, 135, 45).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fillColor(brandDark).fontSize(7.5).font('Helvetica-Bold').text('KTR CONSULTANTS', 420, footerY + 14, { width: 135, align: 'center' });
      doc.fillColor('#16a34a').fontSize(7).font('Helvetica-Bold').text('DIGITALLY VERIFIED', 420, footerY + 26, { width: 135, align: 'center' });
      doc.fillColor(textGray).fontSize(6.5).font('Helvetica').text('Authorized Signatory', 420, footerY + 38, { width: 135, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateInvoicePDFBuffer
};
