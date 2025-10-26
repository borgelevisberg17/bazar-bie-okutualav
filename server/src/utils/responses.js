/**
 * Formats a successful response.
 * @param {*} data - The data to include in the response.
 * @returns {{ok: boolean, data: *}} A success response object.
 */
exports.ok = (data) => ({ ok: true, data });
