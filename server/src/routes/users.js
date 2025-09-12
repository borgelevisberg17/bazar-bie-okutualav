// routes/userRoutes.js
const { Router } = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authfirebase'); // Middleware JWT/Firebase

const router = Router();

// Registro e login local (sem Firebase)
router.post('/register', userController.register);
router.post('/login', userController.login);

// Perfil (precisa estar autenticado)
router.get('/me', authMiddleware, userController.getProfile);
router.put('/me', authMiddleware, userController.updateProfile);

// Administração (somente manager/admin)
router.get('/', authMiddleware, userController.listUsers);

module.exports = router;