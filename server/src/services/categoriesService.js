const repo = ('../repositories/categoriesRepository');

  exports.list = async () => {
    return repo.list();
  }
  
