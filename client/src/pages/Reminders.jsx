import { useState, useEffect } from 'react';
import {
    Card, Button, Modal, Form, Input, Select, Switch,
    Row, Col, Empty, Spin, Popconfirm, message, TimePicker, Checkbox, Tag
} from 'antd';
import {
    PlusOutlined, DeleteOutlined, EditOutlined, BellOutlined,
    ClockCircleOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { reminderAPI } from '../services/api';
import dayjs from 'dayjs';
import './Reminders.css';

const { Option } = Select;
const { TextArea } = Input;

const reminderTypes = [
    { value: 'workout', label: 'Workout', icon: '💪', color: '#3b82f6' },
    { value: 'meal', label: 'Meal', icon: '🍽️', color: '#22c55e' },
    { value: 'water', label: 'Hydration', icon: '💧', color: '#06b6d4' },
    { value: 'sleep', label: 'Sleep', icon: '😴', color: '#8b5cf6' },
    { value: 'medication', label: 'Medication', icon: '💊', color: '#ec4899' },
    { value: 'weight_check', label: 'Weight Check', icon: '⚖️', color: '#f97316' },
    { value: 'custom', label: 'Custom', icon: '🔔', color: '#71717a' },
];

const daysOfWeek = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
];

const Reminders = () => {
    const [reminders, setReminders] = useState([]);
    const [todayReminders, setTodayReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchReminders();
    }, []);

    const fetchReminders = async () => {
        try {
            setLoading(true);
            const [allRes, todayRes] = await Promise.all([
                reminderAPI.getAll(),
                reminderAPI.getToday(),
            ]);
            setReminders(allRes.data.data || []);
            setTodayReminders(todayRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);

            const reminderData = {
                title: values.title,
                description: values.description,
                type: values.type,
                time: values.time.format('HH:mm'),
                days: values.days || [],
                isRecurring: values.isRecurring,
                icon: reminderTypes.find(t => t.value === values.type)?.icon || '🔔',
                color: reminderTypes.find(t => t.value === values.type)?.color || '#71717a',
            };

            if (editingReminder) {
                await reminderAPI.update(editingReminder._id, reminderData);
                message.success('Reminder updated!');
            } else {
                await reminderAPI.create(reminderData);
                message.success('Reminder created! ⏰');
            }

            setModalVisible(false);
            form.resetFields();
            setEditingReminder(null);
            fetchReminders();
        } catch (error) {
            message.error('Failed to save reminder');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (reminder) => {
        setEditingReminder(reminder);
        form.setFieldsValue({
            title: reminder.title,
            description: reminder.description,
            type: reminder.type,
            time: dayjs(reminder.time, 'HH:mm'),
            days: reminder.days,
            isRecurring: reminder.isRecurring,
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await reminderAPI.delete(id);
            message.success('Reminder deleted');
            fetchReminders();
        } catch (error) {
            message.error('Failed to delete reminder');
        }
    };

    const handleToggle = async (id) => {
        try {
            await reminderAPI.toggle(id);
            fetchReminders();
        } catch (error) {
            message.error('Failed to toggle reminder');
        }
    };

    const getTypeInfo = (type) => {
        return reminderTypes.find(t => t.value === type) || reminderTypes[6];
    };

    const activeReminders = reminders.filter(r => r.isActive);
    const inactiveReminders = reminders.filter(r => !r.isActive);

    return (
        <div className="reminders-page">
            <div className="page-header">
                <div>
                    <h1>Reminders</h1>
                    <p>Stay on track with personalized notifications</p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingReminder(null);
                        form.resetFields();
                        setModalVisible(true);
                    }}
                    size="large"
                    className="add-btn"
                >
                    Add Reminder
                </Button>
            </div>

            {loading ? (
                <div className="loading-container">
                    <Spin size="large" />
                </div>
            ) : (
                <Row gutter={[20, 20]}>
                    {/* Today's Reminders */}
                    <Col xs={24} lg={8}>
                        <Card
                            className="today-card glass-card"
                            title={
                                <div className="card-title">
                                    <BellOutlined className="title-icon" />
                                    <span>Today's Reminders</span>
                                    <Tag className="count-tag">{todayReminders.length}</Tag>
                                </div>
                            }
                        >
                            {todayReminders.length > 0 ? (
                                <div className="today-list">
                                    {todayReminders.map((reminder) => {
                                        const typeInfo = getTypeInfo(reminder.type);
                                        const isPast = dayjs(reminder.time, 'HH:mm').isBefore(dayjs());

                                        return (
                                            <div
                                                key={reminder._id}
                                                className={`today-item ${isPast ? 'past' : ''}`}
                                            >
                                                <div className="today-icon" style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}>
                                                    {reminder.icon || typeInfo.icon}
                                                </div>
                                                <div className="today-content">
                                                    <h4>{reminder.title}</h4>
                                                    <span className="today-time">
                                                        <ClockCircleOutlined /> {reminder.time}
                                                    </span>
                                                </div>
                                                {isPast && (
                                                    <CheckCircleOutlined className="completed-icon" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Empty
                                    description="No reminders for today"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            )}
                        </Card>
                    </Col>

                    {/* All Reminders */}
                    <Col xs={24} lg={16}>
                        <Card className="all-reminders-card glass-card">
                            <div className="reminders-section">
                                <h3 className="section-title">Active Reminders ({activeReminders.length})</h3>
                                {activeReminders.length > 0 ? (
                                    <div className="reminders-grid">
                                        {activeReminders.map((reminder) => {
                                            const typeInfo = getTypeInfo(reminder.type);

                                            return (
                                                <div key={reminder._id} className="reminder-card">
                                                    <div className="reminder-header">
                                                        <div
                                                            className="reminder-icon"
                                                            style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}
                                                        >
                                                            {reminder.icon || typeInfo.icon}
                                                        </div>
                                                        <div className="reminder-info">
                                                            <h4>{reminder.title}</h4>
                                                            <span className="reminder-type">{typeInfo.label}</span>
                                                        </div>
                                                        <Switch
                                                            checked={reminder.isActive}
                                                            onChange={() => handleToggle(reminder._id)}
                                                            size="small"
                                                        />
                                                    </div>

                                                    <div className="reminder-time">
                                                        <ClockCircleOutlined /> {reminder.time}
                                                    </div>

                                                    {reminder.days?.length > 0 && (
                                                        <div className="reminder-days">
                                                            {daysOfWeek.map(day => (
                                                                <span
                                                                    key={day.value}
                                                                    className={`day-badge ${reminder.days.includes(day.value) ? 'active' : ''}`}
                                                                >
                                                                    {day.label.charAt(0)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="reminder-actions">
                                                        <Button
                                                            type="text"
                                                            icon={<EditOutlined />}
                                                            size="small"
                                                            onClick={() => handleEdit(reminder)}
                                                        />
                                                        <Popconfirm
                                                            title="Delete this reminder?"
                                                            onConfirm={() => handleDelete(reminder._id)}
                                                        >
                                                            <Button
                                                                type="text"
                                                                icon={<DeleteOutlined />}
                                                                size="small"
                                                                danger
                                                            />
                                                        </Popconfirm>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <Empty
                                        description="No active reminders"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                            </div>

                            {inactiveReminders.length > 0 && (
                                <div className="reminders-section inactive-section">
                                    <h3 className="section-title">Paused Reminders ({inactiveReminders.length})</h3>
                                    <div className="reminders-grid">
                                        {inactiveReminders.map((reminder) => {
                                            const typeInfo = getTypeInfo(reminder.type);

                                            return (
                                                <div key={reminder._id} className="reminder-card inactive">
                                                    <div className="reminder-header">
                                                        <div
                                                            className="reminder-icon"
                                                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-tertiary)' }}
                                                        >
                                                            {reminder.icon || typeInfo.icon}
                                                        </div>
                                                        <div className="reminder-info">
                                                            <h4>{reminder.title}</h4>
                                                            <span className="reminder-type">{typeInfo.label}</span>
                                                        </div>
                                                        <Switch
                                                            checked={reminder.isActive}
                                                            onChange={() => handleToggle(reminder._id)}
                                                            size="small"
                                                        />
                                                    </div>

                                                    <div className="reminder-time">
                                                        <ClockCircleOutlined /> {reminder.time}
                                                    </div>

                                                    <div className="reminder-actions">
                                                        <Button
                                                            type="text"
                                                            icon={<EditOutlined />}
                                                            size="small"
                                                            onClick={() => handleEdit(reminder)}
                                                        />
                                                        <Popconfirm
                                                            title="Delete this reminder?"
                                                            onConfirm={() => handleDelete(reminder._id)}
                                                        >
                                                            <Button
                                                                type="text"
                                                                icon={<DeleteOutlined />}
                                                                size="small"
                                                                danger
                                                            />
                                                        </Popconfirm>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Add/Edit Modal */}
            <Modal
                title={editingReminder ? 'Edit Reminder' : 'Create Reminder'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingReminder(null);
                }}
                footer={null}
                width={500}
                className="reminder-modal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        type: 'custom',
                        isRecurring: true,
                        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    }}
                >
                    <Form.Item
                        name="title"
                        label="Reminder Title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="e.g., Morning Workout" size="large" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label="Type"
                                rules={[{ required: true }]}
                            >
                                <Select size="large">
                                    {reminderTypes.map(type => (
                                        <Option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="time"
                                label="Time"
                                rules={[{ required: true, message: 'Please select a time' }]}
                            >
                                <TimePicker
                                    format="HH:mm"
                                    size="large"
                                    style={{ width: '100%' }}
                                    minuteStep={5}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="Description (optional)">
                        <TextArea rows={2} placeholder="Add any notes..." />
                    </Form.Item>

                    <Form.Item name="isRecurring" valuePropName="checked">
                        <Checkbox>Repeat this reminder</Checkbox>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                            prevValues.isRecurring !== currentValues.isRecurring
                        }
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('isRecurring') && (
                                <Form.Item name="days" label="Repeat on">
                                    <Checkbox.Group className="days-checkbox-group">
                                        {daysOfWeek.map(day => (
                                            <Checkbox key={day.value} value={day.value}>
                                                {day.label}
                                            </Checkbox>
                                        ))}
                                    </Checkbox.Group>
                                </Form.Item>
                            )
                        }
                    </Form.Item>

                    <div className="modal-actions">
                        <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {editingReminder ? 'Update' : 'Create'} Reminder
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default Reminders;
