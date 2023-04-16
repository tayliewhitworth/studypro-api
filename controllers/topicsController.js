const Topic = require('../model/Topic')
const Flashcard = require('../model/Flashcard')

// get all topics
// get method

const getAllTopics = async (req, res) => {
    const topics = await Topic.find().populate('flashcards')
    const topicsWithFlashcards = topics.map((topic) => {
        const { _id, topicName, flashcards} = topic
        return {
            _id,
            topicName,
            flashcards: Array.isArray(flashcards) && flashcards.length > 0 ? flashcards : []
        }
    })
    if (topicsWithFlashcards) {
        return res.json(topicsWithFlashcards)
    } else {
        return res.status(500).json({ message: 'Error getting all the topics' })
    }
}


// create a topic
// post method
const createNewTopic = async (req, res) => {
    const { topicName } = req.body
    if (!topicName) {
        return res.status(400).json({ message: 'Please include a topic name when creating a topic' })
    }

    const duplicate = await Topic.findOne({ topicName }).collation({ locale: "en", strength: 2 }).lean().exec()
    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate topic name' })
    }

    const topic = await Topic.create({ topicName })
    if (topic) {
        return res.status(201).json({ message: `New topic ${topic.topicName} created`})
    } else {
        return res.status(500).json({ message: 'Error creating a topic, try checking topicname'})
    }
}

// patch method 
// updated a topic
const updateTopic = async (req, res) => {
    const { id, topicName } = req.body 
    if (!id || !topicName) {
        return res.status(400).json({ message: 'Please include ID and topicName in body' })
    }
    const topic = await Topic.findById(id).exec()
    if (!topic) {
        return res.status(400).json({ message: "Topic not found" });
    }

    const duplicate = await Topic.findOne({ topicName }).collation({ locale: "en", strength: 2 }).lean().exec()
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: "Duplicate topic name" });
    }

    topic.topicName = topicName
    const updatedTopic = await topic.save()
    res.json({ message: `${updatedTopic.topicName} updated`})
}

// delete method
// delete topic by id
const deleteTopic = async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'Topic ID required' })
    }

    const flaschard = await Flashcard.findOne({ topic: id }).lean().exec()
    if (flaschard) {
        return res.status(400).json({ message: 'Topic has assigned flashcards' })
    }

    const topic = await Topic.findById(id).exec()
    if (!topic) {
        return res.status(400).json({ message: 'Topic not found' })
    }

    const result = await topic.deleteOne()
    const reply = `Topic ${result.topicName} with ID ${result._id} deleted`
    res.json(reply)
}

module.exports = {
    getAllTopics,
    createNewTopic,
    updateTopic,
    deleteTopic
}