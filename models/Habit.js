const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    name: String,
    priority: Number,
    description: String,
    daysFollowed: { type: Number, default: 1 }, // Starts at 1 when added
    lastCompletedDate: { type: Date, default: new Date() }, // To track last completion date
});

module.exports = mongoose.model('Habit', habitSchema);