const messagesRepository = require('../repositories/messagesRepository');

const getMessages = async () => {
    return await messagesRepository.getMessages();
};

const createMessage = async (sender_id, receiver_id, message) => {
    return await messagesRepository.createMessage(sender_id, receiver_id, message);
};

module.exports = {
    getMessages,
    createMessage,
};