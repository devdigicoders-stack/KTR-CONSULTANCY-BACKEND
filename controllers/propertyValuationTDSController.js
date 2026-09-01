const PropertyValuationTDS = require('../models/PropertyValuationTDS');

// Submit Application / Inquiry
exports.submitApplication = async (req, res) => {
  try {
    const {
      serviceType,
      name,
      mobile,
      email,
      pan,
      propertyAddress,
      transactionValue,
      transactionDate,
      transactionType,
      notes
    } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Name and Mobile Number are required.'
      });
    }

    // Generate unique Application ID
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const applicationId = `KTR-PVT-${randomDigits}`;

    let deedDocument = null;
    if (req.file) {
      deedDocument = {
        filename: req.file.filename,
        path: req.file.path,
        originalName: req.file.originalname
      };
    }

    const application = new PropertyValuationTDS({
      applicationId,
      serviceType: serviceType || 'Property Valuation for Income Tax',
      name,
      mobile,
      email: email || '',
      pan: pan ? pan.toUpperCase() : '',
      propertyAddress: propertyAddress || '',
      transactionValue: transactionValue || '',
      transactionDate: transactionDate || '',
      transactionType: transactionType || 'Buyer (Purchased)',
      deedDocument,
      notes: notes || ''
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Property Valuation & TDS application submitted successfully.',
      data: application
    });
  } catch (error) {
    console.error('Error submitting Property Valuation & TDS application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting application.',
      error: error.message
    });
  }
};

// Get All Applications (Admin)
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await PropertyValuationTDS.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications.',
      error: error.message
    });
  }
};

// Update Status (Admin)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const application = await PropertyValuationTDS.findByIdAndUpdate(
      id,
      { status, remarks },
      { new: true }
    );

    if (!application) {
      return res.status(400).json({
        success: false,
        message: 'Application not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully.',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update status.',
      error: error.message
    });
  }
};
