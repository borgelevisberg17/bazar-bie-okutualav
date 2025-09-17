const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const db = require('../config/db');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'avatars',
        format: async (req, file) => 'png', // supports promises as well
        public_id: (req, file) => `avatar-${req.user.uid}`,
    },
});

const parser = multer({ storage: storage });

exports.uploadAvatar = [
    parser.single('avatar'),
    async (req, res, next) => {
        try {
            const avatar_url = req.file.path;
            const userId = req.user.uid;
            await db.none('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatar_url, userId]);
            res.json({ avatar_url });
        } catch (error) {
            next(error);
        }
    }
];
