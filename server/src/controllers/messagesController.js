const messagesService = require('../services/messagesService');

/**
 * Retrieves all messages.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>}
 */
const getMessages = async (req, res) => {
    try {
        const messages = await messagesService.getMessages();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error getting messages' });
    }
};

/**
 * Creates a new message.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.sender_id - The ID of the message sender.
 * @param {string} req.body.receiver_id - The ID of the message receiver.
 * @param {string} req.body.message - The content of the message.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>}
 */
const createMessage = async (req, res) => {
    try {
        const { sender_id, receiver_id, message } = req.body;
        const newMessage = await messagesService.createMessage(sender_id, receiver_id, message);
        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error creating message' });
    }
};

module.exports = {
    getMessages,
    createMessage,
};
