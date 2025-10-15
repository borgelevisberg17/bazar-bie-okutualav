const messagesService = require('../services/messagesService');

const getMessages = async (req, res) => {
    try {
        const messages = await messagesService.getMessages();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error getting messages' });
    }
};

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