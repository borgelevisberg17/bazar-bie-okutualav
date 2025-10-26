/**
 * Calculates the limit and offset for pagination.
 * @param {number} [page=1] - The current page number.
 * @param {number} [limit=24] - The number of items per page.
 * @returns {{limit: number, offset: number}} An object containing the limit and offset.
 */
exports.paginate = (page = 1, limit = 24) => ({
  limit: +limit,
  offset: (+page - 1) * +limit,
});
