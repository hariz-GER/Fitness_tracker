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

// Get nutrition stats
router.get('/stats', (req, res) => {
    try {
        const userMeals = store.meals.filter(m => m.user === req.user._id);

        res.status(200).json({
            success: true,
            data: {
                daily: [],
                averages: {
                    avgCalories: userMeals.reduce((sum, m) => sum + (m.totalNutrition?.calories || 0), 0) / Math.max(userMeals.length, 1),
                    avgProtein: userMeals.reduce((sum, m) => sum + (m.totalNutrition?.protein || 0), 0) / Math.max(userMeals.length, 1),
                    avgCarbs: userMeals.reduce((sum, m) => sum + (m.totalNutrition?.carbs || 0), 0) / Math.max(userMeals.length, 1),
                    avgFat: userMeals.reduce((sum, m) => sum + (m.totalNutrition?.fat || 0), 0) / Math.max(userMeals.length, 1)
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get favorites
router.get('/favorites', (req, res) => {
    try {
        const favorites = store.meals.filter(m => m.user === req.user._id && m.isFavorite);
        res.status(200).json({ success: true, count: favorites.length, data: favorites });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get daily meals
router.get('/daily/:date', (req, res) => {
    try {
        const dateStr = req.params.date;
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);

        const meals = store.meals.filter(m => {
            const mealDate = new Date(m.date);
            return m.user === req.user._id && mealDate >= startOfDay && mealDate <= endOfDay;
        });

        const dailyTotals = meals.reduce((acc, m) => {
            acc.calories += m.totalNutrition?.calories || 0;
            acc.protein += m.totalNutrition?.protein || 0;
            acc.carbs += m.totalNutrition?.carbs || 0;
            acc.fat += m.totalNutrition?.fat || 0;
            acc.fiber += m.totalNutrition?.fiber || 0;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

        res.status(200).json({
            success: true,
            date: dateStr,
            count: meals.length,
            dailyTotals,
            data: meals
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get all meals
router.get('/', (req, res) => {
    try {
        const userMeals = store.meals
            .filter(m => m.user === req.user._id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            success: true,
            count: userMeals.length,
            total: userMeals.length,
            data: userMeals
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get single meal
router.get('/:id', (req, res) => {
    try {
        const meal = store.meals.find(m => m._id === req.params.id && m.user === req.user._id);
        if (!meal) {
            return res.status(404).json({ success: false, message: 'Meal not found' });
        }
        res.status(200).json({ success: true, data: meal });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Create meal
router.post('/', (req, res) => {
    try {
        const foods = req.body.foods || [];
        const totalNutrition = foods.reduce((acc, food) => {
            acc.calories += food.calories || 0;
            acc.protein += food.protein || 0;
            acc.carbs += food.carbs || 0;
            acc.fat += food.fat || 0;
            acc.fiber += food.fiber || 0;
            acc.sugar += food.sugar || 0;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 });

        const meal = {
            _id: store.generateId(),
            user: req.user._id,
            ...req.body,
            totalNutrition,
            date: req.body.date || new Date(),
            createdAt: new Date()
        };

        store.meals.push(meal);
        res.status(201).json({ success: true, data: meal });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Update meal
router.put('/:id', (req, res) => {
    try {
        const index = store.meals.findIndex(m => m._id === req.params.id && m.user === req.user._id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Meal not found' });
        }

        store.meals[index] = { ...store.meals[index], ...req.body, updatedAt: new Date() };
        res.status(200).json({ success: true, data: store.meals[index] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Delete meal
router.delete('/:id', (req, res) => {
    try {
        const index = store.meals.findIndex(m => m._id === req.params.id && m.user === req.user._id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Meal not found' });
        }

        store.meals.splice(index, 1);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;
