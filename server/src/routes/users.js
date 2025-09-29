// routes/userRoutes.js
const { Router } = require('express');
const userController = require('../controllers/userController');
const authFirebase = require('../middleware/authFirebase'); // Middleware JWT/Firebase

const router = Router();


// Perfil (precisa estar autenticado)
router.get('/me', authFirebase, userController.getProfile);
router.put('/me', authFirebase, userController.updateProfile);

const authAdmin = require('../middleware/authAdmin');

// Listar usuários (apenas admin)
router.get('/', authFirebase, authAdmin, userController.listUsers);

// Atualizar usuário (apenas admin)
router.put('/:id', authFirebase, authAdmin, userController.updateUser);

// Deletar usuário (apenas admin)
router.delete('/:id', authFirebase, authAdmin, userController.deleteUser);


module.exports = router;