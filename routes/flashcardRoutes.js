const express = require('express')
const router = express.Router()
const flashcardsController = require('../controllers/flashcardsController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .get(flashcardsController.getAllFlashcards)
    .post(flashcardsController.createNewFlashcard)
    .patch(flashcardsController.updateFlashcard)
    .delete(flashcardsController.deleteFlashcard)

router.route('/generate')
    .post(flashcardsController.generateFlashcards)

module.exports = router