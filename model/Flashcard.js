const mongoose = require('mongoose')

const flashcardSchema = new mongoose.Schema({
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    },
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewDate: {
        type: Date,
        required: true,
        default: () => new Date(),
    },
    interval: {
        type: Number,
        required: true,
        default: 1,
    }
})

module.exports = mongoose.model('Flashcard', flashcardSchema)