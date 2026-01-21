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

// Get today's reminders
router.get('/today', (req, res) => {
    try {
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayName = dayNames[today.getDay()];

        const reminders = store.reminders.filter(r => {
            if (r.user !== req.user._id || !r.isActive) return false;
            return r.days?.includes(todayName) || r.days?.length === 0;
        }).sort((a, b) => a.time.localeCompare(b.time));

        res.status(200).json({
            success: true,
            count: reminders.length,
            day: todayName,
            data: reminders
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Toggle reminder
router.patch('/:id/toggle', (req, res) => {
    try {
        const index = store.reminders.findIndex(r => r._id === req.params.id && r.user === req.user._id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Reminder not found' });
        }

        store.reminders[index].isActive = !store.reminders[index].isActive;
        res.status(200).json({ success: true, data: store.reminders[index] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get all reminders
router.get('/', (req, res) => {
    try {
        const userReminders = store.reminders
            .filter(r => r.user === req.user._id)
            .sort((a, b) => a.time.localeCompare(b.time));

        res.status(200).json({
            success: true,
            count: userReminders.length,
            data: userReminders
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get single reminder
router.get('/:id', (req, res) => {
    try {
        const reminder = store.reminders.find(r => r._id === req.params.id && r.user === req.user._id);
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Reminder not found' });
        }
        res.status(200).json({ success: true, data: reminder });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Create reminder
router.post('/', (req, res) => {
    try {
        const reminder = {
            _id: store.generateId(),
            user: req.user._id,
            ...req.body,
            isActive: true,
            createdAt: new Date()
        };

        store.reminders.push(reminder);
        res.status(201).json({ success: true, data: reminder });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Update reminder
router.put('/:id', (req, res) => {
    try {
        const index = store.reminders.findIndex(r => r._id === req.params.id && r.user === req.user._id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Reminder not found' });
        }

        store.reminders[index] = { ...store.reminders[index], ...req.body, updatedAt: new Date() };
        res.status(200).json({ success: true, data: store.reminders[index] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Delete reminder
router.delete('/:id', (req, res) => {
    try {
        const index = store.reminders.findIndex(r => r._id === req.params.id && r.user === req.user._id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Reminder not found' });
        }

        store.reminders.splice(index, 1);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;
