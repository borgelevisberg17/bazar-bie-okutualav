const messagesRepository = require('../repositories/messagesRepository');

const getConversations = async (userId) => {
    return await messagesRepository.getConversations(userId);
};

const getMessagesWithUser = async (userId, otherUserId) => {
    return await messagesRepository.getMessagesWithUser(userId, otherUserId);
};

const createMessage = async (sender_id, receiver_id, message) => {
    return await messagesRepository.createMessage(sender_id, receiver_id, message);
};

module.exports = {
    getConversations,
    getMessagesWithUser,
    createMessage,
};
