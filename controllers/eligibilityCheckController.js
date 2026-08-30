const EligibilityCheck = require('../models/EligibilityCheck');

// Generate unique ID like KTR-EC-12345
const generateCaseId = async () => {
  const count = await EligibilityCheck.countDocuments();
  const dateStr = new Date().toISOString().slice(2,10).replace(/-/g, '');
  return `KTR-EC-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
};

exports.submitEligibilityCheck = async (req, res) => {
  try {
    const caseId = await generateCaseId();
    
    const newCheck = new EligibilityCheck({
      ...req.body,
      caseId
    });

    await newCheck.save();
    
    res.status(201).json({
      success: true,
      message: 'Eligibility Check request submitted successfully',
      data: {
        caseId: newCheck.caseId
      }
    });
  } catch (error) {
    console.error('Error submitting eligibility check:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getAllEligibilityChecks = async (req, res) => {
  try {
    const checks = await EligibilityCheck.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: checks });
  } catch (error) {
    console.error('Error fetching eligibility checks:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateEligibilityCheckStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const check = await EligibilityCheck.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!check) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.status(200).json({ success: true, data: check });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.addEligibilityCheckRemark = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;
    const check = await EligibilityCheck.findByIdAndUpdate(
      id,
      { remark },
      { new: true }
    );
    if (!check) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.status(200).json({ success: true, data: check });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
