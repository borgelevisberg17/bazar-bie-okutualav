const { db, mode } = require("../config/db");

exports.list = async () => {
    if (mode === "pg") {
        const query = `SELECT * FROM categories`;
        return await db.any(query);
    } else {
        return await db.select("categories", "*");
    }
};
