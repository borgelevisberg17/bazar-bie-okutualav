const nodemailer = require('nodemailer');

/**
 * Nodemailer transporter instance.
 * @type {import('nodemailer').Transporter}
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: +process.env.SMTP_PORT || 1025,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
});

module.exports = transporter;
