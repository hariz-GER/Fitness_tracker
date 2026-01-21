import { useState, useEffect } from 'react';
import {
    Card, Button, Modal, Form, Input, Select, InputNumber,
    Row, Col, Tag, Empty, Spin, Popconfirm, message, Tabs, Timeline
} from 'antd';
import {
    PlusOutlined, DeleteOutlined, EditOutlined, FireOutlined,
    ClockCircleOutlined, ThunderboltOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { workoutAPI } from '../services/api';
import dayjs from 'dayjs';
import './Workouts.css';

const { Option } = Select;
const { TextArea } = Input;

const workoutTypes = [
    { value: 'cardio', label: 'Cardio', icon: '🏃', color: '#3b82f6' },
    { value: 'strength', label: 'Strength', icon: '💪', color: '#8b5cf6' },
    { value: 'hiit', label: 'HIIT', icon: '⚡', color: '#f97316' },
    { value: 'yoga', label: 'Yoga', icon: '🧘', color: '#22c55e' },
    { value: 'sports', label: 'Sports', icon: '⚽', color: '#06b6d4' },
    { value: 'mixed', label: 'Mixed', icon: '🎯', color: '#ec4899' },
];

const exerciseCategories = ['cardio', 'strength', 'flexibility', 'balance', 'sports'];

const intensityLevels = [
    { value: 'low', label: 'Low', color: '#22c55e' },
    { value: 'moderate', label: 'Moderate', color: '#eab308' },
    { value: 'high', label: 'High', color: '#f97316' },
    { value: 'extreme', label: 'Extreme', color: '#ef4444' },
];

const Workouts = () => {
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchWorkouts();
    }, []);

    const fetchWorkouts = async () => {
        try {
            setLoading(true);
            const response = await workoutAPI.getAll({ limit: 50 });
            setWorkouts(response.data.data || []);
        } catch (error) {
            message.error('Failed to fetch workouts');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);

            const workoutData = {
                ...values,
                exercises: values.exercises || [],
                completedAt: new Date(),
            };

            if (editingWorkout) {
                await workoutAPI.update(editingWorkout._id, workoutData);
                message.success('Workout updated successfully!');
            } else {
                await workoutAPI.create(workoutData);
                message.success('Workout logged successfully! 💪');
            }

            setModalVisible(false);
            form.resetFields();
            setEditingWorkout(null);
            fetchWorkouts();
        } catch (error) {
            message.error('Failed to save workout');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (workout) => {
        setEditingWorkout(workout);
        form.setFieldsValue({
            title: workout.title,
            type: workout.type,
            duration: workout.duration,
            intensity: workout.intensity,
            totalCaloriesBurned: workout.totalCaloriesBurned,
            notes: workout.notes,
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await workoutAPI.delete(id);
            message.success('Workout deleted');
            fetchWorkouts();
        } catch (error) {
            message.error('Failed to delete workout');
        }
    };

    const openNewWorkoutModal = () => {
        setEditingWorkout(null);
        form.resetFields();
        setModalVisible(true);
    };

    const getWorkoutTypeInfo = (type) => {
        return workoutTypes.find(t => t.value === type) || workoutTypes[5];
    };

    const getIntensityInfo = (intensity) => {
        return intensityLevels.find(i => i.value === intensity) || intensityLevels[1];
    };

    return (
        <div className="workouts-page">
            <div className="page-header">
                <div>
                    <h1>Workout Tracker</h1>
                    <p>Log and track your exercise sessions</p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openNewWorkoutModal}
                    size="large"
                    className="add-btn"
                >
                    Log Workout
                </Button>
            </div>

            {/* Quick Stats */}
            <Row gutter={[16, 16]} className="quick-stats">
                <Col xs={12} sm={6}>
                    <Card className="quick-stat-card glass-card">
                        <div className="quick-stat-icon">🏋️</div>
                        <div className="quick-stat-value">{workouts.length}</div>
                        <div className="quick-stat-label">Total Workouts</div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="quick-stat-card glass-card">
                        <div className="quick-stat-icon">⏱️</div>
                        <div className="quick-stat-value">
                            {workouts.reduce((sum, w) => sum + (w.duration || 0), 0)}
                        </div>
                        <div className="quick-stat-label">Total Minutes</div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="quick-stat-card glass-card">
                        <div className="quick-stat-icon">🔥</div>
                        <div className="quick-stat-value">
                            {workouts.reduce((sum, w) => sum + (w.totalCaloriesBurned || 0), 0)}
                        </div>
                        <div className="quick-stat-label">Calories Burned</div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="quick-stat-card glass-card">
                        <div className="quick-stat-icon">📈</div>
                        <div className="quick-stat-value">
                            {workouts.filter(w => {
                                const date = new Date(w.completedAt);
                                const now = new Date();
                                return date.getMonth() === now.getMonth();
                            }).length}
                        </div>
                        <div className="quick-stat-label">This Month</div>
                    </Card>
                </Col>
            </Row>

            {/* Workouts List */}
            <div className="workouts-content">
                {loading ? (
                    <div className="loading-container">
                        <Spin size="large" />
                    </div>
                ) : workouts.length === 0 ? (
                    <Card className="empty-card glass-card">
                        <Empty
                            image={<span className="empty-icon">🏋️</span>}
                            description={
                                <div className="empty-text">
                                    <h3>No workouts logged yet</h3>
                                    <p>Start tracking your fitness journey by logging your first workout!</p>
                                </div>
                            }
                        >
                            <Button type="primary" onClick={openNewWorkoutModal} icon={<PlusOutlined />}>
                                Log Your First Workout
                            </Button>
                        </Empty>
                    </Card>
                ) : (
                    <Row gutter={[16, 16]} className="workouts-grid">
                        {workouts.map((workout) => {
                            const typeInfo = getWorkoutTypeInfo(workout.type);
                            const intensityInfo = getIntensityInfo(workout.intensity);

                            return (
                                <Col xs={24} sm={12} lg={8} xl={6} key={workout._id}>
                                    <Card
                                        className="workout-card glass-card"
                                        hoverable
                                    >
                                        <div className="workout-card-header">
                                            <div className="workout-type-badge" style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}>
                                                <span className="type-icon">{typeInfo.icon}</span>
                                                <span>{typeInfo.label}</span>
                                            </div>
                                            <div className="workout-actions">
                                                <Button
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    onClick={() => handleEdit(workout)}
                                                    size="small"
                                                />
                                                <Popconfirm
                                                    title="Delete this workout?"
                                                    onConfirm={() => handleDelete(workout._id)}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button
                                                        type="text"
                                                        icon={<DeleteOutlined />}
                                                        danger
                                                        size="small"
                                                    />
                                                </Popconfirm>
                                            </div>
                                        </div>

                                        <h3 className="workout-title">{workout.title}</h3>

                                        <div className="workout-meta">
                                            <div className="meta-item">
                                                <ClockCircleOutlined />
                                                <span>{workout.duration} min</span>
                                            </div>
                                            <div className="meta-item">
                                                <FireOutlined />
                                                <span>{workout.totalCaloriesBurned} kcal</span>
                                            </div>
                                        </div>

                                        <div className="workout-footer">
                                            <Tag color={intensityInfo.color}>{intensityInfo.label}</Tag>
                                            <span className="workout-date">
                                                <CalendarOutlined /> {dayjs(workout.completedAt).format('MMM D')}
                                            </span>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                title={editingWorkout ? 'Edit Workout' : 'Log New Workout'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingWorkout(null);
                }}
                footer={null}
                width={600}
                className="workout-modal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        type: 'mixed',
                        intensity: 'moderate',
                        duration: 30,
                        totalCaloriesBurned: 200,
                    }}
                >
                    <Form.Item
                        name="title"
                        label="Workout Title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="e.g., Morning Run, Upper Body Day" size="large" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label="Workout Type"
                                rules={[{ required: true }]}
                            >
                                <Select size="large">
                                    {workoutTypes.map(type => (
                                        <Option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="intensity"
                                label="Intensity Level"
                                rules={[{ required: true }]}
                            >
                                <Select size="large">
                                    {intensityLevels.map(level => (
                                        <Option key={level.value} value={level.value}>
                                            {level.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="duration"
                                label="Duration (minutes)"
                                rules={[{ required: true, message: 'Please enter duration' }]}
                            >
                                <InputNumber
                                    min={1}
                                    max={480}
                                    size="large"
                                    style={{ width: '100%' }}
                                    placeholder="30"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="totalCaloriesBurned"
                                label="Calories Burned"
                            >
                                <InputNumber
                                    min={0}
                                    max={5000}
                                    size="large"
                                    style={{ width: '100%' }}
                                    placeholder="200"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="notes" label="Notes (optional)">
                        <TextArea
                            rows={3}
                            placeholder="How was your workout? Any achievements or observations?"
                        />
                    </Form.Item>

                    <div className="modal-actions">
                        <Button onClick={() => setModalVisible(false)}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {editingWorkout ? 'Update Workout' : 'Log Workout'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default Workouts;
