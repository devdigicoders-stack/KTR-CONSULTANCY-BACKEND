const InsuranceInquiry = require('../models/InsuranceInquiry');

// Submit Insurance Inquiry
exports.submitInquiry = async (req, res) => {
  try {
    const {
      category,
      name,
      mobile,
      age,
      gender,
      vehicleNumber,
      notes
    } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Name and Mobile Number are required.'
      });
    }

    // Generate unique inquiry ID
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const inquiryId = `KTR-INS-${randomDigits}`;

    let rcDocument = null;
    let previousPolicyDocument = null;

    if (req.files) {
      if (req.files['rcDocument'] && req.files['rcDocument'][0]) {
        rcDocument = {
          filename: req.files['rcDocument'][0].filename,
          path: req.files['rcDocument'][0].path,
          originalName: req.files['rcDocument'][0].originalname
        };
      }
      if (req.files['previousPolicyDocument'] && req.files['previousPolicyDocument'][0]) {
        previousPolicyDocument = {
          filename: req.files['previousPolicyDocument'][0].filename,
          path: req.files['previousPolicyDocument'][0].path,
          originalName: req.files['previousPolicyDocument'][0].originalname
        };
      }
    }

    const inquiry = new InsuranceInquiry({
      inquiryId,
      category: category || 'Life Insurance',
      name,
      mobile,
      age: age || '',
      gender: gender || 'male',
      vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase() : '',
      rcDocument,
      previousPolicyDocument,
      notes: notes || ''
    });

    await inquiry.save();

    res.status(201).json({
      success: true,
      message: 'Insurance inquiry submitted successfully.',
      data: inquiry
    });
  } catch (error) {
    console.error('Error submitting insurance inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting inquiry.',
      error: error.message
    });
  }
};

// Get All Inquiries (Admin)
exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await InsuranceInquiry.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });
  } catch (error) {
    console.error('Error fetching insurance inquiries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiries.',
      error: error.message
    });
  }
};

// Update Status (Admin)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const inquiry = await InsuranceInquiry.findByIdAndUpdate(
      id,
      { status, remarks },
      { new: true }
    );

    if (!inquiry) {
      return res.status(400).json({
        success: false,
        message: 'Inquiry not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully.',
      data: inquiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update status.',
      error: error.message
    });
  }
};
