const axios = require('axios');

/**
 * Initiates an automatic refund via Razorpay API
 * @param {Object} params
 * @param {string} params.paymentId - Razorpay payment ID (e.g. pay_XXXXX)
 * @param {number} [params.amountInRupees] - Amount in INR (optional; full refund if omitted)
 * @param {string} [params.reason] - Reason for refund
 * @param {Object} [params.notes] - Additional metadata notes
 * @returns {Promise<{ success: boolean, refundId?: string, amount?: number, status?: string, message?: string, error?: any }>}
 */
exports.processRazorpayRefund = async ({ paymentId, amountInRupees, reason, notes = {} }) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('Razorpay API keys missing in environment variables');
    return {
      success: false,
      message: 'Payment gateway credentials not configured on server'
    };
  }

  if (!paymentId) {
    return {
      success: false,
      message: 'Payment ID is required to process refund'
    };
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const url = `https://api.razorpay.com/v1/payments/${paymentId}/refund`;

    const payload = {
      notes: {
        reason: reason || 'CIBIL report generation failed',
        refund_timestamp: new Date().toISOString(),
        ...notes
      }
    };

    if (amountInRupees && !isNaN(amountInRupees) && amountInRupees > 0) {
      payload.amount = Math.round(amountInRupees * 100); // in paise
    }

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const refundData = response.data;
    console.log(`[Refund SUCCESS] Payment ${paymentId} -> Refund ID ${refundData.id}, Status: ${refundData.status}`);

    return {
      success: true,
      refundId: refundData.id,
      amount: refundData.amount ? refundData.amount / 100 : amountInRupees,
      status: refundData.status || 'processed',
      currency: refundData.currency || 'INR',
      raw: refundData
    };
  } catch (err) {
    const errorDetails = err.response ? err.response.data : err.message;
    console.error(`[Refund FAILED] Payment ${paymentId}:`, errorDetails);

    return {
      success: false,
      message: err.response?.data?.error?.description || 'Failed to process refund with payment gateway',
      error: errorDetails
    };
  }
};
