const express = require('express');
const {
    getProgressHistory,
    getProgress,
    createProgress,
    updateProgress,
    deleteProgress,
    calculateBMI,
    getAnalytics
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/bmi', calculateBMI);
router.get('/analytics', getAnalytics);

router.route('/')
    .get(getProgressHistory)
    .post(createProgress);

router.route('/:id')
    .get(getProgress)
    .put(updateProgress)
    .delete(deleteProgress);

module.exports = router;
