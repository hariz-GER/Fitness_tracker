const Workout = require('../models/Workout');

// @desc    Get all workouts for user
// @route   GET /api/workouts
// @access  Private
exports.getWorkouts = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, startDate, endDate } = req.query;
        const query = { user: req.user.id };

        if (type) query.type = type;
        if (startDate || endDate) {
            query.completedAt = {};
            if (startDate) query.completedAt.$gte = new Date(startDate);
            if (endDate) query.completedAt.$lte = new Date(endDate);
        }

        const workouts = await Workout.find(query)
            .sort({ completedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Workout.countDocuments(query);

        res.status(200).json({
            success: true,
            count: workouts.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: workouts
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Get single workout
// @route   GET /api/workouts/:id
// @access  Private
exports.getWorkout = async (req, res) => {
    try {
        const workout = await Workout.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }

        res.status(200).json({
            success: true,
            data: workout
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Create workout
// @route   POST /api/workouts
// @access  Private
exports.createWorkout = async (req, res) => {
    try {
        req.body.user = req.user.id;
        const workout = await Workout.create(req.body);

        res.status(201).json({
            success: true,
            data: workout
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Update workout
// @route   PUT /api/workouts/:id
// @access  Private
exports.updateWorkout = async (req, res) => {
    try {
        let workout = await Workout.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }

        workout = await Workout.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: workout
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Delete workout
// @route   DELETE /api/workouts/:id
// @access  Private
exports.deleteWorkout = async (req, res) => {
    try {
        const workout = await Workout.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!workout) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found'
            });
        }

        await workout.deleteOne();

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

// @desc    Get workout stats
// @route   GET /api/workouts/stats
// @access  Private
exports.getWorkoutStats = async (req, res) => {
    try {
        const { period = 'week' } = req.query;

        let startDate = new Date();
        if (period === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
        else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

        const stats = await Workout.aggregate([
            {
                $match: {
                    user: req.user._id,
                    completedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalWorkouts: { $sum: 1 },
                    totalDuration: { $sum: '$duration' },
                    totalCalories: { $sum: '$totalCaloriesBurned' },
                    avgDuration: { $avg: '$duration' }
                }
            }
        ]);

        const workoutsByType = await Workout.aggregate([
            {
                $match: {
                    user: req.user._id,
                    completedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: stats[0] || { totalWorkouts: 0, totalDuration: 0, totalCalories: 0, avgDuration: 0 },
                byType: workoutsByType
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
