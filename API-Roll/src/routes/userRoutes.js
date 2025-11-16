const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

router.post('/', UserController.create.bind(UserController));
router.get('/', UserController.findAll.bind(UserController));
router.get('/:id', UserController.findById.bind(UserController));
router.put('/:id', UserController.update.bind(UserController));
router.delete('/:id', UserController.delete.bind(UserController));

module.exports = router;
