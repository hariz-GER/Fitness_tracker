const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    weight: {
        type: Number,
        required: true // in kg
    },
    bodyMeasurements: {
        chest: { type: Number, default: 0 },
        waist: { type: Number, default: 0 },
        hips: { type: Number, default: 0 },
        arms: { type: Number, default: 0 },
        thighs: { type: Number, default: 0 },
        calves: { type: Number, default: 0 }
    },
    bodyFatPercentage: {
        type: Number,
        default: 0
    },
    bmi: {
        type: Number,
        default: 0
    },
    muscleMass: {
        type: Number,
        default: 0
    },
    waterPercentage: {
        type: Number,
        default: 0
    },
    notes: String,
    photoUrl: String,
    energyLevel: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    sleepHours: {
        type: Number,
        default: 0
    },
    sleepQuality: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent'],
        default: 'good'
    }
}, {
    timestamps: true
});

// Index for efficient date-based queries
ProgressSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Progress', ProgressSchema);
