const Reminder = require('../models/Reminder');

// @desc    Get all reminders for user
// @route   GET /api/reminders
// @access  Private
exports.getReminders = async (req, res) => {
    try {
        const { active } = req.query;
        const query = { user: req.user.id };

        if (active === 'true') query.isActive = true;
        if (active === 'false') query.isActive = false;

        const reminders = await Reminder.find(query).sort({ time: 1 });

        res.status(200).json({
            success: true,
            count: reminders.length,
            data: reminders
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Get single reminder
// @route   GET /api/reminders/:id
// @access  Private
exports.getReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        res.status(200).json({
            success: true,
            data: reminder
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Create reminder
// @route   POST /api/reminders
// @access  Private
exports.createReminder = async (req, res) => {
    try {
        req.body.user = req.user.id;

        // Calculate next trigger time
        req.body.nextTrigger = calculateNextTrigger(req.body.time, req.body.days);

        const reminder = await Reminder.create(req.body);

        res.status(201).json({
            success: true,
            data: reminder
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Update reminder
// @route   PUT /api/reminders/:id
// @access  Private
exports.updateReminder = async (req, res) => {
    try {
        let reminder = await Reminder.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        // Recalculate next trigger if time or days changed
        if (req.body.time || req.body.days) {
            req.body.nextTrigger = calculateNextTrigger(
                req.body.time || reminder.time,
                req.body.days || reminder.days
            );
        }

        reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: reminder
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
exports.deleteReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        await reminder.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Toggle reminder active status
// @route   PATCH /api/reminders/:id/toggle
// @access  Private
exports.toggleReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        reminder.isActive = !reminder.isActive;
        if (reminder.isActive) {
            reminder.nextTrigger = calculateNextTrigger(reminder.time, reminder.days);
        }
        await reminder.save();

        res.status(200).json({
            success: true,
            data: reminder
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Get today's reminders
// @route   GET /api/reminders/today
// @access  Private
exports.getTodayReminders = async (req, res) => {
    try {
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayName = dayNames[today.getDay()];

        const reminders = await Reminder.find({
            user: req.user.id,
            isActive: true,
            $or: [
                { days: todayName },
                { days: { $size: 0 } } // Reminders with no specific days set
            ]
        }).sort({ time: 1 });

        res.status(200).json({
            success: true,
            count: reminders.length,
            day: todayName,
            data: reminders
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Helper function to calculate next trigger time
function calculateNextTrigger(time, days) {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    if (!days || days.length === 0) {
        // One-time reminder or daily
        const trigger = new Date();
        trigger.setHours(hours, minutes, 0, 0);
        if (trigger <= now) {
            trigger.setDate(trigger.getDate() + 1);
        }
        return trigger;
    }

    // Find the next occurrence
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + i);
        const dayName = dayNames[checkDate.getDay()];

        if (days.includes(dayName)) {
            checkDate.setHours(hours, minutes, 0, 0);
            if (checkDate > now) {
                return checkDate;
            }
        }
    }

    return null;
}
