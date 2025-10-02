const categoriesService = ('../services/categoriesService');

exports.list = async (req, res, next) => {
  try {
  const categories = await categoriesService.list;
  res.json(categories);
  } catch (err) {
      next(err);
    }
};