const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Multer storage engine for Cloudinary.
 * @type {CloudinaryStorage}
 */
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'products',
        format: async (req, file) => 'png', // or 'jpeg', 'jpg' etc.
        public_id: (req, file) => `product-${Date.now()}`,
    },
});

/**
 * Multer middleware for handling file uploads to Cloudinary.
 * @type {import('multer').Multer}
 */
const upload = multer({ storage: storage });

module.exports = upload;
