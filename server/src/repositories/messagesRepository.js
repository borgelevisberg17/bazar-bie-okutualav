const pool = require('../config/db');

/**
 * Retrieves all messages from the database.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of message objects.
 */
const getMessages = async () => {
    const result = await pool.query('SELECT * FROM messages');
    return result.rows;
};

/**
 * Creates a new message in the database.
 * @param {string} sender_id - The ID of the message sender.
 * @param {string} receiver_id - The ID of the message receiver.
 * @param {string} message - The content of the message.
 * @returns {Promise<Object>} A promise that resolves to the newly created message object.
 */
const createMessage = async (sender_id, receiver_id, message) => {
    const result = await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *',
        [sender_id, receiver_id, message]
    );
    return result.rows[0];
};

module.exports = {
    getMessages,
    createMessage,
};
