const nodemailer = require('nodemailer');

const isProduction = process.env.NODE_ENV === 'production';

const transporterConfig = {
  host: process.env.SMTP_HOST || (isProduction ? '' : 'localhost'),
  port: +process.env.SMTP_PORT || (isProduction ? 587 : 1025),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { 
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS 
  } : undefined
};

let transporter;

if (transporterConfig.host) {
  transporter = nodemailer.createTransport(transporterConfig);
} else {
  transporter = {
    sendMail: async (options) => {
      console.log('📧 [SIMULAÇÃO EMAIL]', {
        to: options.to,
        subject: options.subject
      });
      return { messageId: 'simulated-id' };
    }
  };
}

module.exports = transporter;
