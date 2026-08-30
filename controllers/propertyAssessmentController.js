const PropertyAssessment = require('../models/PropertyAssessment');

const generateAppId = (serviceType) => {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  let prefix = 'PA';
  if (serviceType === 'lda-map') prefix = 'LM';
  if (serviceType === 'map-estimate') prefix = 'ME';
  return `KTR-${prefix}-${ts}${rand}`;
};

const getFileObj = (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    return {
      url: `/uploads/${files[fieldName][0].filename}`,
      name: files[fieldName][0].originalname
    };
  }
  return undefined;
};

// @desc    Submit a Property Assessment Application (public)
// @route   POST /api/property-assessments/submit
exports.submitApplication = async (req, res) => {
  try {
    const { serviceType, name, mobile, email, dimensions } = req.body;
    
    if (!serviceType || !mobile) {
      return res.status(400).json({ success: false, message: 'Service type and mobile number are required.' });
    }

    const applicationId = generateAppId(serviceType);
    
    const documents = {
      propertyPapers: getFileObj(req.files, 'property-papers'),
      electricityBill: getFileObj(req.files, 'electricity-bill'),
      ownerPhoto: getFileObj(req.files, 'owner-photo'),
      panCard: getFileObj(req.files, 'pan-card'),
      aadhaarCard: getFileObj(req.files, 'aadhaar-card'),
      propertyPhoto: getFileObj(req.files, 'property-photo')
    };

    if (req.files && req.files['gps-photo']) {
      documents.gpsPhotos = req.files['gps-photo'].map(f => ({
        url: `/uploads/${f.filename}`,
        name: f.originalname
      }));
    }

    const application = await PropertyAssessment.create({
      applicationId,
      serviceType,
      customerDetails: {
        name: name || '',
        mobile,
        email: email || '',
        dimensions: dimensions || ''
      },
      documents
    });

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: application });
  } catch (error) {
    console.error('Error submitting Property Assessment:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// @desc    Get all applications (admin)
// @route   GET /api/property-assessments
exports.getAllApplications = async (req, res) => {
  try {
    const apps = await PropertyAssessment.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get new count (admin)
// @route   GET /api/property-assessments/new-count
exports.getNewCount = async (req, res) => {
  try {
    const count = await PropertyAssessment.countDocuments({ status: 'New' });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update status (admin)
// @route   PATCH /api/property-assessments/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['New', 'Processing', 'Completed', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const app = await PropertyAssessment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.status(200).json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update remark (admin)
// @route   PATCH /api/property-assessments/:id/remark
exports.updateRemark = async (req, res) => {
  try {
    const { remark } = req.body;
    const app = await PropertyAssessment.findByIdAndUpdate(req.params.id, { remark }, { new: true });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.status(200).json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete application (admin)
// @route   DELETE /api/property-assessments/:id
exports.deleteApplication = async (req, res) => {
  try {
    const app = await PropertyAssessment.findByIdAndDelete(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.status(200).json({ success: true, message: 'Application deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
