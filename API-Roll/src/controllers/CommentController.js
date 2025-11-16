const CommentService = require('../services/CommentService');

class CommentController {
  async create(req, res, next) {
    try {
      const comment = await CommentService.create(req.body);
      return res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await CommentService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CommentController();
