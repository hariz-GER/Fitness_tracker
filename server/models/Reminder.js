const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a reminder title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: String,
    type: {
        type: String,
        enum: ['workout', 'meal', 'water', 'sleep', 'medication', 'weight_check', 'custom'],
        default: 'custom'
    },
    time: {
        type: String,
        required: true // Format: HH:mm
    },
    days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    isRecurring: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sound: {
        type: String,
        enum: ['default', 'gentle', 'energetic', 'silent'],
        default: 'default'
    },
    lastTriggered: Date,
    nextTrigger: Date,
    icon: {
        type: String,
        default: '🔔'
    },
    color: {
        type: String,
        default: '#6366f1'
    }
}, {
    timestamps: true
});

// Index for efficient queries
ReminderSchema.index({ user: 1, isActive: 1 });
ReminderSchema.index({ nextTrigger: 1 });

module.exports = mongoose.model('Reminder', ReminderSchema);
