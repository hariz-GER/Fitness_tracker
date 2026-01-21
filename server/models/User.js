const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    avatar: {
        type: String,
        default: ''
    },
    profile: {
        height: { type: Number, default: 0 }, // in cm
        weight: { type: Number, default: 0 }, // in kg
        age: { type: Number, default: 0 },
        gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
        activityLevel: {
            type: String,
            enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
            default: 'moderate'
        },
        goalWeight: { type: Number, default: 0 },
        fitnessGoal: {
            type: String,
            enum: ['lose_weight', 'maintain', 'gain_muscle', 'improve_fitness'],
            default: 'maintain'
        }
    },
    settings: {
        notifications: { type: Boolean, default: true },
        darkMode: { type: Boolean, default: true },
        units: { type: String, enum: ['metric', 'imperial'], default: 'metric' }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
