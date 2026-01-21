const express = require('express');
const jwt = require('jsonwebtoken');
const store = require('./store');

const router = express.Router();

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

router.use(protect);

// Get workout stats
router.get('/stats', (req, res) => {
    try {
        const userWorkouts = store.workouts.filter(w => w.user === req.user._id);
        const period = req.query.period || 'week';

        let startDate = new Date();
        if (period === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
        else startDate.setFullYear(startDate.getFullYear() - 1);

        const periodWorkouts = userWorkouts.filter(w => new Date(w.completedAt) >= startDate);

        const summary = {
            totalWorkouts: periodWorkouts.length,
            totalDuration: periodWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
            totalCalories: periodWorkouts.reduce((sum, w) => sum + (w.totalCaloriesBurned || 0), 0),
            avgDuration: periodWorkouts.length ? Math.round(periodWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / periodWorkouts.length) : 0
        };

        const byType = periodWorkouts.reduce((acc, w) => {
            const existing = acc.find(t => t._id === w.type);
            if (existing) existing.count++;
            else acc.push({ _id: w.type, count: 1 });
            return acc;
        }, []);

        res.status(200).json({
            success: true,
            data: { summary, byType }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get all workouts
router.get('/', (req, res) => {
    try {
        const userWorkouts = store.workouts
            .filter(w => w.user === req.user._id)
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        res.status(200).json({
            success: true,
            count: userWorkouts.length,
            total: userWorkouts.length,
            data: userWorkouts
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get single workout
router.get('/:id', (req, res) => {
    try {
        const workout = store.workouts.find(w => w._id === req.params.id && w.user === req.user._id);
        if (!workout) {
            return res.status(404).json({ success: false, message: 'Workout not found' });
        }
        res.status(200).json({ success: true, data: workout });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Create workout
router.post('/', (req, res) => {
    try {
        const workout = {
            _id: store.generateId(),
            user: req.user._id,
            ...req.body,
            completedAt: req.body.completedAt || new Date(),
            createdAt: new Date()
        };

        store.workouts.push(workout);
        res.status(201).json({ success: true, data: workout });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Update workout
router.put('/:id', (req, res) => {
    try {
        const index = store.workouts.findIndex(w => w._id === req.params.id && w.user === req.user._id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Workout not found' });
        }

        store.workouts[index] = { ...store.workouts[index], ...req.body, updatedAt: new Date() };
        res.status(200).json({ success: true, data: store.workouts[index] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Delete workout
router.delete('/:id', (req, res) => {
    try {
        const index = store.workouts.findIndex(w => w._id === req.params.id && w.user === req.user._id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Workout not found' });
        }

        store.workouts.splice(index, 1);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;
