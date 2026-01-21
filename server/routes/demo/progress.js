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

// Calculate BMI
router.post('/bmi', (req, res) => {
    try {
        const { weight, height } = req.body;

        if (!weight || !height) {
            return res.status(400).json({ success: false, message: 'Please provide weight and height' });
        }

        const heightInMeters = height / 100;
        const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(2));

        let category;
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi < 25) category = 'Normal';
        else if (bmi < 30) category = 'Overweight';
        else category = 'Obese';

        const healthyWeightRange = {
            min: Number((18.5 * heightInMeters * heightInMeters).toFixed(1)),
            max: Number((24.9 * heightInMeters * heightInMeters).toFixed(1))
        };

        res.status(200).json({
            success: true,
            data: { bmi, category, healthyWeightRange, currentWeight: weight, height }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get analytics
router.get('/analytics', (req, res) => {
    try {
        const userProgress = store.progress
            .filter(p => p.user === req.user._id)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (userProgress.length === 0) {
            return res.status(200).json({
                success: true,
                data: { weightTrend: [], bmiTrend: [], summary: null }
            });
        }

        const weightTrend = userProgress.map(p => ({ date: p.date, weight: p.weight }));
        const bmiTrend = userProgress.map(p => ({ date: p.date, bmi: p.bmi }));

        const first = userProgress[0];
        const last = userProgress[userProgress.length - 1];

        const summary = {
            startWeight: first.weight,
            currentWeight: last.weight,
            weightChange: Number((last.weight - first.weight).toFixed(2)),
            startBMI: first.bmi,
            currentBMI: last.bmi,
            bmiChange: Number((last.bmi - first.bmi).toFixed(2)),
            entriesCount: userProgress.length,
            avgEnergyLevel: Number((userProgress.reduce((sum, p) => sum + (p.energyLevel || 5), 0) / userProgress.length).toFixed(1)),
            avgSleepHours: Number((userProgress.reduce((sum, p) => sum + (p.sleepHours || 7), 0) / userProgress.length).toFixed(1))
        };

        res.status(200).json({
            success: true,
            data: { weightTrend, bmiTrend, summary }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get all progress entries
router.get('/', (req, res) => {
    try {
        const userProgress = store.progress
            .filter(p => p.user === req.user._id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            success: true,
            count: userProgress.length,
            total: userProgress.length,
            data: userProgress
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get single progress entry
router.get('/:id', (req, res) => {
    try {
        const progress = store.progress.find(p => p._id === req.params.id && p.user === req.user._id);
        if (!progress) {
            return res.status(404).json({ success: false, message: 'Progress entry not found' });
        }
        res.status(200).json({ success: true, data: progress });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Create progress entry
router.post('/', (req, res) => {
    try {
        // Calculate BMI if height is in profile
        let bmi = 0;
        if (req.user.profile?.height && req.body.weight) {
            const heightInMeters = req.user.profile.height / 100;
            bmi = Number((req.body.weight / (heightInMeters * heightInMeters)).toFixed(2));
        }

        const progress = {
            _id: store.generateId(),
            user: req.user._id,
            ...req.body,
            bmi,
            date: req.body.date || new Date(),
            createdAt: new Date()
        };

        store.progress.push(progress);

        // Update user's weight in profile
        const userIndex = store.users.findIndex(u => u._id === req.user._id);
        if (userIndex !== -1) {
            store.users[userIndex].profile.weight = req.body.weight;
        }

        res.status(201).json({ success: true, data: progress });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Update progress entry
router.put('/:id', (req, res) => {
    try {
        const index = store.progress.findIndex(p => p._id === req.params.id && p.user === req.user._id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Progress entry not found' });
        }

        store.progress[index] = { ...store.progress[index], ...req.body, updatedAt: new Date() };
        res.status(200).json({ success: true, data: store.progress[index] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Delete progress entry
router.delete('/:id', (req, res) => {
    try {
        const index = store.progress.findIndex(p => p._id === req.params.id && p.user === req.user._id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Progress entry not found' });
        }

        store.progress.splice(index, 1);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;
