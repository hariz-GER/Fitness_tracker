# 💪 FitTracker - Fitness & Health Tracking App

A comprehensive, full-stack MERN application for tracking your fitness journey. Features workout logging, meal planning, BMI calculation, progress analytics, and smart reminders.

![FitTracker](https://img.shields.io/badge/MERN-Stack-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 🏋️ Workout Tracking
- Log workouts with exercise details
- Track duration, calories, and intensity
- View workout history and statistics
- Categorize by workout type (Cardio, Strength, HIIT, Yoga, etc.)

### 🍽️ Meal Planner
- Plan and track daily meals
- Monitor nutritional intake (calories, protein, carbs, fat)
- Organize meals by type (Breakfast, Lunch, Dinner, Snacks)
- Save favorite meals for quick logging

### 📊 BMI Calculator
- Calculate Body Mass Index instantly
- Visual BMI scale with health indicators
- Health recommendations based on BMI category
- Save measurements to profile

### 📈 Progress Analytics
- Track weight and BMI trends over time
- Visual charts and graphs
- Wellness metrics (energy, sleep)
- Body measurements tracking

### ⏰ Smart Reminders
- Set workout and meal reminders
- Recurring schedules (daily, weekly)
- Multiple reminder types
- Toggle reminders on/off

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router v6** - Navigation
- **Ant Design** - UI components
- **Chart.js** - Data visualization
- **Axios** - API requests
- **Day.js** - Date handling

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📁 Project Structure

```
Fitness_tracking_APP/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── App.jsx         # Main app component
│   │   └── index.css       # Global styles
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── index.js            # Server entry point
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Fitness_tracking_APP
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file in server directory
   cp .env.example .env
   
   # Update with your values:
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/fitness_tracker
   JWT_SECRET=your_super_secure_secret_key
   JWT_EXPIRE=30d
   ```

4. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   Server runs on: http://localhost:5000

3. **Start the frontend (new terminal)**
   ```bash
   cd client
   npm run dev
   ```
   Frontend runs on: http://localhost:5173

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workouts` | Get all workouts |
| POST | `/api/workouts` | Create workout |
| GET | `/api/workouts/:id` | Get single workout |
| PUT | `/api/workouts/:id` | Update workout |
| DELETE | `/api/workouts/:id` | Delete workout |
| GET | `/api/workouts/stats` | Get workout statistics |

### Meals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meals` | Get all meals |
| POST | `/api/meals` | Create meal |
| GET | `/api/meals/daily/:date` | Get daily meals |
| GET | `/api/meals/stats` | Get nutrition stats |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress` | Get progress history |
| POST | `/api/progress` | Create progress entry |
| POST | `/api/progress/bmi` | Calculate BMI |
| GET | `/api/progress/analytics` | Get analytics data |

### Reminders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reminders` | Get all reminders |
| POST | `/api/reminders` | Create reminder |
| PATCH | `/api/reminders/:id/toggle` | Toggle reminder |
| GET | `/api/reminders/today` | Get today's reminders |

## 🎨 Design Features

- **Dark Theme** - Easy on the eyes
- **Glassmorphism** - Modern UI effects
- **Responsive** - Works on all devices
- **Animations** - Smooth transitions
- **Charts** - Beautiful data visualization

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ for fitness enthusiasts
