const Progress = require('../models/Progress');
const User = require('../models/User');

// @desc    Get all progress entries
// @route   GET /api/progress
// @access  Private
exports.getProgressHistory = async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;

        const progress = await Progress.find({ user: req.user.id })
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Progress.countDocuments({ user: req.user.id });

        res.status(200).json({
            success: true,
            count: progress.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: progress
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Get single progress entry
// @route   GET /api/progress/:id
// @access  Private
exports.getProgress = async (req, res) => {
    try {
        const progress = await Progress.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Progress entry not found'
            });
        }

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Create progress entry
// @route   POST /api/progress
// @access  Private
exports.createProgress = async (req, res) => {
    try {
        req.body.user = req.user.id;

        // Calculate BMI if height is available
        const user = await User.findById(req.user.id);
        if (user.profile.height && req.body.weight) {
            const heightInMeters = user.profile.height / 100;
            req.body.bmi = Number((req.body.weight / (heightInMeters * heightInMeters)).toFixed(2));
        }

        const progress = await Progress.create(req.body);

        // Update user's current weight
        await User.findByIdAndUpdate(req.user.id, {
            'profile.weight': req.body.weight
        });

        res.status(201).json({
            success: true,
            data: progress
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Update progress entry
// @route   PUT /api/progress/:id
// @access  Private
exports.updateProgress = async (req, res) => {
    try {
        let progress = await Progress.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Progress entry not found'
            });
        }

        // Recalculate BMI if weight is updated
        if (req.body.weight) {
            const user = await User.findById(req.user.id);
            if (user.profile.height) {
                const heightInMeters = user.profile.height / 100;
                req.body.bmi = Number((req.body.weight / (heightInMeters * heightInMeters)).toFixed(2));
            }
        }

        progress = await Progress.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Delete progress entry
// @route   DELETE /api/progress/:id
// @access  Private
exports.deleteProgress = async (req, res) => {
    try {
        const progress = await Progress.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Progress entry not found'
            });
        }

        await progress.deleteOne();

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

// @desc    Calculate BMI
// @route   POST /api/progress/bmi
// @access  Private
exports.calculateBMI = async (req, res) => {
    try {
        const { weight, height } = req.body;

        if (!weight || !height) {
            return res.status(400).json({
                success: false,
                message: 'Please provide weight and height'
            });
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
            data: {
                bmi,
                category,
                healthyWeightRange,
                currentWeight: weight,
                height
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Get progress analytics
// @route   GET /api/progress/analytics
// @access  Private
exports.getAnalytics = async (req, res) => {
    try {
        const { period = 'month' } = req.query;

        let startDate = new Date();
        if (period === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
        else if (period === '3months') startDate.setMonth(startDate.getMonth() - 3);
        else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

        const progress = await Progress.find({
            user: req.user.id,
            date: { $gte: startDate }
        }).sort({ date: 1 });

        if (progress.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    weightTrend: [],
                    bmiTrend: [],
                    summary: null
                }
            });
        }

        const weightTrend = progress.map(p => ({
            date: p.date,
            weight: p.weight
        }));

        const bmiTrend = progress.map(p => ({
            date: p.date,
            bmi: p.bmi
        }));

        const firstEntry = progress[0];
        const lastEntry = progress[progress.length - 1];

        const summary = {
            startWeight: firstEntry.weight,
            currentWeight: lastEntry.weight,
            weightChange: Number((lastEntry.weight - firstEntry.weight).toFixed(2)),
            startBMI: firstEntry.bmi,
            currentBMI: lastEntry.bmi,
            bmiChange: Number((lastEntry.bmi - firstEntry.bmi).toFixed(2)),
            entriesCount: progress.length,
            avgEnergyLevel: Number((progress.reduce((sum, p) => sum + (p.energyLevel || 5), 0) / progress.length).toFixed(1)),
            avgSleepHours: Number((progress.reduce((sum, p) => sum + (p.sleepHours || 0), 0) / progress.length).toFixed(1))
        };

        res.status(200).json({
            success: true,
            data: {
                weightTrend,
                bmiTrend,
                summary
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};
