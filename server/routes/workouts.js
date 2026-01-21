const express = require('express');
const {
    getWorkouts,
    getWorkout,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    getWorkoutStats
} = require('../controllers/workoutController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/stats', getWorkoutStats);
router.route('/')
    .get(getWorkouts)
    .post(createWorkout);

router.route('/:id')
    .get(getWorkout)
    .put(updateWorkout)
    .delete(deleteWorkout);

module.exports = router;
