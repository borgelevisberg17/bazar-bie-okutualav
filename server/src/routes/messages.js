const { Router } = require('express');
const router = Router();
const messagesController = require('../controllers/messagesController');

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management routes
 */

/**
 * @swagger
 * /messages:
 *   get:
 *     summary: Get all messages.
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: A list of conversations.
 */
router.get('/conversations', messagesController.getConversations);

/**
 * @swagger
 * /messages/{userId}:
 *   get:
 *     summary: Get all messages in a conversation.
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of messages.
 */
router.get('/:userId', messagesController.getMessagesWithUser);

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Create a new message.
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sender_id:
 *                 type: string
 *               receiver_id:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created message.
 */
router.post('/', messagesController.createMessage);

module.exports = router;
