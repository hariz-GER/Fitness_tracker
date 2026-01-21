const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

// Route files
const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const mealRoutes = require('./routes/meals');
const progressRoutes = require('./routes/progress');
const reminderRoutes = require('./routes/reminders');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/reminders', reminderRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Fitness Tracker API is running',
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
  📍 Health check: http://localhost:${PORT}/api/health
  🔐 Auth API: http://localhost:${PORT}/api/auth
  💪 Workouts API: http://localhost:${PORT}/api/workouts
  🍽️  Meals API: http://localhost:${PORT}/api/meals
  📊 Progress API: http://localhost:${PORT}/api/progress
  ⏰ Reminders API: http://localhost:${PORT}/api/reminders
  `);
});

module.exports = app;
