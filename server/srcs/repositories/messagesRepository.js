const { db } = require('../config/db');

const getConversations = async (userId) => {
    const query = `
        SELECT DISTINCT ON (u.id)
            u.id,
            u.name,
            u.avatar_url,
            m.body AS last_message,
            m.created_at
        FROM messages m
        JOIN users u ON u.id = m.from_user_id OR u.id = m.to_user_id
        WHERE (m.from_user_id = $1 OR m.to_user_id = $1) AND u.id != $1
        ORDER BY u.id, m.created_at DESC;
    `;
    return db.any(query, [userId]);
};

const getMessagesWithUser = async (userId, otherUserId) => {
    const query = `
        SELECT *
        FROM messages
        WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)
        ORDER BY created_at ASC;
    `;
    return db.any(query, [userId, otherUserId]);
};

const createMessage = async (sender_id, receiver_id, message) => {
    const query = 'INSERT INTO messages (from_user_id, to_user_id, body) VALUES ($1, $2, $3) RETURNING *';
    return db.one(query, [sender_id, receiver_id, message]);
};

module.exports = {
    getConversations,
    getMessagesWithUser,
    createMessage,
};
