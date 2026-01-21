const express = require('express');
const router = express.Router();
const terraService = require('../services/terraService');
const Workout = require('../models/Workout');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/devices/connect
 * @desc    Get a widget URL to connect a new wearable device
 * @access  Private
 */
router.get('/connect', async (req, res) => {
    try {
        const result = await terraService.generateWidgetSession(req.user._id.toString());

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.error,
            });
        }

        res.status(200).json({
            success: true,
            widgetUrl: result.widgetUrl,
            sessionId: result.sessionId,
            message: 'Open the widget URL to connect your device',
        });
    } catch (error) {
        console.error('Connect Device Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate connection widget',
        });
    }
});

/**
 * @route   GET /api/devices
 * @desc    Get user's connected devices
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.terraUserId) {
            return res.status(200).json({
                success: true,
                connected: false,
                devices: [],
                message: 'No devices connected. Use /connect to link a device.',
            });
        }

        const result = await terraService.getUserDevices(user.terraUserId);

        res.status(200).json({
            success: true,
            connected: true,
            devices: result.data || [],
        });
    } catch (error) {
        console.error('Get Devices Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get connected devices',
        });
    }
});

/**
 * @route   POST /api/devices/sync
 * @desc    Sync workout data from connected device
 * @access  Private
 */
router.post('/sync', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.terraUserId) {
            return res.status(400).json({
                success: false,
                message: 'No device connected. Please connect a device first.',
            });
        }

        const { startDate, endDate } = req.body;

        // Default to last 7 days if no dates provided
        const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        // Get activity data from Terra
        const activityResult = await terraService.getActivityData(user.terraUserId, start, end);

        if (!activityResult.success) {
            return res.status(400).json({
                success: false,
                message: activityResult.error,
            });
        }

        // Transform and save workouts
        const workoutsToSync = [];

        for (const activity of activityResult.activities) {
            const workoutData = terraService.transformToWorkout(activity);

            // Check if workout already exists (to avoid duplicates)
            const existingWorkout = await Workout.findOne({
                user: req.user._id,
                completedAt: workoutData.completedAt,
                source: 'wearable',
            });

            if (!existingWorkout) {
                const workout = await Workout.create({
                    ...workoutData,
                    user: req.user._id,
                });
                workoutsToSync.push(workout);
            }
        }

        res.status(200).json({
            success: true,
            synced: workoutsToSync.length,
            total: activityResult.activities.length,
            workouts: workoutsToSync,
            message: `Synced ${workoutsToSync.length} new workouts from your device`,
        });
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync workout data',
        });
    }
});

/**
 * @route   GET /api/devices/daily
 * @desc    Get daily summary from connected device (steps, calories, etc.)
 * @access  Private
 */
router.get('/daily', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.terraUserId) {
            return res.status(400).json({
                success: false,
                message: 'No device connected',
            });
        }

        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        const result = await terraService.getDailyData(user.terraUserId, targetDate, targetDate);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.error,
            });
        }

        const dailyData = result.dailyData[0];

        res.status(200).json({
            success: true,
            date: targetDate,
            data: dailyData ? {
                steps: dailyData.distance_data?.steps || 0,
                distance: dailyData.distance_data?.distance_meters || 0,
                caloriesBurned: dailyData.calories_data?.total_burned_calories || 0,
                activeMinutes: Math.round((dailyData.active_durations_data?.activity_seconds || 0) / 60),
                avgHeartRate: dailyData.heart_rate_data?.summary?.avg_hr_bpm,
                restingHeartRate: dailyData.heart_rate_data?.summary?.resting_hr_bpm,
                stressLevel: dailyData.stress_data?.avg_stress_level,
            } : null,
        });
    } catch (error) {
        console.error('Daily Data Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get daily data',
        });
    }
});

/**
 * @route   GET /api/devices/sleep
 * @desc    Get sleep data from connected device
 * @access  Private
 */
router.get('/sleep', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.terraUserId) {
            return res.status(400).json({
                success: false,
                message: 'No device connected',
            });
        }

        const { startDate, endDate } = req.query;
        const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        const result = await terraService.getSleepData(user.terraUserId, start, end);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.error,
            });
        }

        const sleepSummaries = result.sleepData.map(sleep => ({
            date: sleep.metadata?.start_time,
            totalSleep: Math.round((sleep.sleep_durations_data?.total_sleep_time_seconds || 0) / 3600 * 10) / 10,
            deepSleep: Math.round((sleep.sleep_durations_data?.deep_sleep_seconds || 0) / 3600 * 10) / 10,
            lightSleep: Math.round((sleep.sleep_durations_data?.light_sleep_seconds || 0) / 3600 * 10) / 10,
            remSleep: Math.round((sleep.sleep_durations_data?.rem_sleep_seconds || 0) / 3600 * 10) / 10,
            awakeTime: Math.round((sleep.sleep_durations_data?.awake_seconds || 0) / 60),
            sleepEfficiency: sleep.sleep_durations_data?.sleep_efficiency,
            sleepScore: sleep.metadata?.sleep_score,
        }));

        res.status(200).json({
            success: true,
            sleepData: sleepSummaries,
        });
    } catch (error) {
        console.error('Sleep Data Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sleep data',
        });
    }
});

/**
 * @route   DELETE /api/devices/disconnect
 * @desc    Disconnect a wearable device
 * @access  Private
 */
router.delete('/disconnect', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.terraUserId) {
            return res.status(400).json({
                success: false,
                message: 'No device connected',
            });
        }

        await terraService.disconnectUser(user.terraUserId);

        // Clear Terra user ID from our database
        user.terraUserId = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Device disconnected successfully',
        });
    } catch (error) {
        console.error('Disconnect Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect device',
        });
    }
});

/**
 * @route   POST /api/devices/webhook
 * @desc    Webhook endpoint for Terra to push data updates
 * @access  Public (verified by Terra signature)
 */
router.post('/webhook', async (req, res) => {
    try {
        const { type, user: terraUser, data } = req.body;

        // Handle different webhook types
        switch (type) {
            case 'auth':
                // User connected a new device
                if (terraUser?.reference_id) {
                    await User.findByIdAndUpdate(terraUser.reference_id, {
                        terraUserId: terraUser.user_id,
                    });
                }
                break;

            case 'activity':
                // New activity data received
                if (terraUser?.reference_id && data) {
                    const workoutData = terraService.transformToWorkout(data);
                    await Workout.create({
                        ...workoutData,
                        user: terraUser.reference_id,
                    });
                }
                break;

            case 'deauth':
                // User disconnected device
                if (terraUser?.reference_id) {
                    await User.findByIdAndUpdate(terraUser.reference_id, {
                        terraUserId: null,
                    });
                }
                break;
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(200).json({ success: true }); // Always return 200 to Terra
    }
});

module.exports = router;
