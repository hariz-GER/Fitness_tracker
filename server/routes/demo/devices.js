const express = require('express');
const router = express.Router();
const { users } = require('./store');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret-key');
        const user = users.find(u => u._id === decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// In-memory connected devices
let connectedDevices = {};

// Apply auth middleware to all routes
router.use(verifyToken);

/**
 * @route   GET /api/devices/connect
 * @desc    Get a widget URL to connect a new wearable device
 */
router.get('/connect', async (req, res) => {
    // In demo mode, return a mock widget URL
    res.status(200).json({
        success: true,
        widgetUrl: `http://localhost:5173/connect-device?demo=true&user=${req.user._id}`,
        sessionId: `demo-session-${Date.now()}`,
        message: 'Demo mode: Click to simulate device connection',
    });
});

/**
 * @route   GET /api/devices
 * @desc    Get user's connected devices
 */
router.get('/', async (req, res) => {
    const userDevices = connectedDevices[req.user._id];

    if (!userDevices) {
        return res.status(200).json({
            success: true,
            connected: false,
            devices: [],
            message: 'No devices connected. Use /connect to link a device.',
        });
    }

    res.status(200).json({
        success: true,
        connected: true,
        devices: [userDevices],
    });
});

/**
 * @route   POST /api/devices/demo-connect
 * @desc    Simulate connecting a device in demo mode
 */
router.post('/demo-connect', async (req, res) => {
    const { provider = 'APPLE' } = req.body;

    connectedDevices[req.user._id] = {
        provider: provider,
        userId: `terra-${req.user._id}`,
        connectedAt: new Date(),
    };

    res.status(200).json({
        success: true,
        message: `Demo: ${provider} device connected successfully!`,
        device: connectedDevices[req.user._id],
    });
});

/**
 * @route   POST /api/devices/sync
 * @desc    Sync workout data from connected device (demo data)
 */
router.post('/sync', async (req, res) => {
    const userDevices = connectedDevices[req.user._id];

    if (!userDevices) {
        return res.status(400).json({
            success: false,
            message: 'No device connected. Please connect a device first.',
        });
    }

    // Generate some demo workouts
    const demoWorkouts = [
        {
            _id: `sync-${Date.now()}-1`,
            title: 'Morning Run',
            type: 'cardio',
            duration: 35,
            totalCaloriesBurned: 320,
            intensity: 'moderate',
            source: 'wearable',
            sourceDevice: userDevices.provider,
            completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            heartRateAvg: 145,
            heartRateMax: 172,
            distance: 4500,
            steps: 5200,
        },
        {
            _id: `sync-${Date.now()}-2`,
            title: 'Afternoon Walk',
            type: 'cardio',
            duration: 25,
            totalCaloriesBurned: 150,
            intensity: 'low',
            source: 'wearable',
            sourceDevice: userDevices.provider,
            completedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
            heartRateAvg: 98,
            heartRateMax: 115,
            distance: 2200,
            steps: 2800,
        },
    ];

    res.status(200).json({
        success: true,
        synced: demoWorkouts.length,
        total: demoWorkouts.length,
        workouts: demoWorkouts,
        message: `Demo: Synced ${demoWorkouts.length} workouts from your ${userDevices.provider} device`,
    });
});

/**
 * @route   GET /api/devices/daily
 * @desc    Get daily summary from connected device (demo data)
 */
router.get('/daily', async (req, res) => {
    const userDevices = connectedDevices[req.user._id];

    if (!userDevices) {
        return res.status(200).json({
            success: true,
            data: null,
        });
    }

    // Generate demo daily stats
    const dailyData = {
        steps: 8547,
        distance: 6800,
        caloriesBurned: 420,
        activeMinutes: 45,
        avgHeartRate: 72,
        restingHeartRate: 58,
        stressLevel: 32,
    };

    res.status(200).json({
        success: true,
        date: new Date().toISOString().split('T')[0],
        data: dailyData,
    });
});

/**
 * @route   GET /api/devices/sleep
 * @desc    Get sleep data from connected device (demo data)
 */
router.get('/sleep', async (req, res) => {
    const userDevices = connectedDevices[req.user._id];

    if (!userDevices) {
        return res.status(200).json({
            success: true,
            sleepData: [],
        });
    }

    // Generate demo sleep data
    const sleepData = [
        {
            date: new Date().toISOString(),
            totalSleep: 7.5,
            deepSleep: 1.8,
            lightSleep: 4.2,
            remSleep: 1.5,
            awakeTime: 15,
            sleepEfficiency: 92,
            sleepScore: 85,
        },
        {
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            totalSleep: 6.8,
            deepSleep: 1.5,
            lightSleep: 3.8,
            remSleep: 1.5,
            awakeTime: 22,
            sleepEfficiency: 88,
            sleepScore: 78,
        },
    ];

    res.status(200).json({
        success: true,
        sleepData: sleepData,
    });
});

/**
 * @route   DELETE /api/devices/disconnect
 * @desc    Disconnect a wearable device
 */
router.delete('/disconnect', async (req, res) => {
    const userDevices = connectedDevices[req.user._id];

    if (!userDevices) {
        return res.status(400).json({
            success: false,
            message: 'No device connected',
        });
    }

    delete connectedDevices[req.user._id];

    res.status(200).json({
        success: true,
        message: 'Device disconnected successfully',
    });
});

module.exports = router;
