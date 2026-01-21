const express = require('express');
const {
    getReminders,
    getReminder,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    getTodayReminders
} = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/today', getTodayReminders);
router.patch('/:id/toggle', toggleReminder);

router.route('/')
    .get(getReminders)
    .post(createReminder);

router.route('/:id')
    .get(getReminder)
    .put(updateReminder)
    .delete(deleteReminder);

module.exports = router;
