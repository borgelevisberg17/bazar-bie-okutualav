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
