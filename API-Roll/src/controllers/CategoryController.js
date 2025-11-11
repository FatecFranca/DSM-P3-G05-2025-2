const CategoryService = require('../services/CategoryService');

class CategoryController {
  async create(req, res, next) {
    try {
      const category = await CategoryService.create(req.body);
      return res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req, res, next) {
    try {
      const categories = await CategoryService.findAll();
      return res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const category = await CategoryService.findById(req.params.id);
      return res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await CategoryService.update(req.params.id, req.body);
      return res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await CategoryService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
