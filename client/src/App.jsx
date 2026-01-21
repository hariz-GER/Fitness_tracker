import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Meals from './pages/Meals';
import BMICalculator from './pages/BMICalculator';
import Progress from './pages/Progress';
import Reminders from './pages/Reminders';
import Profile from './pages/Profile';

import './index.css';

const App = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorBgContainer: 'transparent',
          colorBgElevated: '#1a1a24',
          colorBorder: 'rgba(255, 255, 255, 0.1)',
          colorText: '#ffffff',
          colorTextSecondary: '#a1a1aa',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          borderRadius: 12,
        },
        components: {
          Button: {
            primaryShadow: 'none',
          },
          Card: {
            colorBgContainer: 'rgba(30, 30, 45, 0.6)',
          },
          Input: {
            colorBgContainer: 'rgba(255, 255, 255, 0.03)',
          },
          Select: {
            colorBgContainer: 'rgba(255, 255, 255, 0.03)',
          },
          Modal: {
            colorBgElevated: '#1a1a24',
          },
        },
      }}
    >
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="workouts" element={<Workouts />} />
              <Route path="meals" element={<Meals />} />
              <Route path="bmi" element={<BMICalculator />} />
              <Route path="progress" element={<Progress />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Profile />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
