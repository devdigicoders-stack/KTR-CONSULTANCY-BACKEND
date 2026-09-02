const OnlineApplication = require('../models/OnlineApplication');

// @desc    Submit a new online application
// @route   POST /api/applications/submit
// @access  Public
exports.submitApplication = async (req, res) => {
  try {
    const {
      serviceType,
      fullName,
      mobile,
      email,
      dob,
      gender,
      maritalStatus,
      residentialCity,
      preferredBranch,
      source,
      loanAmount,
      purpose,
      employmentType,
      message,
      propertyAddress
    } = req.body;

    if (!fullName || !mobile || !purpose || !employmentType) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    if (purpose === 'Other' && !req.body.otherPurpose) {
      return res.status(400).json({ success: false, message: 'Please specify your reason.' });
    }

    if (serviceType === 'Other' && !req.body.otherServiceType) {
      return res.status(400).json({ success: false, message: 'Please specify the service you are looking for.' });
    }

    const application = await OnlineApplication.create({
      ...req.body,
      applicationId: 'KTR' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(2, 5).toUpperCase()
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again later.' });
  }
};

// @desc    Get all online applications
// @route   GET /api/applications
// @access  Private/Admin
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await OnlineApplication.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
// @access  Private/Admin
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Pending', 'In Progress', 'Completed', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const application = await OnlineApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private/Admin
exports.deleteApplication = async (req, res) => {
  try {
    const application = await OnlineApplication.findByIdAndDelete(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get pending applications count
// @route   GET /api/applications/pending-count
// @access  Private/Admin
exports.getPendingCount = async (req, res) => {
  try {
    const count = await OnlineApplication.countDocuments({ status: 'Pending' });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update application remark
// @route   PATCH /api/applications/:id/remark
// @access  Private/Admin
exports.updateRemark = async (req, res) => {
  try {
    const { remark } = req.body;
    const application = await OnlineApplication.findByIdAndUpdate(
      req.params.id,
      { remark },
      { new: true }
    );
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
