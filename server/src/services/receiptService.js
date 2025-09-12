const PDFDocument = require('pdfkit');
const cloud = require('../config/cloudinary');
const streamToBuffer = (stream) => new Promise((res, rej) => { const chunks=[]; stream.on('data', c=>chunks.push(c)); stream.on('end', ()=>res(Buffer.concat(chunks))); stream.on('error', rej); });
exports.generateAndUpload = async (tx) => {
  const doc = new PDFDocument();
  const bufferP = streamToBuffer(doc);
  doc.fontSize(18).text('Recibo - Okutuala', { align:'center' });
  doc.moveDown();
  doc.text(`Transação: ${tx.id}`); doc.text(`Valor: ${tx.amount} ${tx.currency||'AOA'}`);
  doc.end();
  const buffer = await bufferP;
  const res = await cloud.uploader.upload(`data:application/pdf;base64,${buffer.toString('base64')}`, { folder:'receipts' });
  return res.secure_url;
};
