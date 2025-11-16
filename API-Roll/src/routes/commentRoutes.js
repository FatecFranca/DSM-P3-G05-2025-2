const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/CommentController');

router.post('/', CommentController.create.bind(CommentController));
router.delete('/:id', CommentController.delete.bind(CommentController));

module.exports = router;
