import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        const result = await register({
            name: values.name,
            email: values.email,
            password: values.password,
        });
        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            <div className="auth-container">
                <div className="auth-card glass-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <span>💪</span>
                        </div>
                        <h1>Create Account</h1>
                        <p>Start your fitness journey today</p>
                    </div>

                    <Form
                        name="register"
                        onFinish={onFinish}
                        layout="vertical"
                        requiredMark={false}
                        className="auth-form"
                    >
                        <Form.Item
                            name="name"
                            rules={[
                                { required: true, message: 'Please enter your name' },
                                { min: 2, message: 'Name must be at least 2 characters' },
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="Full name"
                                size="large"
                                className="auth-input"
                            />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Please enter a valid email' },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder="Email address"
                                size="large"
                                className="auth-input"
                            />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="password"
                                    rules={[
                                        { required: true, message: 'Please enter a password' },
                                        { min: 6, message: 'Password must be at least 6 characters' },
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined />}
                                        placeholder="Password"
                                        size="large"
                                        className="auth-input"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="confirmPassword"
                                    dependencies={['password']}
                                    rules={[
                                        { required: true, message: 'Please confirm password' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Passwords do not match'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined />}
                                        placeholder="Confirm password"
                                        size="large"
                                        className="auth-input"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="agreement"
                            valuePropName="checked"
                            rules={[
                                {
                                    validator: (_, value) =>
                                        value
                                            ? Promise.resolve()
                                            : Promise.reject(new Error('Please accept the terms')),
                                },
                            ]}
                        >
                            <Checkbox>
                                I agree to the{' '}
                                <Link to="/terms" className="auth-link">
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link to="/privacy" className="auth-link">
                                    Privacy Policy
                                </Link>
                            </Checkbox>
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={loading}
                                block
                                className="auth-button"
                            >
                                Create Account
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className="auth-divider">
                        <span>or sign up with</span>
                    </div>

                    <div className="social-buttons">
                        <Button className="social-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </Button>
                        <Button className="social-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </Button>
                    </div>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="auth-features">
                    <div className="feature-item animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                        <span className="feature-icon">⚡</span>
                        <div>
                            <h4>Quick Setup</h4>
                            <p>Get started in under a minute</p>
                        </div>
                    </div>
                    <div className="feature-item animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                        <span className="feature-icon">🔒</span>
                        <div>
                            <h4>Secure & Private</h4>
                            <p>Your data is encrypted and safe</p>
                        </div>
                    </div>
                    <div className="feature-item animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                        <span className="feature-icon">🎯</span>
                        <div>
                            <h4>Set Goals</h4>
                            <p>Define and achieve your targets</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
