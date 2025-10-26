const PDFDocument = require('pdfkit');
const cloud = require('../config/cloudinary');

/**
 * Converts a readable stream to a buffer.
 * @param {ReadableStream} stream - The stream to convert.
 * @returns {Promise<Buffer>} A promise that resolves to a buffer containing the stream's data.
 */
const streamToBuffer = (stream) => new Promise((res, rej) => {
  const chunks = [];
  stream.on('data', c => chunks.push(c));
  stream.on('end', () => res(Buffer.concat(chunks)));
  stream.on('error', rej);
});

/**
 * Generates a PDF receipt for a transaction and uploads it to Cloudinary.
 * @param {Object} tx - The transaction object.
 * @param {string} tx.id - The transaction ID.
 * @param {number} tx.amount - The transaction amount.
 * @param {string} [tx.currency='AOA'] - The transaction currency.
 * @returns {Promise<string>} A promise that resolves to the secure URL of the uploaded receipt.
 */
exports.generateAndUpload = async (tx) => {
  const doc = new PDFDocument();
  const bufferP = streamToBuffer(doc);
  doc.fontSize(18).text('Recibo - Okutuala', { align: 'center' });
  doc.moveDown();
  doc.text(`Transação: ${tx.id}`);
  doc.text(`Valor: ${tx.amount} ${tx.currency || 'AOA'}`);
  doc.end();
  const buffer = await bufferP;
  const res = await cloud.uploader.upload(`data:application/pdf;base64,${buffer.toString('base64')}`, { folder: 'receipts' });
  return res.secure_url;
};
