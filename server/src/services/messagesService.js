const messagesRepository = require('../repositories/messagesRepository');

/**
 * Retrieves all messages.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of message objects.
 */
const getMessages = async () => {
    return await messagesRepository.getMessages();
};

/**
 * Creates a new message.
 * @param {string} sender_id - The ID of the message sender.
 * @param {string} receiver_id - The ID of the message receiver.
 * @param {string} message - The content of the message.
 * @returns {Promise<Object>} A promise that resolves to the newly created message object.
 */
const createMessage = async (sender_id, receiver_id, message) => {
    return await messagesRepository.createMessage(sender_id, receiver_id, message);
};

module.exports = {
    getMessages,
    createMessage,
};
