const messagesService = require('../services/messagesService');
const auth = require('../middleware/auth');

const getConversations = async (req, res) => {
    try {
        const conversations = await messagesService.getConversations(req.user.id);
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: 'Error getting conversations' });
    }
};

const getMessagesWithUser = async (req, res) => {
    try {
        const messages = await messagesService.getMessagesWithUser(req.user.id, req.params.userId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error getting messages' });
    }
};

const createMessage = async (req, res) => {
    try {
        const { receiver_id, message } = req.body;
        const newMessage = await messagesService.createMessage(req.user.id, receiver_id, message);
        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error creating message' });
    }
};

module.exports = {
    getConversations: [auth, getConversations],
    getMessagesWithUser: [auth, getMessagesWithUser],
    createMessage: [auth, createMessage],
};
