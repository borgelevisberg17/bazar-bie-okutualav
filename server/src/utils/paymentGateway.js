/**
 * Simulates processing a payment.
 * @param {Object} paymentInfo - The payment information.
 * @param {string} paymentInfo.cardNumber - The credit card number.
 * @param {string} paymentInfo.expiryDate - The credit card expiry date.
 * @param {string} paymentInfo.cvv - The credit card CVV.
 * @returns {Promise<{success: boolean, transactionId?: string, message?: string}>} A promise that resolves to a payment result object.
 */
const processPayment = (paymentInfo) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (paymentInfo.cardNumber && paymentInfo.expiryDate && paymentInfo.cvv) {
        resolve({ success: true, transactionId: 'mock-transaction-' + Date.now() });
      } else {
        reject({ success: false, message: 'Invalid payment information' });
      }
    }, 2000);
  });
};

module.exports = { processPayment };
