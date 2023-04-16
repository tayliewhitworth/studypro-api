const express = require('express')
const router = express.Router()
const topicsController = require('../controllers/topicsController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .get(topicsController.getAllTopics)
    .post(topicsController.createNewTopic)
    .patch(topicsController.updateTopic)
    .delete(topicsController.deleteTopic)


// could add getting a topic by ID
// router.route('/:topicId').get(topicsController.getTopicById)

module.exports = router