import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Calendar, Badge, Spin, Empty } from 'antd';
import {
    FireOutlined,
    ThunderboltOutlined,
    TrophyOutlined,
    HeartOutlined,
    RiseOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { workoutAPI, mealAPI, progressAPI, reminderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import './Dashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        workouts: { totalWorkouts: 0, totalCalories: 0, totalDuration: 0 },
        nutrition: { avgCalories: 0, avgProtein: 0 },
        progress: null,
        reminders: [],
    });
    const [chartData, setChartData] = useState({
        weight: [],
        calories: [],
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const [workoutStats, nutritionStats, progressData, todayReminders] = await Promise.all([
                workoutAPI.getStats({ period: 'week' }).catch(() => ({ data: { data: { summary: {} } } })),
                mealAPI.getStats({ period: 'week' }).catch(() => ({ data: { data: { averages: {} } } })),
                progressAPI.getAnalytics({ period: 'month' }).catch(() => ({ data: { data: { weightTrend: [], summary: null } } })),
                reminderAPI.getToday().catch(() => ({ data: { data: [] } })),
            ]);

            setStats({
                workouts: workoutStats.data?.data?.summary || { totalWorkouts: 0, totalCalories: 0, totalDuration: 0 },
                nutrition: nutritionStats.data?.data?.averages || { avgCalories: 0, avgProtein: 0 },
                progress: progressData.data?.data?.summary || null,
                reminders: todayReminders.data?.data || [],
            });

            setChartData({
                weight: progressData.data?.data?.weightTrend || [],
                calories: [],
            });
        } catch (error) {
            console.error('Dashboard data fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const weightChartData = {
        labels: chartData.weight.map(item => dayjs(item.date).format('MMM D')),
        datasets: [
            {
                label: 'Weight (kg)',
                data: chartData.weight.map(item => item.weight),
                fill: true,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
            },
        ],
    };

    const workoutTypesData = {
        labels: ['Cardio', 'Strength', 'HIIT', 'Yoga', 'Other'],
        datasets: [
            {
                data: [35, 30, 15, 12, 8],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(107, 114, 128, 0.8)',
                ],
                borderWidth: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(15, 15, 22, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                titleColor: '#fff',
                bodyColor: '#a1a1aa',
                padding: 12,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#71717a',
                },
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#71717a',
                },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#a1a1aa',
                    padding: 16,
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
            },
        },
    };

    const calculateBMICategory = () => {
        if (!user?.profile?.height || !user?.profile?.weight) return null;
        const height = user.profile.height / 100;
        const bmi = user.profile.weight / (height * height);

        if (bmi < 18.5) return { value: bmi.toFixed(1), category: 'Underweight', color: '#eab308' };
        if (bmi < 25) return { value: bmi.toFixed(1), category: 'Normal', color: '#22c55e' };
        if (bmi < 30) return { value: bmi.toFixed(1), category: 'Overweight', color: '#f97316' };
        return { value: bmi.toFixed(1), category: 'Obese', color: '#ef4444' };
    };

    const bmiData = calculateBMICategory();

    if (loading) {
        return (
            <div className="dashboard-loading">
                <Spin size="large" />
                <p>Loading your fitness data...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Welcome Section */}
            <div className="dashboard-header">
                <div className="welcome-text">
                    <h1>Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Athlete'}</span>! 👋</h1>
                    <p>Here's your fitness overview for today</p>
                </div>
                <div className="date-display">
                    <span className="date">{dayjs().format('dddd, MMMM D')}</span>
                </div>
            </div>

            {/* Stats Cards */}
            <Row gutter={[20, 20]} className="stats-row">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card glass-card">
                        <div className="stat-icon-wrapper primary">
                            <FireOutlined />
                        </div>
                        <Statistic
                            title="Workouts This Week"
                            value={stats.workouts.totalWorkouts || 0}
                            suffix="sessions"
                        />
                        <div className="stat-trend positive">
                            <RiseOutlined /> +12% from last week
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card glass-card">
                        <div className="stat-icon-wrapper orange">
                            <ThunderboltOutlined />
                        </div>
                        <Statistic
                            title="Calories Burned"
                            value={stats.workouts.totalCalories || 0}
                            suffix="kcal"
                        />
                        <div className="stat-trend positive">
                            <RiseOutlined /> +8% from last week
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card glass-card">
                        <div className="stat-icon-wrapper green">
                            <ClockCircleOutlined />
                        </div>
                        <Statistic
                            title="Active Minutes"
                            value={stats.workouts.totalDuration || 0}
                            suffix="min"
                        />
                        <div className="stat-trend positive">
                            <RiseOutlined /> +15% from last week
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card glass-card">
                        <div className="stat-icon-wrapper purple">
                            <TrophyOutlined />
                        </div>
                        <Statistic
                            title="Goals Achieved"
                            value={3}
                            suffix="/ 5"
                        />
                        <Progress
                            percent={60}
                            showInfo={false}
                            strokeColor={{
                                '0%': '#8b5cf6',
                                '100%': '#3b82f6',
                            }}
                            trailColor="rgba(255,255,255,0.1)"
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts Section */}
            <Row gutter={[20, 20]} className="charts-row">
                <Col xs={24} lg={16}>
                    <Card
                        className="chart-card glass-card"
                        title={
                            <div className="card-header">
                                <h3>Weight Progress</h3>
                                <span className="card-subtitle">Last 30 days</span>
                            </div>
                        }
                    >
                        <div className="chart-container">
                            {chartData.weight.length > 0 ? (
                                <Line data={weightChartData} options={chartOptions} />
                            ) : (
                                <Empty
                                    description="No weight data yet. Log your first progress entry!"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            )}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card
                        className="chart-card glass-card"
                        title={
                            <div className="card-header">
                                <h3>Workout Types</h3>
                                <span className="card-subtitle">This month</span>
                            </div>
                        }
                    >
                        <div className="doughnut-container">
                            <Doughnut data={workoutTypesData} options={doughnutOptions} />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* BMI & Reminders Section */}
            <Row gutter={[20, 20]} className="bottom-row">
                <Col xs={24} lg={8}>
                    <Card className="bmi-card glass-card">
                        <div className="bmi-header">
                            <HeartOutlined className="bmi-icon" />
                            <h3>BMI Status</h3>
                        </div>
                        {bmiData ? (
                            <div className="bmi-content">
                                <div className="bmi-value" style={{ color: bmiData.color }}>
                                    {bmiData.value}
                                </div>
                                <div className="bmi-category">
                                    <Badge
                                        color={bmiData.color}
                                        text={bmiData.category}
                                    />
                                </div>
                                <div className="bmi-range">
                                    <div className="range-bar">
                                        <div
                                            className="range-indicator"
                                            style={{
                                                left: `${Math.min(Math.max((bmiData.value - 15) / 25 * 100, 0), 100)}%`,
                                                backgroundColor: bmiData.color
                                            }}
                                        />
                                    </div>
                                    <div className="range-labels">
                                        <span>15</span>
                                        <span>25</span>
                                        <span>40</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Empty
                                description="Complete your profile to see BMI"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card
                        className="reminders-card glass-card"
                        title={
                            <div className="card-header">
                                <h3>Today's Reminders</h3>
                                <Badge count={stats.reminders.length} />
                            </div>
                        }
                    >
                        {stats.reminders.length > 0 ? (
                            <div className="reminders-list">
                                {stats.reminders.slice(0, 4).map((reminder, index) => (
                                    <div key={reminder._id || index} className="reminder-item">
                                        <span className="reminder-icon">{reminder.icon || '🔔'}</span>
                                        <div className="reminder-content">
                                            <span className="reminder-title">{reminder.title}</span>
                                            <span className="reminder-time">{reminder.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty
                                description="No reminders for today"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card
                        className="nutrition-card glass-card"
                        title={
                            <div className="card-header">
                                <h3>Daily Nutrition</h3>
                                <span className="card-subtitle">Average</span>
                            </div>
                        }
                    >
                        <div className="nutrition-stats">
                            <div className="nutrition-item">
                                <div className="nutrition-label">Calories</div>
                                <div className="nutrition-value">{Math.round(stats.nutrition.avgCalories || 0)}</div>
                                <Progress
                                    percent={Math.min((stats.nutrition.avgCalories || 0) / 2000 * 100, 100)}
                                    showInfo={false}
                                    strokeColor="#3b82f6"
                                    trailColor="rgba(255,255,255,0.1)"
                                />
                            </div>
                            <div className="nutrition-item">
                                <div className="nutrition-label">Protein</div>
                                <div className="nutrition-value">{Math.round(stats.nutrition.avgProtein || 0)}g</div>
                                <Progress
                                    percent={Math.min((stats.nutrition.avgProtein || 0) / 150 * 100, 100)}
                                    showInfo={false}
                                    strokeColor="#22c55e"
                                    trailColor="rgba(255,255,255,0.1)"
                                />
                            </div>
                            <div className="nutrition-item">
                                <div className="nutrition-label">Carbs</div>
                                <div className="nutrition-value">{Math.round(stats.nutrition.avgCarbs || 0)}g</div>
                                <Progress
                                    percent={Math.min((stats.nutrition.avgCarbs || 0) / 250 * 100, 100)}
                                    showInfo={false}
                                    strokeColor="#f97316"
                                    trailColor="rgba(255,255,255,0.1)"
                                />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
