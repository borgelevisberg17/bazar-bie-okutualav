// server/src/controllers/uploadsController.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { db, mode } = require('../config/db');

// Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Função para criar storage dinâmico
const createStorage = (folder, publicIdFn) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      format: async () => 'png',
      public_id: publicIdFn,
    },
  });

// Middleware de upload genérico
const createUploadMiddleware = (folder, publicIdFn, single = true, fieldName = 'file') => {
  const storage = createStorage(folder, publicIdFn);
  const upload = multer({ storage });
  return single ? upload.single(fieldName) : upload.array(fieldName);
};

// Função genérica para salvar URL no banco
const saveFileUrlToDB = async ({ table, idField, idValue, column, fileUrl, array = false }) => {
  if (mode === 'pg') {
    if (array) {
      await db.none(`UPDATE ${table} SET ${column}=array_append(${column}, $1) WHERE ${idField}=$2`, [fileUrl, idValue]);
    } else {
      await db.none(`UPDATE ${table} SET ${column}=$1 WHERE ${idField}=$2`, [fileUrl, idValue]);
    }
  } else {
    const { data, error } = await db.select(table, `${idField}, ${column}`);
    if (error) throw error;
    const record = data.find(r => r[idField] === parseInt(idValue));
    if (!record) throw new Error(`${table.slice(0, -1)} não encontrado`);
    if (array) record[column] = record[column] || [];
    const updatedValue = array ? [...record[column], fileUrl] : fileUrl;
    const { error: upErr } = await db.update(table, { [column]: updatedValue }, { [idField]: idValue });
    if (upErr) throw upErr;
  }
};

// Função genérica de upload
const handleUpload = (folder, idField, table, column, array = false) => [
  createUploadMiddleware(folder, (req) => `${folder}-${req.user.uid}-${Date.now()}`),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' });
      const fileUrl = req.file.path;
      const idValue = req.body[idField] || req.user.uid;

      await saveFileUrlToDB({ table, idField, idValue, column, fileUrl, array });
      res.json({ [`${column}_url`]: fileUrl });
    } catch (err) {
      next(err);
    }
  },
];

// ✨ Exports
exports.uploadAvatar = handleUpload('avatars', 'id', 'users', 'avatar_url');
exports.uploadProductImage = handleUpload('products', 'productId', 'products', 'images', true);
exports.uploadStoreDocument = handleUpload('store-docs', 'storeId', 'stores', 'documents', true);