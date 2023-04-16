const mongoose = require('mongoose')

const topicSchema = new mongoose.Schema({
    topicName: {
        type: String,
        required: true
    },
    flashcards: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Flashcard',
        default: []
    },
})

module.exports = mongoose.model('Topic', topicSchema)