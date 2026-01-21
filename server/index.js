const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

// Demo Mode flag - set to true to use in-memory storage instead of MongoDB
const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.MONGODB_URI || process.env.MONGODB_URI.includes('YOUR_');

if (DEMO_MODE) {
    console.log('\n🎮 DEMO MODE ACTIVE - Using in-memory storage\n');

    // Demo routes
    const demoAuthRoutes = require('./routes/demo/auth');
    const demoWorkoutRoutes = require('./routes/demo/workouts');
    const demoMealRoutes = require('./routes/demo/meals');
    const demoProgressRoutes = require('./routes/demo/progress');
    const demoReminderRoutes = require('./routes/demo/reminders');

    app.use('/api/auth', demoAuthRoutes);
    app.use('/api/workouts', demoWorkoutRoutes);
    app.use('/api/meals', demoMealRoutes);
    app.use('/api/progress', demoProgressRoutes);
    app.use('/api/reminders', demoReminderRoutes);
} else {
    // Connect to MongoDB
    const connectDB = require('./config/db');
    connectDB();

    // Production routes
    const authRoutes = require('./routes/auth');
    const workoutRoutes = require('./routes/workouts');
    const mealRoutes = require('./routes/meals');
    const progressRoutes = require('./routes/progress');
    const reminderRoutes = require('./routes/reminders');

    app.use('/api/auth', authRoutes);
    app.use('/api/workouts', workoutRoutes);
    app.use('/api/meals', mealRoutes);
    app.use('/api/progress', progressRoutes);
    app.use('/api/reminders', reminderRoutes);
}

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Fitness Tracker API is running',
        mode: DEMO_MODE ? 'DEMO' : 'PRODUCTION',
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
  🏋️  Fitness Tracker API Server
  ================================
  ✅ Server running on port ${PORT}
  🎮 Mode: ${DEMO_MODE ? 'DEMO (no database required)' : 'PRODUCTION'}
  📍 Health check: http://localhost:${PORT}/api/health
  🔐 Auth API: http://localhost:${PORT}/api/auth
  💪 Workouts API: http://localhost:${PORT}/api/workouts
  🍽️  Meals API: http://localhost:${PORT}/api/meals
  📊 Progress API: http://localhost:${PORT}/api/progress
  ⏰ Reminders API: http://localhost:${PORT}/api/reminders
  `);
});

module.exports = app;
