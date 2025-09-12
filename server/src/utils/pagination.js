exports.paginate = (page = 1, limit = 24) => ({
  limit: +limit,
  offset: (+page - 1) * +limit,
});
