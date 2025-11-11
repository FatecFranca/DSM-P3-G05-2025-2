const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');

router.post('/', CategoryController.create.bind(CategoryController));
router.get('/', CategoryController.findAll.bind(CategoryController));
router.get('/:id', CategoryController.findById.bind(CategoryController));
router.put('/:id', CategoryController.update.bind(CategoryController));
router.delete('/:id', CategoryController.delete.bind(CategoryController));

module.exports = router;
