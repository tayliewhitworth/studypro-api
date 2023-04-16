const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    flashcards: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Flashcard',
        default: []
    },
})

module.exports = mongoose.model('User', userSchema)