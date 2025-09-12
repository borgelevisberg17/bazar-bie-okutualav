exports.paginate = (page=1, limit=24) => ({ limitClause: `LIMIT ${+limit}`, offset: (+page-1)*+limit });
