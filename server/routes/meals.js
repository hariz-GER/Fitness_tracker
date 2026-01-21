const express = require('express');
const {
    getMeals,
    getMeal,
    createMeal,
    updateMeal,
    deleteMeal,
    getDailyMeals,
    getNutritionStats,
    getFavorites
} = require('../controllers/mealController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/stats', getNutritionStats);
router.get('/favorites', getFavorites);
router.get('/daily/:date', getDailyMeals);

router.route('/')
    .get(getMeals)
    .post(createMeal);

router.route('/:id')
    .get(getMeal)
    .put(updateMeal)
    .delete(deleteMeal);

module.exports = router;
