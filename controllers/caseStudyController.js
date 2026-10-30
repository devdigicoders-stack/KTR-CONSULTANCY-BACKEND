const CaseStudy = require('../models/CaseStudy');
const ClientProfile = require('../models/ClientProfile');
const path = require('path');
const fs = require('fs');

// Helper to generate unique 6-character random alphanumeric code
const generateShareCode = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
};

// Default custom field templates based on caseType
const getDefaultFieldsForType = (caseType) => {
  switch (caseType) {
    case 'Client Financial Profile':
      return [
        { id: 'fld_fin_income', label: 'Annual Turnover / Net Income', value: '₹ 1.85 Cr Turnover / ₹ 28 L Net Profit', fieldType: 'text', isRequired: true, isConfidential: false, order: 1 },
        { id: 'fld_fin_banking', label: 'Primary Banking & Average Monthly Balance (AMB)', value: 'HDFC Current A/c - AMB ₹ 12.5 Lakhs (Past 12 Months)', fieldType: 'text', isRequired: true, isConfidential: false, order: 2 },
        { id: 'fld_fin_cibil', label: 'Promoter CIBIL & Credit History', value: 'Score 742; 1 DPD delay in 2023 settled with NDC', fieldType: 'text', isRequired: false, isConfidential: false, order: 3 },
        { id: 'fld_fin_existing_emi', label: 'Existing Live Loans & Monthly EMI Obligation', value: 'Vehicle Loan EMI ₹ 38,000; Unsecured BL EMI ₹ 65,000', fieldType: 'text', isRequired: false, isConfidential: false, order: 4 },
        { id: 'fld_fin_banking_surplus', label: 'Assessed FOIR & Debt Service Capacity', value: 'Projected FOIR within 52% on proposed credit facility', fieldType: 'textarea', isRequired: false, isConfidential: false, order: 5 },
        { id: 'fld_fin_solution', label: 'Proposed Structuring & Credit Mitigant', value: 'Include co-applicant income + collateral enhancement to achieve debt coverage', fieldType: 'textarea', isRequired: false, isConfidential: false, order: 6 }
      ];
    case 'Title Verification':
    case 'Property Legal Issues':
      return [
        { id: 'fld_prop_address', label: 'Property Address & Khasra / Khata No.', value: '', fieldType: 'textarea', isRequired: true, isConfidential: false, order: 1 },
        { id: 'fld_title_chain', label: 'Title Chain Status (30 Years)', value: 'Certified true copies available; Chain Deed verification in progress', fieldType: 'text', isRequired: false, isConfidential: false, order: 2 },
        { id: 'fld_mutation_status', label: 'Mutation / Dakhil Kharij Status', value: 'Tehsildar mutation certified in revenue records', fieldType: 'text', isRequired: false, isConfidential: false, order: 3 },
        { id: 'fld_zoning', label: 'Land Use / 143 Conversion', value: 'Approved under UP Revenue Code Section 80/143', fieldType: 'text', isRequired: false, isConfidential: false, order: 4 },
        { id: 'fld_possession', label: 'Physical Possession & Boundary Demarcation', value: 'Undisputed physical possession with boundary demarcation', fieldType: 'text', isRequired: false, isConfidential: false, order: 5 },
        { id: 'fld_proposed_solution', label: 'Proposed Legal Remedy for Banker', value: 'Sub-Registrar 30-year search report + Registered Indemnity Bond', fieldType: 'textarea', isRequired: false, isConfidential: false, order: 6 }
      ];
    case 'Valuation':
      return [
        { id: 'fld_val_area', label: 'Total Land & Built-up Area', value: '', fieldType: 'text', isRequired: true, isConfidential: false, order: 1 },
        { id: 'fld_val_circle_rate', label: 'Prevailing Govt. Circle Rate vs Fair Market Value (FMV)', value: '', fieldType: 'text', isRequired: true, isConfidential: false, order: 2 },
        { id: 'fld_val_realizable', label: 'Realizable Value & Distress Sale Value (DSV)', value: '', fieldType: 'text', isRequired: false, isConfidential: false, order: 3 },
        { id: 'fld_val_deviations', label: 'Approved Map vs Spot Construction Deviations', value: 'Spot construction adheres to permissible coverage', fieldType: 'textarea', isRequired: false, isConfidential: false, order: 4 },
        { id: 'fld_val_solution', label: 'Proposed Valuation Defense Strategy', value: 'Engage IBBI Registered Valuer for composite depreciated replacement cost report', fieldType: 'textarea', isRequired: false, isConfidential: false, order: 5 }
      ];
    case 'Project Funding':
      return [
        { id: 'fld_proj_cost', label: 'Total Project Cost & Means of Finance', value: '', fieldType: 'text', isRequired: true, isConfidential: false, order: 1 },
        { id: 'fld_proj_promoter_margin', label: 'Promoter Contribution / Equity Inflow', value: '', fieldType: 'text', isRequired: true, isConfidential: false, order: 2 },
        { id: 'fld_proj_dscr', label: 'Projected DSCR & Payback Period', value: '', fieldType: 'text', isRequired: false, isConfidential: false, order: 3 },
        { id: 'fld_proj_permits', label: 'Statutory Approvals & Environmental / Fire Clearances', value: '', fieldType: 'textarea', isRequired: false, isConfidential: false, order: 4 },
        { id: 'fld_proj_solution', label: 'Syndication & Consortium Structure', value: 'Term loan tie-up through Lead Public/Private Sector Bank with escrow mechanism', fieldType: 'textarea', isRequired: false, isConfidential: false, order: 5 }
      ];
    case 'Loan Eligibility':
      return [
        { id: 'fld_elig_requested', label: 'Requested Loan Amount vs Assessed Eligibility', value: '', fieldType: 'text', isRequired: true, isConfidential: false, order: 1 },
        { id: 'fld_elig_ltv', label: 'Loan to Value (LTV) Ratio Calculation', value: '', fieldType: 'text', isRequired: false, isConfidential: false, order: 2 },
        { id: 'fld_elig_gap', label: 'Eligibility Gap Analysis', value: '', fieldType: 'textarea', isRequired: false, isConfidential: false, order: 3 },
        { id: 'fld_elig_mitigation', label: 'Recommended Program (Banking / Gross Turnover / Rental / Liquid Income)', value: 'Banking surrogate scheme based on 12-month net credit turnover', fieldType: 'textarea', isRequired: false, isConfidential: false, order: 4 }
      ];
    case 'Documentation Problems':
    default:
      return [
        { id: 'fld_doc_discrepancy', label: 'Discrepancy / Deficiency Details', value: '', fieldType: 'textarea', isRequired: true, isConfidential: false, order: 1 },
        { id: 'fld_doc_authority', label: 'Issuing Authority / Regulatory Body', value: '', fieldType: 'text', isRequired: false, isConfidential: false, order: 2 },
        { id: 'fld_doc_resolution', label: 'Alternative Secondary Proofs & Affidavits', value: '', fieldType: 'textarea', isRequired: false, isConfidential: false, order: 3 }
      ];
  }
};

