const Meal = require('../models/Meal');

// @desc    Get all meals for user
// @route   GET /api/meals
// @access  Private
exports.getMeals = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, date } = req.query;
        const query = { user: req.user.id };

        if (type) query.type = type;
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        const meals = await Meal.find(query)
            .sort({ date: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Meal.countDocuments(query);

        res.status(200).json({
            success: true,
            count: meals.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: meals
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Get meals for a specific date
// @route   GET /api/meals/daily/:date
// @access  Private
exports.getDailyMeals = async (req, res) => {
    try {
        const date = new Date(req.params.date);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const meals = await Meal.find({
            user: req.user.id,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ type: 1 });

        // Calculate daily totals
        const dailyTotals = meals.reduce((acc, meal) => {
            acc.calories += meal.totalNutrition.calories;
            acc.protein += meal.totalNutrition.protein;
            acc.carbs += meal.totalNutrition.carbs;
            acc.fat += meal.totalNutrition.fat;
            acc.fiber += meal.totalNutrition.fiber;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

        res.status(200).json({
            success: true,
            date: req.params.date,
            count: meals.length,
            dailyTotals,
            data: meals
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Get single meal
// @route   GET /api/meals/:id
// @access  Private
exports.getMeal = async (req, res) => {
    try {
        const meal = await Meal.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!meal) {
            return res.status(404).json({
                success: false,
                message: 'Meal not found'
            });
        }

        res.status(200).json({
            success: true,
            data: meal
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Create meal
// @route   POST /api/meals
// @access  Private
exports.createMeal = async (req, res) => {
    try {
        req.body.user = req.user.id;
        const meal = await Meal.create(req.body);

        res.status(201).json({
            success: true,
            data: meal
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Update meal
// @route   PUT /api/meals/:id
// @access  Private
exports.updateMeal = async (req, res) => {
    try {
        let meal = await Meal.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!meal) {
            return res.status(404).json({
                success: false,
                message: 'Meal not found'
            });
        }

        meal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: meal
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Delete meal
// @route   DELETE /api/meals/:id
// @access  Private
exports.deleteMeal = async (req, res) => {
    try {
        const meal = await Meal.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!meal) {
            return res.status(404).json({
                success: false,
                message: 'Meal not found'
            });
        }

        await meal.deleteOne();

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

// @desc    Get nutrition stats
// @route   GET /api/meals/stats
// @access  Private
exports.getNutritionStats = async (req, res) => {
    try {
        const { period = 'week' } = req.query;

        let startDate = new Date();
        if (period === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
        else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

        const stats = await Meal.aggregate([
            {
                $match: {
                    user: req.user._id,
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    totalCalories: { $sum: '$totalNutrition.calories' },
                    totalProtein: { $sum: '$totalNutrition.protein' },
                    totalCarbs: { $sum: '$totalNutrition.carbs' },
                    totalFat: { $sum: '$totalNutrition.fat' },
                    mealCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const averages = await Meal.aggregate([
            {
                $match: {
                    user: req.user._id,
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    avgCalories: { $avg: '$totalNutrition.calories' },
                    avgProtein: { $avg: '$totalNutrition.protein' },
                    avgCarbs: { $avg: '$totalNutrition.carbs' },
                    avgFat: { $avg: '$totalNutrition.fat' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                daily: stats,
                averages: averages[0] || { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0 }
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

// @desc    Get favorite meals
// @route   GET /api/meals/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
    try {
        const meals = await Meal.find({
            user: req.user.id,
            isFavorite: true
        }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: meals.length,
            data: meals
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};
