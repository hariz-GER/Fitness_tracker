// In-memory storage for demo mode
const store = {
    users: [],
    workouts: [],
    meals: [],
    progress: [],
    reminders: [],

    // Demo data generators
    generateId: () => Math.random().toString(36).substring(2) + Date.now().toString(36),
};

// Pre-populate with sample data
store.users.push({
    _id: store.generateId(),
    name: 'Demo User',
    email: 'demo@fittracker.com',
    password: '$2a$10$demo', // not actually hashed in demo
    profile: {
        height: 175,
        weight: 70,
        age: 28,
        gender: 'male',
        activityLevel: 'moderate',
        goalWeight: 68,
        fitnessGoal: 'maintain'
    },
    settings: {
        notifications: true,
        darkMode: true,
        units: 'metric'
    },
    createdAt: new Date()
});

module.exports = store;
