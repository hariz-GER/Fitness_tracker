import { useState } from 'react';
import { Card, Form, Input, Button, Row, Col, Avatar, Select, InputNumber, Tabs, message, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const { Option } = Select;

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const handleProfileSave = async (values) => {
        try {
            setSavingProfile(true);
            await updateProfile({
                name: values.name,
                profile: {
                    height: values.height,
                    weight: values.weight,
                    age: values.age,
                    gender: values.gender,
                    activityLevel: values.activityLevel,
                    goalWeight: values.goalWeight,
                    fitnessGoal: values.fitnessGoal,
                },
            });
        } catch (error) {
            message.error('Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSave = async (values) => {
        try {
            setSavingPassword(true);
            // TODO: Implement password update API call
            message.success('Password updated successfully');
            passwordForm.resetFields();
        } catch (error) {
            message.error('Failed to update password');
        } finally {
            setSavingPassword(false);
        }
    };

    const tabItems = [
        {
            key: 'profile',
            label: 'Profile Information',
            children: (
                <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleProfileSave}
                    initialValues={{
                        name: user?.name,
                        email: user?.email,
                        height: user?.profile?.height || '',
                        weight: user?.profile?.weight || '',
                        age: user?.profile?.age || '',
                        gender: user?.profile?.gender || 'other',
                        activityLevel: user?.profile?.activityLevel || 'moderate',
                        goalWeight: user?.profile?.goalWeight || '',
                        fitnessGoal: user?.profile?.fitnessGoal || 'maintain',
                    }}
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="name"
                                label="Full Name"
                                rules={[{ required: true, message: 'Please enter your name' }]}
                            >
                                <Input prefix={<UserOutlined />} size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="email" label="Email Address">
                                <Input prefix={<MailOutlined />} size="large" disabled />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider>Physical Information</Divider>

                    <Row gutter={24}>
                        <Col xs={12} md={6}>
                            <Form.Item name="height" label="Height (cm)">
                                <InputNumber min={100} max={250} size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Item name="weight" label="Weight (kg)">
                                <InputNumber min={30} max={300} step={0.1} size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Item name="age" label="Age">
                                <InputNumber min={10} max={120} size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Item name="gender" label="Gender">
                                <Select size="large">
                                    <Option value="male">Male</Option>
                                    <Option value="female">Female</Option>
                                    <Option value="other">Other</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider>Fitness Goals</Divider>

                    <Row gutter={24}>
                        <Col xs={24} md={8}>
                            <Form.Item name="activityLevel" label="Activity Level">
                                <Select size="large">
                                    <Option value="sedentary">Sedentary (little or no exercise)</Option>
                                    <Option value="light">Light (1-3 days/week)</Option>
                                    <Option value="moderate">Moderate (3-5 days/week)</Option>
                                    <Option value="active">Active (6-7 days/week)</Option>
                                    <Option value="very_active">Very Active (intense daily exercise)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="fitnessGoal" label="Fitness Goal">
                                <Select size="large">
                                    <Option value="lose_weight">Lose Weight</Option>
                                    <Option value="maintain">Maintain Weight</Option>
                                    <Option value="gain_muscle">Gain Muscle</Option>
                                    <Option value="improve_fitness">Improve Fitness</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="goalWeight" label="Goal Weight (kg)">
                                <InputNumber min={30} max={300} step={0.1} size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="form-actions">
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={savingProfile}
                            size="large"
                        >
                            Save Changes
                        </Button>
                    </div>
                </Form>
            ),
        },
        {
            key: 'security',
            label: 'Security',
            children: (
                <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handlePasswordSave}
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="currentPassword"
                                label="Current Password"
                                rules={[{ required: true, message: 'Please enter current password' }]}
                            >
                                <Input.Password prefix={<LockOutlined />} size="large" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="newPassword"
                                label="New Password"
                                rules={[
                                    { required: true, message: 'Please enter new password' },
                                    { min: 6, message: 'Password must be at least 6 characters' },
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="confirmPassword"
                                label="Confirm New Password"
                                dependencies={['newPassword']}
                                rules={[
                                    { required: true, message: 'Please confirm password' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Passwords do not match'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="form-actions">
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={savingPassword}
                            size="large"
                        >
                            Update Password
                        </Button>
                    </div>
                </Form>
            ),
        },
    ];

    return (
        <div className="profile-page">
            <div className="page-header">
                <div>
                    <h1>My Profile</h1>
                    <p>Manage your account settings and preferences</p>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card className="profile-card glass-card">
                        <div className="profile-avatar-section">
                            <Avatar
                                size={120}
                                icon={<UserOutlined />}
                                src={user?.avatar}
                                className="profile-avatar"
                            />
                            <h2>{user?.name}</h2>
                            <p>{user?.email}</p>
                            <Button type="default" size="small">
                                Change Photo
                            </Button>
                        </div>

                        <div className="profile-stats">
                            <div className="profile-stat">
                                <span className="stat-value">{user?.profile?.height || '-'}</span>
                                <span className="stat-label">Height (cm)</span>
                            </div>
                            <div className="profile-stat">
                                <span className="stat-value">{user?.profile?.weight || '-'}</span>
                                <span className="stat-label">Weight (kg)</span>
                            </div>
                            <div className="profile-stat">
                                <span className="stat-value">{user?.profile?.age || '-'}</span>
                                <span className="stat-label">Age</span>
                            </div>
                        </div>

                        {user?.profile?.fitnessGoal && (
                            <div className="profile-goal">
                                <span className="goal-icon">🎯</span>
                                <span className="goal-text">
                                    {user.profile.fitnessGoal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                            </div>
                        )}
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card className="settings-card glass-card">
                        <Tabs items={tabItems} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;
