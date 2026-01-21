const express = require('express');
const jwt = require('jsonwebtoken');
const store = require('./store');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'demo_secret', {
        expiresIn: '30d'
    });
};

// Middleware to verify token
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo_secret');
        req.user = store.users.find(u => u._id === decoded.id);
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
};

// Register
router.post('/register', (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        if (store.users.find(u => u.email === email)) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Create user
        const user = {
            _id: store.generateId(),
            name,
            email,
            password, // In demo mode, we don't hash
            profile: {
                height: 0,
                weight: 0,
                age: 0,
                gender: 'other',
                activityLevel: 'moderate',
                goalWeight: 0,
                fitnessGoal: 'maintain'
            },
            settings: {
                notifications: true,
                darkMode: true,
                units: 'metric'
            },
            createdAt: new Date()
        };

        store.users.push(user);

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                profile: user.profile,
                settings: user.settings
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Find user (in demo mode, any password works for demo@fittracker.com)
        const user = store.users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // In demo mode, accept any password or check if passwords match
        if (user.email !== 'demo@fittracker.com' && user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                profile: user.profile,
                settings: user.settings
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get current user
router.get('/me', protect, (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            profile: req.user.profile,
            settings: req.user.settings
        }
    });
});

// Update profile
router.put('/profile', protect, (req, res) => {
    try {
        const { name, profile, settings } = req.body;
        const userIndex = store.users.findIndex(u => u._id === req.user._id);

        if (name) store.users[userIndex].name = name;
        if (profile) store.users[userIndex].profile = { ...store.users[userIndex].profile, ...profile };
        if (settings) store.users[userIndex].settings = { ...store.users[userIndex].settings, ...settings };

        res.status(200).json({
            success: true,
            data: store.users[userIndex]
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Update password
router.put('/password', protect, (req, res) => {
    try {
        const userIndex = store.users.findIndex(u => u._id === req.user._id);
        store.users[userIndex].password = req.body.newPassword;

        res.status(200).json({
            success: true,
            message: 'Password updated'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;
