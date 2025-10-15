const pool = require('../config/db');

const getMessages = async () => {
    const result = await pool.query('SELECT * FROM messages');
    return result.rows;
};

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