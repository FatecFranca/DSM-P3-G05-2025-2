const PlaceService = require('../services/PlaceService');

class PlaceController {
  // Rotas Públicas
  async search(req, res, next) {
    try {
      const places = await PlaceService.search(req.query);
      return res.status(200).json(places);
    } catch (error) {
      next(error);
    }
  }

  async retrievePublicProfile(req, res, next) {
    try {
      const place = await PlaceService.retrievePublicProfileById(req.params.id);
      return res.status(200).json(place);
    } catch (error) {
      next(error);
    }
  }

  async retrieveComments(req, res, next) {
    try {
      const comments = await PlaceService.retrieveCommentsByPlaceId(req.params.id);
      return res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  }

  // Rotas de Gerenciamento
  async create(req, res, next) {
    try {
      const place = await PlaceService.create(req.body);
      return res.status(201).json(place);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req, res, next) {
    try {
      const places = await PlaceService.findAll();
      return res.status(200).json(places);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const place = await PlaceService.findById(req.params.id);
      return res.status(200).json(place);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const place = await PlaceService.update(req.params.id, req.body);
      return res.status(200).json(place);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await PlaceService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PlaceController();
