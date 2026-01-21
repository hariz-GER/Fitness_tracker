import { useState, useEffect } from 'react';
import {
    Card, Button, Modal, Form, Input, InputNumber, Select,
    Row, Col, Statistic, Empty, Spin, Tabs, message, DatePicker
} from 'antd';
import {
    PlusOutlined, RiseOutlined, FallOutlined, LineChartOutlined,
    ThunderboltOutlined, MoonOutlined
} from '@ant-design/icons';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { progressAPI } from '../services/api';
import dayjs from 'dayjs';
import './Progress.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const { Option } = Select;
const { TextArea } = Input;

const Progress = () => {
    const [loading, setLoading] = useState(true);
    const [progressHistory, setProgressHistory] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [period, setPeriod] = useState('month');
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [historyRes, analyticsRes] = await Promise.all([
                progressAPI.getAll({ limit: 100 }),
                progressAPI.getAnalytics({ period }),
            ]);
            setProgressHistory(historyRes.data.data || []);
            setAnalytics(analyticsRes.data.data || null);
        } catch (error) {
            console.error('Failed to fetch progress data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);
            await progressAPI.create({
                ...values,
                date: values.date?.toDate() || new Date(),
            });
            message.success('Progress logged successfully! 📊');
            setModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            message.error('Failed to save progress');
        } finally {
            setSubmitting(false);
        }
    };

    const weightChartData = {
        labels: analytics?.weightTrend?.map(item => dayjs(item.date).format('MMM D')) || [],
        datasets: [
            {
                label: 'Weight (kg)',
                data: analytics?.weightTrend?.map(item => item.weight) || [],
                fill: true,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const bmiChartData = {
        labels: analytics?.bmiTrend?.map(item => dayjs(item.date).format('MMM D')) || [],
        datasets: [
            {
                label: 'BMI',
                data: analytics?.bmiTrend?.map(item => item.bmi) || [],
                fill: true,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#22c55e',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
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
                padding: 12,
                cornerRadius: 8,
                titleColor: '#fff',
                bodyColor: '#a1a1aa',
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

    const summary = analytics?.summary;

    return (
        <div className="progress-page">
            <div className="page-header">
                <div>
                    <h1>Progress Analytics</h1>
                    <p>Track your fitness journey over time</p>
                </div>
                <div className="header-actions">
                    <Select
                        value={period}
                        onChange={setPeriod}
                        size="large"
                        className="period-select"
                    >
                        <Option value="week">Last 7 Days</Option>
                        <Option value="month">Last 30 Days</Option>
                        <Option value="3months">Last 3 Months</Option>
                        <Option value="year">Last Year</Option>
                    </Select>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                        size="large"
                        className="add-btn"
                    >
                        Log Progress
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    {summary && (
                        <Row gutter={[16, 16]} className="summary-row">
                            <Col xs={12} sm={6}>
                                <Card className="summary-card glass-card">
                                    <div className="summary-icon weight">⚖️</div>
                                    <Statistic
                                        title="Current Weight"
                                        value={summary.currentWeight}
                                        suffix="kg"
                                        precision={1}
                                    />
                                    <div className={`change ${summary.weightChange < 0 ? 'positive' : summary.weightChange > 0 ? 'negative' : ''}`}>
                                        {summary.weightChange < 0 ? <FallOutlined /> : summary.weightChange > 0 ? <RiseOutlined /> : null}
                                        <span>{Math.abs(summary.weightChange).toFixed(1)} kg</span>
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card className="summary-card glass-card">
                                    <div className="summary-icon bmi">📊</div>
                                    <Statistic
                                        title="Current BMI"
                                        value={summary.currentBMI}
                                        precision={1}
                                    />
                                    <div className={`change ${summary.bmiChange < 0 ? 'positive' : summary.bmiChange > 0 ? 'negative' : ''}`}>
                                        {summary.bmiChange < 0 ? <FallOutlined /> : summary.bmiChange > 0 ? <RiseOutlined /> : null}
                                        <span>{Math.abs(summary.bmiChange).toFixed(1)}</span>
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card className="summary-card glass-card">
                                    <div className="summary-icon energy">⚡</div>
                                    <Statistic
                                        title="Avg Energy Level"
                                        value={summary.avgEnergyLevel}
                                        suffix="/ 10"
                                        precision={1}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card className="summary-card glass-card">
                                    <div className="summary-icon sleep">😴</div>
                                    <Statistic
                                        title="Avg Sleep"
                                        value={summary.avgSleepHours}
                                        suffix="hrs"
                                        precision={1}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    )}

                    {/* Charts */}
                    <Row gutter={[20, 20]} className="charts-row">
                        <Col xs={24} lg={12}>
                            <Card
                                className="chart-card glass-card"
                                title={
                                    <div className="chart-header">
                                        <LineChartOutlined className="chart-icon" />
                                        <span>Weight Trend</span>
                                    </div>
                                }
                            >
                                <div className="chart-container">
                                    {analytics?.weightTrend?.length > 0 ? (
                                        <Line data={weightChartData} options={chartOptions} />
                                    ) : (
                                        <Empty
                                            description="No weight data yet"
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        />
                                    )}
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card
                                className="chart-card glass-card"
                                title={
                                    <div className="chart-header">
                                        <LineChartOutlined className="chart-icon" style={{ color: '#22c55e' }} />
                                        <span>BMI Trend</span>
                                    </div>
                                }
                            >
                                <div className="chart-container">
                                    {analytics?.bmiTrend?.length > 0 ? (
                                        <Line data={bmiChartData} options={chartOptions} />
                                    ) : (
                                        <Empty
                                            description="No BMI data yet"
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        />
                                    )}
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Progress History */}
                    <Card
                        className="history-card glass-card"
                        title={
                            <div className="history-header">
                                <h3>Progress History</h3>
                                <span className="entry-count">{progressHistory.length} entries</span>
                            </div>
                        }
                    >
                        {progressHistory.length > 0 ? (
                            <div className="history-list">
                                {progressHistory.slice(0, 10).map((entry, index) => (
                                    <div key={entry._id || index} className="history-item">
                                        <div className="history-date">
                                            <span className="day">{dayjs(entry.date).format('DD')}</span>
                                            <span className="month">{dayjs(entry.date).format('MMM')}</span>
                                        </div>
                                        <div className="history-stats">
                                            <div className="history-stat">
                                                <span className="stat-value">{entry.weight} kg</span>
                                                <span className="stat-label">Weight</span>
                                            </div>
                                            <div className="history-stat">
                                                <span className="stat-value">{entry.bmi?.toFixed(1) || '-'}</span>
                                                <span className="stat-label">BMI</span>
                                            </div>
                                            <div className="history-stat">
                                                <span className="stat-value">{entry.energyLevel || '-'}/10</span>
                                                <span className="stat-label">Energy</span>
                                            </div>
                                            <div className="history-stat">
                                                <span className="stat-value">{entry.sleepHours || '-'}h</span>
                                                <span className="stat-label">Sleep</span>
                                            </div>
                                        </div>
                                        {entry.notes && (
                                            <div className="history-notes">{entry.notes}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty
                                description="No progress entries yet. Start tracking today!"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )}
                    </Card>
                </>
            )}

            {/* Log Progress Modal */}
            <Modal
                title="Log Progress"
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
                className="progress-modal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        date: dayjs(),
                        energyLevel: 7,
                        sleepHours: 7,
                        sleepQuality: 'good',
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="date"
                                label="Date"
                                rules={[{ required: true }]}
                            >
                                <DatePicker size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="weight"
                                label="Weight (kg)"
                                rules={[{ required: true, message: 'Please enter your weight' }]}
                            >
                                <InputNumber
                                    min={20}
                                    max={300}
                                    step={0.1}
                                    size="large"
                                    style={{ width: '100%' }}
                                    placeholder="70.5"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="measurements-section">
                        <h4>Body Measurements (optional)</h4>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name={['bodyMeasurements', 'chest']} label="Chest (cm)">
                                    <InputNumber min={0} max={200} size="large" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name={['bodyMeasurements', 'waist']} label="Waist (cm)">
                                    <InputNumber min={0} max={200} size="large" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name={['bodyMeasurements', 'hips']} label="Hips (cm)">
                                    <InputNumber min={0} max={200} size="large" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <div className="wellness-section">
                        <h4>Wellness Metrics</h4>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="energyLevel" label="Energy Level (1-10)">
                                    <InputNumber min={1} max={10} size="large" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="sleepHours" label="Sleep Hours">
                                    <InputNumber min={0} max={24} step={0.5} size="large" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="sleepQuality" label="Sleep Quality">
                                    <Select size="large">
                                        <Option value="poor">Poor</Option>
                                        <Option value="fair">Fair</Option>
                                        <Option value="good">Good</Option>
                                        <Option value="excellent">Excellent</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <Form.Item name="notes" label="Notes (optional)">
                        <TextArea rows={2} placeholder="How are you feeling today?" />
                    </Form.Item>

                    <div className="modal-actions">
                        <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            Log Progress
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default Progress;
