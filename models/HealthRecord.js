const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
    healthProblem: String,
    nutrientDeficiencies: [String],
    dietSuggestions: [
        {
            foodName: String,
            nutrients: String,
            benefits: String
        }
    ],
    yogaRecommendations: [String],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