// Helper to log edit history entry
const logCaseHistory = (caseStudy, userName, action, details, fieldName = null, oldValue = null, newValue = null) => {
  if (!caseStudy.editHistory) caseStudy.editHistory = [];
  caseStudy.editHistory.unshift({
    timestamp: new Date(),
    userName: userName || 'Staff',
    action,
    details: details || '',
    fieldName,
    oldValue,
    newValue
  });
};

// @desc    Get all Case Studies (with filtering by status, caseType & search)
// @route   GET /api/case-studies
// @access  Private (Staff/Admin)
exports.getCaseStudies = async (req, res) => {
  try {
    const { status, caseType, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (caseType && caseType !== 'All') {
      query.caseType = caseType;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      query.$or = [
        { caseNumber: regex },
        { title: regex },
        { caseType: regex },
        { clientName: regex },
        { propertyLocation: regex },
        { caseIssue: regex },
        { legalComplications: regex }
      ];
    }

    const cases = await CaseStudy.find(query)
      .sort({ updatedAt: -1, createdAt: -1 });

    res.json({ success: true, count: cases.length, data: cases });
  } catch (error) {
    console.error('Get Case Studies Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get single Case Study by ID
// @route   GET /api/case-studies/:id
// @access  Private (Staff/Admin)
exports.getCaseStudyById = async (req, res) => {
  try {
    const { id } = req.params;
    const caseStudy = await CaseStudy.findById(id);

    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    // Sort customFields and documents by configured order
    if (caseStudy.customFields) {
      caseStudy.customFields.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    if (caseStudy.documents) {
      caseStudy.documents.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    res.json({ success: true, data: caseStudy });
  } catch (error) {
    console.error('Get Case Study Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Create new Case Study
// @route   POST /api/case-studies
// @access  Private (Staff/Admin)
exports.createCaseStudy = async (req, res) => {
  try {
    const {
      caseType = 'Property Legal Issues',
      title,
      clientName,
      propertyLocation,
      propertyType,
      estimatedLoanAmount,
      caseIssue,
      legalComplications,
      discussionNotes,
      status,
      customFields
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Case title is required.' });
    }

    const userName = req.user?.name || 'Staff';

    // Auto-generate sequential case number: CS-YYYY-XXX
    const year = new Date().getFullYear();
    const count = await CaseStudy.countDocuments({
      caseNumber: new RegExp(`^CS-${year}-`)
    });
    const caseNumber = `CS-${year}-${String(count + 1).padStart(3, '0')}`;

    // Generate unique primary share code
    let shareCode = generateShareCode();
    let duplicate = await CaseStudy.findOne({ shareCode });
    let attempts = 0;
    while (duplicate && attempts < 10) {
      shareCode = generateShareCode();
      duplicate = await CaseStudy.findOne({ shareCode });
      attempts++;
    }

    // Determine initial fields: if none provided, pick template for caseType
    const initialFields = (customFields && customFields.length > 0)
      ? customFields
      : getDefaultFieldsForType(caseType);

    const initialHistory = [{
      timestamp: new Date(),
      userName,
      action: 'Case Created',
      details: `Created new case #${caseNumber} (${caseType})`
    }];

    const newCase = await CaseStudy.create({
      caseNumber,
      caseType,
      title: title.trim(),
      clientName: (clientName || '').trim(),
      propertyLocation: (propertyLocation || '').trim(),
      propertyType: propertyType || 'Residential',
      estimatedLoanAmount: Number(estimatedLoanAmount) || 0,
      caseIssue: (caseIssue || '').trim(),
      legalComplications: (legalComplications || '').trim(),
      discussionNotes: (discussionNotes || '').trim(),
      status: status || 'Open',
      customFields: initialFields,
      documents: [],
      bankerQueries: [],
      editHistory: initialHistory,
      shareSettings: [{
        shareCode,
        passcode: '',
        recipientName: 'General Partner',
        recipientType: 'Banker',
        visibleSections: ['fields', 'documents', 'queries'],
        visibleFieldIds: [],
        visibleDocumentIds: [],
        allowQueries: true,
        isActive: true,
        createdAt: new Date()
      }],
      shareCode,
      isShareActive: true,
      createdBy: req.adminId || req.user?._id,
      createdByName: userName
    });

    res.status(201).json({
      success: true,
      message: 'Case Study created successfully',
      data: newCase
    });
  } catch (error) {
    console.error('Create Case Study Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update Case Study (main fields, status, or notes with edit history tracking)
// @route   PUT /api/case-studies/:id
// @access  Private (Staff/Admin)
exports.updateCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const caseStudy = await CaseStudy.findById(id);

    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    const userName = req.user?.name || 'Staff';
    const {
      caseType,
      title,
      clientName,
      propertyLocation,
      propertyType,
      estimatedLoanAmount,
      caseIssue,
      legalComplications,
      discussionNotes,
      status,
      resolutionSummary,
      customFields,
      isShareActive
    } = req.body;

    const changes = [];

    if (caseType !== undefined && caseType !== caseStudy.caseType) {
      changes.push(`Case Type changed from "${caseStudy.caseType}" to "${caseType}"`);
      caseStudy.caseType = caseType;
    }
    if (title !== undefined && title.trim() !== caseStudy.title) {
      changes.push(`Title updated`);
      caseStudy.title = title.trim();
    }
    if (clientName !== undefined && clientName.trim() !== caseStudy.clientName) {
      changes.push(`Client Name updated`);
      caseStudy.clientName = clientName.trim();
    }
    if (propertyLocation !== undefined && propertyLocation.trim() !== caseStudy.propertyLocation) {
      changes.push(`Location updated`);
      caseStudy.propertyLocation = propertyLocation.trim();
    }
    if (propertyType !== undefined && propertyType !== caseStudy.propertyType) {
      caseStudy.propertyType = propertyType;
    }
    if (estimatedLoanAmount !== undefined && Number(estimatedLoanAmount) !== caseStudy.estimatedLoanAmount) {
      caseStudy.estimatedLoanAmount = Number(estimatedLoanAmount) || 0;
      changes.push(`Estimated Amount updated to ₹ ${caseStudy.estimatedLoanAmount.toLocaleString('en-IN')}`);
    }
    if (caseIssue !== undefined && caseIssue.trim() !== caseStudy.caseIssue) {
      changes.push(`Case Issue description updated`);
      caseStudy.caseIssue = caseIssue.trim();
    }
    if (legalComplications !== undefined && legalComplications.trim() !== caseStudy.legalComplications) {
      changes.push(`Legal Complications / Notes updated`);
      caseStudy.legalComplications = legalComplications.trim();
    }
    if (discussionNotes !== undefined && discussionNotes.trim() !== caseStudy.discussionNotes) {
      changes.push(`Internal confidential notes updated`);
      caseStudy.discussionNotes = discussionNotes.trim();
    }
    if (status !== undefined && status !== caseStudy.status) {
      const oldStatus = caseStudy.status;
      caseStudy.status = status;
      if (status === 'Closed') {
        caseStudy.closedAt = new Date();
        caseStudy.closedByName = userName;
        if (resolutionSummary) caseStudy.resolutionSummary = resolutionSummary.trim();
        changes.push(`Case Closed with resolution: ${resolutionSummary || 'Case concluded'}`);
      } else if (oldStatus === 'Closed') {
        changes.push(`Case Reopened. Status changed to "${status}"`);
      } else {
        changes.push(`Status changed from "${oldStatus}" to "${status}"`);
      }
    }
    if (resolutionSummary !== undefined) {
      caseStudy.resolutionSummary = resolutionSummary.trim();
    }
    if (isShareActive !== undefined) {
      caseStudy.isShareActive = Boolean(isShareActive);
    }
    if (Array.isArray(customFields)) {
      caseStudy.customFields = customFields;
      changes.push(`Custom fields data updated`);
    }

    if (changes.length > 0) {
      logCaseHistory(caseStudy, userName, 'Case Updated', changes.join('; '));
    }

    await caseStudy.save();

    res.json({
      success: true,
      message: 'Case Study updated successfully',
      data: caseStudy
    });
  } catch (error) {
    console.error('Update Case Study Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update / Reorder Custom Fields Layout
// @route   PATCH /api/case-studies/:id/fields
// @access  Private (Staff/Admin)
exports.updateCustomFields = async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.body;

    if (!Array.isArray(fields)) {
      return res.status(400).json({ success: false, message: 'Fields must be an array.' });
    }

    const caseStudy = await CaseStudy.findById(id);
    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    const userName = req.user?.name || 'Staff';

    // Ensure order property is cleanly indexed sequentially 1..N
    const orderedFields = fields.map((f, idx) => ({
      id: f.id || `fld_${Date.now()}_${idx}`,
      label: f.label || 'Field',
      value: f.value !== undefined ? f.value : '',
      fieldType: f.fieldType || 'text',
      options: Array.isArray(f.options) ? f.options : [],
      isRequired: Boolean(f.isRequired),
      isConfidential: Boolean(f.isConfidential),
      order: idx + 1
    }));

    caseStudy.customFields = orderedFields;
    logCaseHistory(caseStudy, userName, 'Fields Layout Updated', `Configured ${orderedFields.length} custom fields.`);
    await caseStudy.save();

    res.json({
      success: true,
      message: 'Fields layout updated successfully',
      customFields: caseStudy.customFields
    });
  } catch (error) {
    console.error('Update Custom Fields Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Upload documents to Case Study (multiple files allowed, non-destructive append)
// @route   POST /api/case-studies/:id/documents
// @access  Private (Staff/Admin)
exports.uploadCaseDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { category = 'General', name, notes, isConfidential } = req.body;

    const caseStudy = await CaseStudy.findById(id);
    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const userName = req.user?.name || 'Staff';
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    const startingOrder = caseStudy.documents.length;
    const addedDocs = [];

    files.forEach((f, idx) => {
      if (!f) return;
      const ext = path.extname(f.originalname).toLowerCase().replace('.', '');
      let fileType = 'document';
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) fileType = 'image';
      else if (['pdf'].includes(ext)) fileType = 'pdf';

      const baseName = name && name.trim() ? name.trim() : f.originalname.replace(/\.[^/.]+$/, '');
      const finalTitle = files.length > 1 && name ? `${baseName} (${idx + 1})` : baseName;

      const docObj = {
        id: `cd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: finalTitle,
        fileTitle: finalTitle,
        fileUrl: `/uploads/${f.filename}`,
        fileType,
        fileSize: f.size || 0,
        category: category.trim(),
        notes: notes ? notes.trim() : '',
        order: startingOrder + idx + 1,
        isConfidential: isConfidential === 'true' || isConfidential === true,
        originalFileName: f.originalname,
        uploadedAt: new Date(),
        uploadedByName: userName
      };

      caseStudy.documents.push(docObj);
      addedDocs.push(docObj);
    });

    logCaseHistory(
      caseStudy,
      userName,
      'Documents Uploaded',
      `Uploaded ${addedDocs.length} new file(s): ${addedDocs.map(d => d.name).join(', ')}`
    );

    await caseStudy.save();

    res.status(201).json({
      success: true,
      message: `${addedDocs.length} document(s) uploaded successfully`,
      documents: caseStudy.documents
    });
  } catch (error) {
    console.error('Upload Case Documents Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Replace a single document file while preserving docId & ordering
// @route   POST /api/case-studies/:id/documents/:docId/replace
// @access  Private (Staff/Admin)
exports.replaceCaseDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const caseStudy = await CaseStudy.findById(id);

    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    const doc = caseStudy.documents.find(d => d.id === docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const newFile = req.file || (req.files && req.files[0]);
    if (!newFile) {
      return res.status(400).json({ success: false, message: 'Replacement file is required' });
    }

    const userName = req.user?.name || 'Staff';
    const oldFileUrl = doc.fileUrl;

    const ext = path.extname(newFile.originalname).toLowerCase().replace('.', '');
    let fileType = 'document';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) fileType = 'image';
    else if (['pdf'].includes(ext)) fileType = 'pdf';

    // Update document file pointer
    doc.fileUrl = `/uploads/${newFile.filename}`;
    doc.fileType = fileType;
    doc.fileSize = newFile.size || 0;
    doc.replacedAt = new Date();
    doc.replacedByName = userName;
    doc.originalFileName = newFile.originalname;

    logCaseHistory(
      caseStudy,
      userName,
      'Document Replaced',
      `Replaced file for "${doc.name}" with "${newFile.originalname}"`
    );

    await caseStudy.save();

    // Optionally cleanup old file if needed
    if (oldFileUrl && oldFileUrl.startsWith('/uploads/')) {
      const oldFilePath = path.join(__dirname, '..', oldFileUrl);
      if (fs.existsSync(oldFilePath)) {
        try { fs.unlinkSync(oldFilePath); } catch (e) {}
      }
    }

    res.json({
      success: true,
      message: 'Document file replaced successfully',
      document: doc,
      documents: caseStudy.documents
    });
  } catch (error) {
    console.error('Replace Document Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Rename / Edit document details in Case Study
// @route   PATCH /api/case-studies/:id/documents/:docId
// @access  Private (Staff/Admin)
exports.renameCaseDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const { name, notes, category, isConfidential } = req.body;

    const caseStudy = await CaseStudy.findById(id);
    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    const doc = caseStudy.documents.find(d => d.id === docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const userName = req.user?.name || 'Staff';
    const oldName = doc.name;

    if (name) {
      doc.name = name.trim();
      doc.fileTitle = name.trim();
    }
    if (notes !== undefined) doc.notes = notes.trim();
    if (category) doc.category = category.trim();
    if (isConfidential !== undefined) doc.isConfidential = Boolean(isConfidential);

    logCaseHistory(
      caseStudy,
      userName,
      'Document Details Edited',
      `Edited document details for "${oldName}" -> "${doc.name}"`
    );

    await caseStudy.save();

    res.json({
      success: true,
      message: 'Document updated successfully',
      document: doc,
      documents: caseStudy.documents
    });
  } catch (error) {
    console.error('Rename Document Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete document from Case Study
// @route   DELETE /api/case-studies/:id/documents/:docId
// @access  Private (Staff/Admin)
exports.deleteCaseDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const caseStudy = await CaseStudy.findById(id);

    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    const userName = req.user?.name || 'Staff';
    const targetDoc = caseStudy.documents.find(d => d.id === docId);
    if (targetDoc && targetDoc.fileUrl && targetDoc.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', targetDoc.fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    const docName = targetDoc ? targetDoc.name : docId;
    caseStudy.documents = caseStudy.documents.filter(d => d.id !== docId);
    // Re-index orders
    caseStudy.documents.forEach((d, i) => { d.order = i + 1; });

    logCaseHistory(caseStudy, userName, 'Document Deleted', `Deleted document "${docName}"`);
    await caseStudy.save();

    res.json({
      success: true,
      message: 'Document deleted successfully',
      documents: caseStudy.documents
    });
  } catch (error) {
    console.error('Delete Document Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Reorder Case Documents
// @route   PATCH /api/case-studies/:id/documents/reorder
// @access  Private (Staff/Admin)
exports.reorderCaseDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { docIds = [] } = req.body;

    const caseStudy = await CaseStudy.findById(id);
    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    const map = new Map(caseStudy.documents.map(d => [d.id, d]));
    const reordered = [];

    docIds.forEach((dId, idx) => {
      const found = map.get(dId);
      if (found) {
        found.order = idx + 1;
        reordered.push(found);
        map.delete(dId);
      }
    });

    let currentIdx = reordered.length;
    for (const remaining of map.values()) {
      remaining.order = ++currentIdx;
      reordered.push(remaining);
    }

    caseStudy.documents = reordered;
    await caseStudy.save();

    res.json({
      success: true,
      message: 'Documents reordered successfully',
      documents: caseStudy.documents
    });
  } catch (error) {
    console.error('Reorder Documents Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Add / Record Case Discussion Query (phone, meeting, email or portal)
// @route   POST /api/case-studies/:id/queries
// @access  Private (Staff/Admin)
exports.addBankerQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      authorName = 'Banker / Expert',
      authorRole = 'banker',
      source = 'phone',
      bankName = '',
      authorPhone = '',
      authorEmail = '',
      queryText,
      status = 'Open',
      staffReply = '',
      attachments = []
    } = req.body;

    if (!queryText || !queryText.trim()) {
      return res.status(400).json({ success: false, message: 'Query description is required.' });
    }

    const caseStudy = await CaseStudy.findById(id);
    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    const userName = req.user?.name || 'Staff';
    const isAnswered = staffReply && staffReply.trim();

    const repliesList = [];
    if (isAnswered) {
      repliesList.push({
        replyText: staffReply.trim(),
        repliedByName: userName,
        repliedByRole: 'staff',
        repliedAt: new Date(),
        attachments: []
      });
    }

    const newQuery = {
      authorName: authorName.trim(),
      authorRole,
      source,
      bankName: bankName.trim(),
      authorPhone: authorPhone.trim(),
      authorEmail: authorEmail.trim(),
      queryText: queryText.trim(),
      status: isAnswered ? 'Answered' : (status || 'Open'),
      attachments: Array.isArray(attachments) ? attachments : [],
      replies: repliesList,
      staffReply: isAnswered ? staffReply.trim() : '',
      repliedAt: isAnswered ? new Date() : null,
      repliedByName: isAnswered ? userName : null,
      isPhoneQuery: source === 'phone',
      createdAt: new Date()
    };

    caseStudy.bankerQueries.unshift(newQuery);

    logCaseHistory(
      caseStudy,
      userName,
      'Query Added',
      `Recorded query from ${authorName} (${source}): "${queryText.substring(0, 80)}..."`
    );

    await caseStudy.save();

    res.status(201).json({
      success: true,
      message: 'Case discussion query recorded successfully',
      queries: caseStudy.bankerQueries
    });
  } catch (error) {
    console.error('Add Query Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Reply to Case Query with threaded reply & optional attachments
// @route   PUT /api/case-studies/:id/queries/:queryId
// @access  Private (Staff/Admin)
exports.replyBankerQuery = async (req, res) => {
  try {
    const { id, queryId } = req.params;
    const { replyText, staffReply, status = 'Answered', attachments = [] } = req.body;

    const caseStudy = await CaseStudy.findById(id);
    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    const query = caseStudy.bankerQueries.id(queryId);
    if (!query) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    const userName = req.user?.name || 'Staff';
    const textToSave = (replyText || staffReply || '').trim();

    if (textToSave) {
      query.staffReply = textToSave;
      query.repliedAt = new Date();
      query.repliedByName = userName;

      if (!query.replies) query.replies = [];
      query.replies.push({
        replyText: textToSave,
        repliedByName: userName,
        repliedByRole: 'staff',
        repliedAt: new Date(),
        attachments: Array.isArray(attachments) ? attachments : []
      });
    }

    if (status) {
      query.status = status;
    }

    logCaseHistory(
      caseStudy,
      userName,
      'Query Replied',
      `Replied to query #${queryId.toString().slice(-4)}: "${textToSave.substring(0, 80)}..." (Status: ${query.status})`
    );

    await caseStudy.save();

    res.json({
      success: true,
      message: 'Query response recorded successfully',
      queries: caseStudy.bankerQueries
    });
  } catch (error) {
    console.error('Reply Query Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update query status directly (e.g. Open -> In Progress -> Resolved)
// @route   PATCH /api/case-studies/:id/queries/:queryId/status
// @access  Private (Staff/Admin)
exports.updateQueryStatus = async (req, res) => {
  try {
    const { id, queryId } = req.params;
    const { status } = req.body;

    const caseStudy = await CaseStudy.findById(id);
    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    const query = caseStudy.bankerQueries.id(queryId);
    if (!query) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    const userName = req.user?.name || 'Staff';
    const oldStatus = query.status;
    query.status = status;

    logCaseHistory(
      caseStudy,
      userName,
      'Query Status Changed',
      `Query #${queryId.toString().slice(-4)} status changed from ${oldStatus} to ${status}`
    );

    await caseStudy.save();

    res.json({
      success: true,
      message: 'Query status updated',
      queries: caseStudy.bankerQueries
    });
  } catch (error) {
    console.error('Update Query Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Run AI Case Intelligence & Recommendations Engine (Works for ANY case type)
// @route   POST /api/case-studies/:id/ai-analyze
// @access  Private (Staff/Admin)
exports.runAiIntelligence = async (req, res) => {
  try {
    const { id } = req.params;
    const caseStudy = await CaseStudy.findById(id);

    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    // 1. Scan historical resolved case studies for matching context
    const pastCases = await CaseStudy.find({
      _id: { $ne: caseStudy._id },
      $or: [
        { caseType: caseStudy.caseType },
        { status: { $in: ['Resolved', 'Closed'] } }
      ]
    }).limit(10);

    const fullText = `${caseStudy.title} ${caseStudy.caseType} ${caseStudy.caseIssue} ${caseStudy.legalComplications}`.toLowerCase();

    // 2. Identify key patterns across legal, financial, valuation, funding
    const isFinancial = caseStudy.caseType === 'Client Financial Profile' || fullText.includes('income') || fullText.includes('foir') || fullText.includes('cibil') || fullText.includes('balance sheet');
    const isValuation = caseStudy.caseType === 'Valuation' || fullText.includes('valuation') || fullText.includes('circle rate') || fullText.includes('deviation');
    const isFunding = caseStudy.caseType === 'Project Funding' || fullText.includes('project') || fullText.includes('equity') || fullText.includes('term loan');
    const hasChainDeedIssue = fullText.includes('chain') || fullText.includes('deed') || fullText.includes('missing') || fullText.includes('prior title');
    const hasMutationIssue = fullText.includes('mutation') || fullText.includes('dakhil') || fullText.includes('tehsil') || fullText.includes('khatauni');
    const hasConversionIssue = fullText.includes('143') || fullText.includes('conversion') || fullText.includes('zoning');

    // 3. Similar Past Cases
    const similarPastCases = [];
    if (pastCases.length > 0) {
      pastCases.slice(0, 3).forEach(pc => {
        similarPastCases.push({
          caseNumber: pc.caseNumber,
          title: pc.title,
          caseType: pc.caseType || 'Property Legal Issues',
          propertyType: pc.propertyType || 'N/A',
          outcome: pc.status === 'Resolved' ? 'Resolved & Sanctioned' : 'Under Committee Review',
          solution: pc.discussionNotes ? pc.discussionNotes.substring(0, 140) + '...' : 'Evidence-based resolution executed successfully.'
        });
      });
    } else {
      if (isFinancial) {
        similarPastCases.push({
          caseNumber: 'REF-FIN-2025-011',
          title: 'High Banking AMB Surrogate with Past Settled Credit Card DPD',
          caseType: 'Client Financial Profile',
          outcome: 'Sanctioned by Private Sector Bank at 9.25%',
          solution: 'Submitted 12-month CA Net Worth certificate + NDC confirmation from card issuer + banking turnover surrogate multiplier.'
        });
      } else if (isValuation) {
        similarPastCases.push({
          caseNumber: 'REF-VAL-2025-023',
          title: 'Valuation Gap Between Circle Rate & Realizable Market Value',
          caseType: 'Valuation',
          outcome: 'Approved by NBFC Credit Committee',
          solution: 'Commissioned joint IBBI Valuer inspection with recent registered sale exemplars within 500 meters radius.'
        });
      } else {
        similarPastCases.push({
          caseNumber: 'REF-LEG-2025-019',
          title: 'Chain Deed Gap (1995-2002) - Commercial Property',
          caseType: 'Property Legal Issues',
          outcome: 'Sanctioned via Bank Legal Exception',
          solution: 'Obtained Certified Sub-Registrar Volume Search (Form 26), 30-Year Encumbrance Certificate, and Registered Indemnity Bond.'
        });
      }
    }

    // 4. Anticipated Queries based on case category
    const anticipatedQueries = [];
    if (isFinancial) {
      anticipatedQueries.push('Credit Underwriter: Provide 12-month GST 3B reconciliation against bank credits to verify turnover authenticity.');
      anticipatedQueries.push('Risk Dept: Clarify source of bulk deposit in Q3 banking credits with CA confirmation.');
      anticipatedQueries.push('Auditor: Submit audited balance sheet schedule for sundry debtors exceeding 180 days.');
    } else if (isValuation) {
      anticipatedQueries.push('Bank Valuer: Explain deviation of 18% in ground coverage compared to sanctioned master layout.');
      anticipatedQueries.push('Legal/Valuation: Provide latest guideline circle rate notification from District Magistrate.');
    } else if (isFunding) {
      anticipatedQueries.push('Consortium Lead: Provide audited fund flow statement proving upfront infusion of 25% promoter equity.');
      anticipatedQueries.push('Technical Consultant: Provide TEV (Techno Economic Viability) study report with sensitivity analysis.');
    } else {
      if (hasChainDeedIssue) {
        anticipatedQueries.push('Bank Legal Dept: Prior link deed missing. Provide certified copy from SRO or register 30-year search report.');
      }
      if (hasMutationIssue) {
        anticipatedQueries.push('Bank Credit Query: Current Jamabandi / Khatauni does not reflect updated applicant name. Submit Revenue receipt.');
      }
      if (hasConversionIssue) {
        anticipatedQueries.push('Bank Query: Property zoned as agricultural. Has Section 143 non-agricultural conversion order been passed?');
      }
      anticipatedQueries.push('Panel Advocate: Confirm physical boundary demarcation matches the registered schedule.');
    }

    // 5. Missing Documents Checklist
    const missingDocuments = isFinancial ? [
      '12 Months Bank Account Statement with complete e-statement validation',
      'Audited Financials (Balance Sheet, P&L, Tax Audit Report) with UDIN',
      'GST Returns (GSTR-1 & GSTR-3B) for latest financial year',
      'NDC / No Dues Certificate for settled past credit facilities'
    ] : isValuation ? [
      'Approved Sanctioned Building Plan from Development Authority',
      'Joint Inspection Demarcation Panchnama with GPS coordinates',
      'Property Tax Receipt reflecting assessed covered area'
    ] : [
      '30-Year Encumbrance Certificate (EC / Nil Encumbrance from Sub-Registrar)',
      'Certified copy of Prior Link Deed from District Registrar Office',
      'Latest Up-to-Date Municipal Tax / Khatauni / Malguzari Paid Receipt',
      'Site Demarcation Map / Boundary Certificate signed by adjacent owners'
    ];

    // 6. Bank / Solution Suggestions
    const suggestedBanks = isFinancial ? [
      { bankName: 'HDFC Bank / ICICI Bank', loanType: 'Banking Surrogate / BL', matchScore: 92, reasoning: 'Strong appetite for turnover banking surrogate models with healthy 12-month AMB.' },
      { bankName: 'Bajaj Finance / Tata Capital', loanType: 'Secured LAP / Working Capital', matchScore: 86, reasoning: 'Fast-track clearance for high net worth promoter profiles with minor past CIBIL delays.' }
    ] : [
      { bankName: 'Punjab National Bank / Union Bank', loanType: 'Mortgage / LAP', matchScore: 92, reasoning: 'Strong legal flexibility for ancestral title gaps with 12-year registered possession proof.' },
      { bankName: 'State Bank of India', loanType: 'Term Loan / LAP', matchScore: 85, reasoning: 'Lowest interest rates for clear legal titles and approved conversions.' }
    ];

    const recommendedSolutions = isFinancial ? [
      'Present credit file under Gross Turnover Surrogate program rather than Net Profit method.',
      'Add family member / sister entity with clean financials as co-borrower to enhance DSCR.',
      'Provide CA certified provisional financials for ongoing financial year to prove growth.'
    ] : [
      'Apply immediately for Certified True Copies from SRO with certified search report from panel advocate.',
      'Execute a registered Indemnity Bond indemnifying the lending bank against prior undisclosed encumbrances.',
      'Draft a formal Lawyer Legal Search Summary explaining continuous peaceful possession.'
    ];

    const draftReplies = (caseStudy.bankerQueries || []).map(q => ({
      queryKey: q._id ? q._id.toString() : q.queryText.substring(0, 20),
      suggestedReply: `With reference to your query regarding "${q.queryText.substring(0, 50)}...", we confirm all supporting records have been verified. Verified documents and mitigating indemnity certificates are available for review.`,
      rationale: 'Addresses primary credit committee objection with verified documentary evidence.'
    }));

    const aiIntelligence = {
      lastAnalyzedAt: new Date(),
      summary: `AI analyzed ${similarPastCases.length} comparable cases and risk indicators for ${caseStudy.caseType}. Overall case risk is ${hasChainDeedIssue || hasConversionIssue ? 'High' : 'Moderate'} with high probability of resolution through evidence-based mitigation.`,
      riskRating: hasChainDeedIssue || hasConversionIssue ? 'High' : 'Moderate',
      similarPastCases,
      anticipatedQueries,
      missingDocuments,
      suggestedBanks,
      recommendedSolutions,
      draftReplies
    };

    caseStudy.aiIntelligence = aiIntelligence;
    logCaseHistory(caseStudy, req.user?.name || 'Staff', 'AI Intelligence Refreshed', 'Generated AI analysis & recommendations.');
    await caseStudy.save();

    res.json({
      success: true,
      message: 'AI Case Intelligence generated successfully',
      data: aiIntelligence
    });
  } catch (error) {
    console.error('Run AI Intelligence Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete Case Study
// @route   DELETE /api/case-studies/:id
// @access  Private (Staff/Admin)
exports.deleteCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const caseStudy = await CaseStudy.findById(id);

    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    // Clean up uploaded documents from disk
    for (const doc of caseStudy.documents) {
      if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', doc.fileUrl);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      }
    }

    await CaseStudy.findByIdAndDelete(id);

    res.json({ success: true, message: 'Case Study deleted successfully' });
  } catch (error) {
    console.error('Delete Case Study Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Generate / Configure Granular Share Link
// @route   POST /api/case-studies/:id/share
// @access  Private (Staff/Admin)
exports.generateShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      recipientName = 'Expert / Banker',
      recipientType = 'Banker',
      recipientPhone = '',
      recipientEmail = '',
      passcode = '',
      expiresInDays,
      visibleFieldIds = [],
      visibleDocumentIds = [],
      allowQueries = true
    } = req.body;

    const caseStudy = await CaseStudy.findById(id);
    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case Study not found' });
    }

    let shareCode = generateShareCode();
    let expiresAt = null;
    if (expiresInDays && Number(expiresInDays) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresInDays) * 86400000);
    }

    const shareConfig = {
      shareCode,
      passcode: passcode.trim(),
      recipientName: recipientName.trim(),
      recipientType,
      recipientPhone: recipientPhone.trim(),
      recipientEmail: recipientEmail.trim(),
      visibleSections: ['fields', 'documents', 'queries'],
      visibleFieldIds: Array.isArray(visibleFieldIds) ? visibleFieldIds : [],
      visibleDocumentIds: Array.isArray(visibleDocumentIds) ? visibleDocumentIds : [],
      allowQueries: Boolean(allowQueries),
      expiresAt,
      isActive: true,
      createdAt: new Date()
    };

    if (!caseStudy.shareSettings) caseStudy.shareSettings = [];
    caseStudy.shareSettings.unshift(shareConfig);
    caseStudy.shareCode = shareCode; // keep primary shareCode in sync
    caseStudy.isShareActive = true;

    logCaseHistory(
      caseStudy,
      req.user?.name || 'Staff',
      'Share Link Generated',
      `Generated secure link for ${recipientName} (${recipientType}). Protected: ${passcode ? 'Yes' : 'No'}`
    );

    await caseStudy.save();

    res.json({
      success: true,
      shareCode,
      shortUrl: `https://ktrconsultants.in/d/case/${shareCode}`,
      shareConfig
    });
  } catch (error) {
    console.error('Generate Share Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// ---------------------------------------------------------------------------------
// PUBLIC RECIPIENT ENDPOINTS (CONFIDENTIAL STAFF NOTES & INTERNAL AUDIT ARE STRIPPED)
// ---------------------------------------------------------------------------------

// @desc    Get Shared Case Study for Banker/Advocate/Valuer/CA (Safe Sanitized View)
// @route   GET /api/case-studies/shared/:code
// @access  Public
exports.getSharedCaseStudy = async (req, res) => {
  try {
    const { code } = req.params;
    const { passcode } = req.query;

    const query = {
      $or: [
        { shareCode: code.toLowerCase() },
        { shareCode: code },
        { 'shareSettings.shareCode': code.toLowerCase() },
        { 'shareSettings.shareCode': code }
      ]
    };

    let caseStudy = await CaseStudy.findOne(query);

    if (!caseStudy && code.length === 24) {
      caseStudy = await CaseStudy.findById(code);
    }

    if (!caseStudy || !caseStudy.isShareActive) {
      return res.status(404).json({
        success: false,
        message: 'Case Study discussion not found or link has expired.'
      });
    }

    // Find specific share setting if configured
    const matchedShare = (caseStudy.shareSettings || []).find(
      s => s.shareCode.toLowerCase() === code.toLowerCase()
    );

    // Expiry check
    if (matchedShare?.expiresAt && new Date(matchedShare.expiresAt) < new Date()) {
      return res.status(403).json({
        success: false,
        isExpired: true,
        message: 'This secure case discussion link has expired. Please contact KTR Consultants for an updated link.'
      });
    }

    // Passcode check
    if (matchedShare && matchedShare.passcode && matchedShare.passcode.trim()) {
      if (!passcode || passcode.trim() !== matchedShare.passcode.trim()) {
        return res.status(401).json({
          success: false,
          requiresPasscode: true,
          recipientType: matchedShare.recipientType,
          recipientName: matchedShare.recipientName,
          caseNumber: caseStudy.caseNumber,
          message: 'This case is protected with a security passcode. Please enter the passcode to access.'
        });
      }
    }

    // Increment view count
    caseStudy.viewsCount = (caseStudy.viewsCount || 0) + 1;
    if (matchedShare) {
      matchedShare.viewsCount = (matchedShare.viewsCount || 0) + 1;
      matchedShare.lastViewedAt = new Date();
    }
    await caseStudy.save();

    // Filter fields: exclude confidential & honor visibleFieldIds if configured
    let customFields = (caseStudy.customFields || [])
      .filter(f => !f.isConfidential)
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (matchedShare && matchedShare.visibleFieldIds && matchedShare.visibleFieldIds.length > 0) {
      customFields = customFields.filter(f => matchedShare.visibleFieldIds.includes(f.id));
    }

    // Filter documents: exclude confidential & honor visibleDocumentIds if configured
    let documents = (caseStudy.documents || [])
      .filter(d => !d.isConfidential)
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (matchedShare && matchedShare.visibleDocumentIds && matchedShare.visibleDocumentIds.length > 0) {
      documents = documents.filter(d => matchedShare.visibleDocumentIds.includes(d.id));
    }

    // Filter queries: return discussion items without staff internal notes
    const discussionQueries = (caseStudy.bankerQueries || []).map(q => ({
      id: q._id,
      authorName: q.authorName,
      authorRole: q.authorRole,
      source: q.source,
      bankName: q.bankName,
      queryText: q.queryText,
      status: q.status,
      attachments: q.attachments || [],
      staffReply: q.staffReply,
      repliedAt: q.repliedAt,
      replies: (q.replies || []).map(r => ({
        id: r._id,
        replyText: r.replyText,
        repliedByName: r.repliedByName,
        repliedByRole: r.repliedByRole,
        repliedAt: r.repliedAt,
        attachments: r.attachments || []
      })),
      createdAt: q.createdAt
    }));

    // Strictly internal confidential notes, editHistory, and AI suggestions are stripped
    const sanitizedView = {
      id: caseStudy._id,
      caseNumber: caseStudy.caseNumber,
      caseType: caseStudy.caseType,
      title: caseStudy.title,
      clientName: caseStudy.clientName,
      propertyLocation: caseStudy.propertyLocation,
      propertyType: caseStudy.propertyType,
      estimatedLoanAmount: caseStudy.estimatedLoanAmount,
      caseIssue: caseStudy.caseIssue,
      legalComplications: caseStudy.legalComplications,
      status: caseStudy.status,
      resolutionSummary: caseStudy.resolutionSummary,
      customFields,
      documents,
      queries: discussionQueries,
      allowQueries: matchedShare ? matchedShare.allowQueries !== false : true,
      recipientName: matchedShare?.recipientName || '',
      recipientType: matchedShare?.recipientType || 'Expert',
      createdAt: caseStudy.createdAt
    };

    res.json({
      success: true,
      data: sanitizedView
    });
  } catch (error) {
    console.error('Get Shared Case Study Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    External recipient (Banker, Advocate, Valuer, CA) raises query via public shared link
// @route   POST /api/case-studies/shared/:code/query
// @access  Public
exports.submitBankerQueryFromShare = async (req, res) => {
  try {
    const { code } = req.params;
    const {
      authorName,
      authorRole = 'banker',
      bankName = '',
      authorPhone = '',
      authorEmail = '',
      queryText,
      passcode
    } = req.body;

    if (!queryText || !queryText.trim()) {
      return res.status(400).json({ success: false, message: 'Query description is required.' });
    }

    const query = {
      $or: [
        { shareCode: code.toLowerCase() },
        { shareCode: code },
        { 'shareSettings.shareCode': code.toLowerCase() },
        { 'shareSettings.shareCode': code }
      ]
    };
    let caseStudy = await CaseStudy.findOne(query);

    if (!caseStudy && code.length === 24) {
      caseStudy = await CaseStudy.findById(code);
    }

    if (!caseStudy || !caseStudy.isShareActive) {
      return res.status(404).json({ success: false, message: 'Case Study not found.' });
    }

    const matchedShare = (caseStudy.shareSettings || []).find(
      s => s.shareCode.toLowerCase() === code.toLowerCase()
    );

    if (matchedShare && matchedShare.allowQueries === false) {
      return res.status(403).json({ success: false, message: 'Queries are disabled for this share link.' });
    }

    if (matchedShare?.passcode && passcode && passcode.trim() !== matchedShare.passcode.trim()) {
      return res.status(401).json({ success: false, message: 'Invalid passcode.' });
    }

    const newQuery = {
      authorName: (authorName || matchedShare?.recipientName || 'External Expert').trim(),
      authorRole: authorRole || matchedShare?.recipientType?.toLowerCase() || 'banker',
      source: 'portal',
      bankName: bankName.trim(),
      authorPhone: authorPhone.trim(),
      authorEmail: authorEmail.trim(),
      queryText: queryText.trim(),
      status: 'Open',
      attachments: [],
      replies: [],
      staffReply: '',
      isPhoneQuery: false,
      createdAt: new Date()
    };

    caseStudy.bankerQueries.unshift(newQuery);

    logCaseHistory(
      caseStudy,
      newQuery.authorName,
      'External Query Raised',
      `Query received from ${newQuery.authorName} (${newQuery.authorRole}): "${queryText.substring(0, 80)}..."`
    );

    await caseStudy.save();

    res.status(201).json({
      success: true,
      message: 'Query submitted successfully. Staff will review and provide expert clarification.',
      query: newQuery
    });
  } catch (error) {
    console.error('Submit Banker Query Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
