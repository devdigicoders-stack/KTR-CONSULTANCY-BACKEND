const ClientProfile = require('../models/ClientProfile');
const OnlineApplication = require('../models/OnlineApplication');
const Enquiry = require('../models/Enquiry');
const CibilCase = require('../models/CibilCase');
const CAQuote = require('../models/CAQuote');
const ChainDeed = require('../models/ChainDeed');
const PropertyAssessment = require('../models/PropertyAssessment');
const EligibilityCheck = require('../models/EligibilityCheck');

exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const [
      clients,
      applications,
      enquiries,
      cibilCases,
      caQuotes,
      chainDeeds,
      propertyAssessments,
      eligibilityChecks
    ] = await Promise.all([
      ClientProfile.find(dateFilter).sort({ createdAt: -1 }),
      OnlineApplication.find(dateFilter).sort({ createdAt: -1 }),
      Enquiry.find(dateFilter).sort({ createdAt: -1 }),
      CibilCase.find(dateFilter).sort({ createdAt: -1 }),
      CAQuote.find(dateFilter).sort({ createdAt: -1 }),
      ChainDeed.find(dateFilter).sort({ createdAt: -1 }),
      PropertyAssessment.find(dateFilter).sort({ createdAt: -1 }),
      EligibilityCheck.find(dateFilter).sort({ createdAt: -1 }),
    ]);

    const summary = {
      clients: clients.length,
      applications: applications.length,
      enquiries: enquiries.length,
      cibilCases: cibilCases.length,
      caQuotes: caQuotes.length,
      chainDeeds: chainDeeds.length,
      propertyAssessments: propertyAssessments.length,
      eligibilityChecks: eligibilityChecks.length
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        lists: {
          clients,
          applications,
          enquiries,
          cibilCases,
          caQuotes,
          chainDeeds,
          propertyAssessments,
          eligibilityChecks
        }
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
