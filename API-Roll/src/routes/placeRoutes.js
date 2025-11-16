const express = require('express');
const router = express.Router();
const PlaceController = require('../controllers/PlaceController');

// Rotas Públicas
router.get('/search', PlaceController.search.bind(PlaceController));
router.get('/:id/public', PlaceController.retrievePublicProfile.bind(PlaceController));
router.get('/:id/comments', PlaceController.retrieveComments.bind(PlaceController));

// Rotas de Gerenciamento (CRUD completo)
router.post('/', PlaceController.create.bind(PlaceController));
router.get('/', PlaceController.findAll.bind(PlaceController));
router.get('/:id', PlaceController.findById.bind(PlaceController));
router.put('/:id', PlaceController.update.bind(PlaceController));
router.delete('/:id', PlaceController.delete.bind(PlaceController));

module.exports = router;
