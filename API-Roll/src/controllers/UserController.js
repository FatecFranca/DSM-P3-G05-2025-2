const UserService = require('../services/UserService');

class UserController {
  async create(req, res, next) {
    try {
      const user = await UserService.create(req.body);
      return res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req, res, next) {
    try {
      const users = await UserService.findAll();
      return res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const user = await UserService.findById(req.params.id);
      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await UserService.update(req.params.id, req.body);
      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await UserService.exclude(req.params.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
