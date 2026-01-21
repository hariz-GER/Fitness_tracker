const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['cardio', 'strength', 'flexibility', 'balance', 'sports'],
        required: true
    },
    sets: {
        type: Number,
        default: 0
    },
    reps: {
        type: Number,
        default: 0
    },
    weight: {
        type: Number,
        default: 0 // in kg
    },
    duration: {
        type: Number,
        default: 0 // in minutes
    },
    distance: {
        type: Number,
        default: 0 // in km
    },
    caloriesBurned: {
        type: Number,
        default: 0
    },
    notes: String
});

const WorkoutSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a workout title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    type: {
        type: String,
        enum: ['cardio', 'strength', 'hiit', 'yoga', 'mixed', 'sports', 'other'],
        default: 'mixed'
    },
    exercises: [ExerciseSchema],
    duration: {
        type: Number,
        required: [true, 'Please add workout duration'],
        default: 0 // total duration in minutes
    },
    totalCaloriesBurned: {
        type: Number,
        default: 0
    },
    intensity: {
        type: String,
        enum: ['low', 'moderate', 'high', 'extreme'],
        default: 'moderate'
    },
    mood: {
        before: { type: String, enum: ['great', 'good', 'okay', 'tired', 'exhausted'], default: 'okay' },
        after: { type: String, enum: ['great', 'good', 'okay', 'tired', 'exhausted'], default: 'great' }
    },
    notes: String,
    isCompleted: {
        type: Boolean,
        default: true
    },
    scheduledFor: Date,
    completedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate total calories before saving
WorkoutSchema.pre('save', function (next) {
    if (this.exercises && this.exercises.length > 0) {
        this.totalCaloriesBurned = this.exercises.reduce((total, exercise) => {
            return total + (exercise.caloriesBurned || 0);
        }, 0);
    }
    next();
});

module.exports = mongoose.model('Workout', WorkoutSchema);
