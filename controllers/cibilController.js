const axios = require('axios');

exports.checkCibilScore = async (req, res) => {
  try {
    // 1. Get user data from request body
    const { pan, mobile, name } = req.body;
    
    // In a real scenario, you might validate input here.
    if (!pan || !mobile) {
      return res.status(400).json({ success: false, message: 'PAN and Mobile number are required.' });
    }

    // 2. Setup the request to Surepass API
    const surepassApiUrl = process.env.SUREPASS_API_BASE_URL || 'https://kyc-api.surepass.app/api/v1/cibil/cibil-comprehensive-report';
    
    const config = {
      headers: {
        'Authorization': `Bearer ${process.env.SUREPASS_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const payload = {
      id_number: pan,
      mobile_number: mobile,
      name: name
      // additional fields may be required depending on Surepass's specific CIBIL endpoint
    };

    // 3. Make the API Call
    // const response = await axios.post(surepassApiUrl, payload, config);
    
    // For now, returning a mock response since the API might require a specific schema and we don't want to burn real credits during testing if we aren't sure.
    // Replace this block with actual response handling once token is set and endpoint is confirmed.
    
    /*
    return res.status(200).json({
      success: true,
      data: response.data
    });
    */

    // MOCK RESPONSE (Remove after testing)
    setTimeout(() => {
      res.status(200).json({
        success: true,
        data: {
          score: 750,
          status: 'Excellent',
          report_date: new Date().toISOString(),
          details: 'Your credit history is very healthy.'
        }
      });
    }, 1500);

  } catch (error) {
    console.error('Error checking CIBIL score:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch CIBIL score. Please try again later.',
      error: error.response ? error.response.data : error.message 
    });
  }
};
