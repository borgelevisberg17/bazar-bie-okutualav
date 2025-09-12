// routes/userRoutes.js
const { Router } = require('express');
const userController = require('../controllers/userController');
const authFirebase = require('../middleware/authFirebase'); // Middleware JWT/Firebase

const router = Router();

// Registro e login local (sem Firebase)
router.post('/register', userController.register);
router.post('/login', userController.login);

// Perfil (precisa estar autenticado)
router.get('/me', authFirebase, userController.getProfile);
router.put('/me', authFirebase, userController.updateProfile);

// Listar usuários
router.get('/', userController.listUsers);

module.exports = router;