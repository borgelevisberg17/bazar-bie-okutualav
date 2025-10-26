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

/**
 * Creates a dynamic Cloudinary storage engine.
 * @param {string} folder - The folder in Cloudinary to store the files.
 * @param {Function} publicIdFn - A function to generate the public ID for the file.
 * @returns {CloudinaryStorage} A CloudinaryStorage instance.
 */
const createStorage = (folder, publicIdFn) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      format: async () => 'png',
      public_id: publicIdFn,
    },
  });

/**
 * Creates a generic Multer upload middleware.
 * @param {string} folder - The Cloudinary folder.
 * @param {Function} publicIdFn - The function to generate the public ID.
 * @param {boolean} [single=true] - Whether to upload a single file or an array.
 * @param {string} [fieldName='file'] - The name of the form field for the file.
 * @returns {Function} A Multer middleware instance.
 */
const createUploadMiddleware = (folder, publicIdFn, single = true, fieldName = 'file') => {
  const storage = createStorage(folder, publicIdFn);
  const upload = multer({ storage });
  return single ? upload.single(fieldName) : upload.array(fieldName);
};

/**
 * Saves a file URL to the database.
 * @param {Object} options - The options for saving the file URL.
 * @param {string} options.table - The database table to update.
 * @param {string} options.idField - The name of the ID field in the table.
 * @param {*} options.idValue - The value of the ID to match.
 * @param {string} options.column - The name of the column to store the URL in.
 * @param {string} options.fileUrl - The URL of the uploaded file.
 * @param {boolean} [options.array=false] - Whether to append the URL to an array.
 * @returns {Promise<void>}
 */
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

/**
 * Handles the entire file upload process.
 * @param {string} folder - The Cloudinary folder.
 * @param {string} idField - The name of the ID field in the request body.
 * @param {string} table - The database table to update.
 * @param {string} column - The column to store the URL in.
 * @param {boolean} [array=false] - Whether to append to an array.
 * @returns {Array<Function>} An array of Express middleware functions.
 */
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

/**
 * Uploads a user avatar.
 * @function
 * @returns {Array<Function>} An array of Express middleware functions.
 */
exports.uploadAvatar = handleUpload('avatars', 'id', 'users', 'avatar_url');

/**
 * Uploads a product image.
 * @function
 * @returns {Array<Function>} An array of Express middleware functions.
 */
exports.uploadProductImage = handleUpload('products', 'productId', 'products', 'images', true);

/**
 * Uploads a store document.
 * @function
 * @returns {Array<Function>} An array of Express middleware functions.
 */
exports.uploadStoreDocument = handleUpload('store-docs', 'storeId', 'stores', 'documents', true);
