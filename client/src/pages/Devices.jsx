import { useState, useEffect } from 'react';
import {
    Card, Button, Row, Col, Tag, Empty, Spin, Modal, message,
    Statistic, Progress, Timeline, Switch, Alert
} from 'antd';
import {
    SyncOutlined, DisconnectOutlined, LinkOutlined,
    HeartOutlined, FireOutlined, ThunderboltOutlined,
    MoonOutlined, FieldTimeOutlined, CheckCircleOutlined,
    ClockCircleOutlined, ApiOutlined
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';
import './Devices.css';

// Device icons and info
const deviceInfo = {
    APPLE: { name: 'Apple Watch', icon: '⌚', color: '#333' },
    GOOGLE: { name: 'Google Fit', icon: '🏃', color: '#4285f4' },
    SAMSUNG: { name: 'Samsung Health', icon: '📱', color: '#1428a0' },
    FITBIT: { name: 'Fitbit', icon: '💪', color: '#00b0b9' },
    GARMIN: { name: 'Garmin', icon: '⏱️', color: '#007cc3' },
    WHOOP: { name: 'Whoop', icon: '🔴', color: '#e31937' },
    OURA: { name: 'Oura Ring', icon: '💍', color: '#8b5cf6' },
    POLAR: { name: 'Polar', icon: '❄️', color: '#d32f2f' },
    SUUNTO: { name: 'Suunto', icon: '🧭', color: '#ff6900' },
    COROS: { name: 'COROS', icon: '🏔️', color: '#ff5722' },
    DEFAULT: { name: 'Wearable', icon: '⌚', color: '#00d4c8' },
};

const Devices = () => {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [devices, setDevices] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [dailyStats, setDailyStats] = useState(null);
    const [sleepData, setSleepData] = useState([]);
    const [recentSyncs, setRecentSyncs] = useState([]);
    const [autoSync, setAutoSync] = useState(true);

    useEffect(() => {
        fetchDevices();
        fetchDailyStats();
        fetchSleepData();
    }, []);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/devices');
            setDevices(response.data.devices || []);
            setIsConnected(response.data.connected);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyStats = async () => {
        try {
            const response = await api.get('/devices/daily');
            if (response.data.success && response.data.data) {
                setDailyStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch daily stats:', error);
        }
    };

    const fetchSleepData = async () => {
        try {
            const response = await api.get('/devices/sleep');
            if (response.data.success) {
                setSleepData(response.data.sleepData || []);
            }
        } catch (error) {
            console.error('Failed to fetch sleep data:', error);
        }
    };

    const handleConnect = async () => {
        try {
            setConnecting(true);
            const response = await api.get('/devices/connect');

            if (response.data.success && response.data.widgetUrl) {
                // Check if this is demo mode
                if (response.data.widgetUrl.includes('demo=true')) {
                    // Show device selection modal for demo
                    Modal.confirm({
                        title: '🎮 Demo Mode - Select Device',
                        content: (
                            <div style={{ marginTop: 16 }}>
                                <p style={{ marginBottom: 16, color: '#808080' }}>
                                    Select a device to simulate connection:
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                    {['APPLE', 'GOOGLE', 'FITBIT', 'GARMIN', 'SAMSUNG'].map(device => (
                                        <Button
                                            key={device}
                                            onClick={async () => {
                                                Modal.destroyAll();
                                                await connectDemoDevice(device);
                                            }}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: 'auto',
                                                padding: '12px 16px'
                                            }}
                                        >
                                            <span style={{ fontSize: 24 }}>{deviceInfo[device].icon}</span>
                                            <span style={{ fontSize: 12 }}>{deviceInfo[device].name}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ),
                        okText: 'Cancel',
                        okButtonProps: { style: { display: 'none' } },
                        cancelButtonProps: { style: { display: 'none' } },
                    });
                } else {
                    // Production mode - open Terra widget
                    window.open(response.data.widgetUrl, '_blank', 'width=500,height=700');
                    message.info('Complete the connection in the new window');

                    // Poll for connection status
                    const pollInterval = setInterval(async () => {
                        const statusResponse = await api.get('/devices');
                        if (statusResponse.data.connected) {
                            clearInterval(pollInterval);
                            setIsConnected(true);
                            fetchDevices();
                            fetchDailyStats();
                            message.success('Device connected successfully! 🎉');
                        }
                    }, 3000);

                    setTimeout(() => clearInterval(pollInterval), 120000);
                }
            }
        } catch (error) {
            message.error('Failed to start connection. Please try again.');
        } finally {
            setConnecting(false);
        }
    };

    const connectDemoDevice = async (provider) => {
        try {
            const response = await api.post('/devices/demo-connect', { provider });
            if (response.data.success) {
                setIsConnected(true);
                setDevices([response.data.device]);
                fetchDailyStats();
                fetchSleepData();
                message.success(`${deviceInfo[provider].name} connected! 🎉`);
            }
        } catch (error) {
            message.error('Failed to connect device');
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            const response = await api.post('/devices/sync');

            if (response.data.success) {
                const { synced, total } = response.data;
                if (synced > 0) {
                    message.success(`Synced ${synced} new workouts from your device! 💪`);
                    setRecentSyncs(prev => [{
                        time: new Date(),
                        count: synced,
                    }, ...prev.slice(0, 4)]);
                } else {
                    message.info('All workouts are already synced!');
                }
                fetchDailyStats();
            }
        } catch (error) {
            message.error('Sync failed. Please try again.');
        } finally {
            setSyncing(false);
        }
    };

    const handleDisconnect = async () => {
        Modal.confirm({
            title: 'Disconnect Device?',
            content: 'This will stop syncing data from your wearable. Your existing data will be kept.',
            okText: 'Disconnect',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await api.delete('/devices/disconnect');
                    setIsConnected(false);
                    setDevices([]);
                    setDailyStats(null);
                    message.success('Device disconnected');
                } catch (error) {
                    message.error('Failed to disconnect device');
                }
            },
        });
    };

    const getDeviceInfo = (provider) => {
        return deviceInfo[provider?.toUpperCase()] || deviceInfo.DEFAULT;
    };

    if (loading) {
        return (
            <div className="devices-page">
                <div className="loading-container">
                    <Spin size="large" />
                </div>
            </div>
        );
    }

    return (
        <div className="devices-page">
            <div className="page-header">
                <div>
                    <h1>🔗 Connected Devices</h1>
                    <p>Sync your smartwatch and fitness trackers</p>
                </div>
                {isConnected ? (
                    <div className="header-actions">
                        <Button
                            type="primary"
                            icon={<SyncOutlined spin={syncing} />}
                            onClick={handleSync}
                            loading={syncing}
                            size="large"
                            className="sync-btn"
                        >
                            {syncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                    </div>
                ) : null}
            </div>

            {/* Connection Status */}
            {!isConnected ? (
                <Card className="connect-card glass-card">
                    <div className="connect-content">
                        <div className="connect-icon">⌚</div>
                        <h2>Connect Your Wearable</h2>
                        <p>
                            Sync your workouts, heart rate, sleep data, and more from your
                            smartwatch or fitness tracker.
                        </p>

                        <div className="supported-devices">
                            <h4>Supported Devices</h4>
                            <div className="device-logos">
                                {['APPLE', 'GOOGLE', 'SAMSUNG', 'FITBIT', 'GARMIN', 'WHOOP', 'OURA', 'POLAR'].map(key => (
                                    <div key={key} className="device-logo" title={deviceInfo[key].name}>
                                        <span>{deviceInfo[key].icon}</span>
                                        <small>{deviceInfo[key].name}</small>
                                    </div>
                                ))}
                            </div>
                            <p className="more-devices">+ 40 more devices</p>
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            icon={<LinkOutlined />}
                            onClick={handleConnect}
                            loading={connecting}
                            className="connect-btn"
                        >
                            {connecting ? 'Connecting...' : 'Connect Device'}
                        </Button>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Connected Device Card */}
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={8}>
                            <Card className="device-card glass-card">
                                <div className="device-header">
                                    <div className="device-icon-large">
                                        {getDeviceInfo(devices[0]?.provider).icon}
                                    </div>
                                    <div className="device-info">
                                        <h3>{getDeviceInfo(devices[0]?.provider).name}</h3>
                                        <Tag color="green" icon={<CheckCircleOutlined />}>
                                            Connected
                                        </Tag>
                                    </div>
                                </div>

                                <div className="device-settings">
                                    <div className="setting-item">
                                        <span>Auto-sync</span>
                                        <Switch
                                            checked={autoSync}
                                            onChange={setAutoSync}
                                            checkedChildren="ON"
                                            unCheckedChildren="OFF"
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <span>Last synced</span>
                                        <span className="setting-value">
                                            {recentSyncs[0]
                                                ? dayjs(recentSyncs[0].time).fromNow()
                                                : 'Never'}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    danger
                                    icon={<DisconnectOutlined />}
                                    onClick={handleDisconnect}
                                    block
                                    className="disconnect-btn"
                                >
                                    Disconnect Device
                                </Button>
                            </Card>
                        </Col>

                        {/* Today's Stats */}
                        <Col xs={24} lg={16}>
                            <Card className="stats-card glass-card" title="📊 Today's Activity">
                                {dailyStats ? (
                                    <Row gutter={[16, 16]}>
                                        <Col xs={12} sm={6}>
                                            <Statistic
                                                title="Steps"
                                                value={dailyStats.steps || 0}
                                                prefix="👣"
                                                className="stat-item"
                                            />
                                            <Progress
                                                percent={Math.min((dailyStats.steps / 10000) * 100, 100)}
                                                showInfo={false}
                                                strokeColor="#00d4c8"
                                            />
                                        </Col>
                                        <Col xs={12} sm={6}>
                                            <Statistic
                                                title="Calories"
                                                value={dailyStats.caloriesBurned || 0}
                                                prefix={<FireOutlined />}
                                                suffix="kcal"
                                                className="stat-item"
                                            />
                                        </Col>
                                        <Col xs={12} sm={6}>
                                            <Statistic
                                                title="Active Time"
                                                value={dailyStats.activeMinutes || 0}
                                                prefix={<ThunderboltOutlined />}
                                                suffix="min"
                                                className="stat-item"
                                            />
                                        </Col>
                                        <Col xs={12} sm={6}>
                                            <Statistic
                                                title="Avg Heart Rate"
                                                value={dailyStats.avgHeartRate || '--'}
                                                prefix={<HeartOutlined />}
                                                suffix="bpm"
                                                className="stat-item heart-rate"
                                            />
                                        </Col>
                                    </Row>
                                ) : (
                                    <Empty description="Sync to see today's stats" />
                                )}
                            </Card>
                        </Col>
                    </Row>

                    {/* Sleep Data */}
                    <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                        <Col xs={24} lg={12}>
                            <Card className="sleep-card glass-card" title="😴 Sleep Tracking">
                                {sleepData.length > 0 ? (
                                    <div className="sleep-content">
                                        <div className="sleep-main">
                                            <div className="sleep-hours">
                                                <MoonOutlined />
                                                <span className="hours-value">
                                                    {sleepData[0]?.totalSleep || 0}
                                                </span>
                                                <span className="hours-label">hours</span>
                                            </div>
                                            <div className="sleep-quality">
                                                <span className="quality-label">Sleep Score</span>
                                                <span className="quality-value">
                                                    {sleepData[0]?.sleepScore || '--'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="sleep-breakdown">
                                            <div className="sleep-stage">
                                                <span className="stage-dot deep"></span>
                                                <span>Deep: {sleepData[0]?.deepSleep || 0}h</span>
                                            </div>
                                            <div className="sleep-stage">
                                                <span className="stage-dot light"></span>
                                                <span>Light: {sleepData[0]?.lightSleep || 0}h</span>
                                            </div>
                                            <div className="sleep-stage">
                                                <span className="stage-dot rem"></span>
                                                <span>REM: {sleepData[0]?.remSleep || 0}h</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <Empty description="No sleep data yet" />
                                )}
                            </Card>
                        </Col>

                        {/* Sync History */}
                        <Col xs={24} lg={12}>
                            <Card className="sync-history-card glass-card" title="🔄 Sync History">
                                {recentSyncs.length > 0 ? (
                                    <Timeline
                                        items={recentSyncs.map((sync, index) => ({
                                            color: index === 0 ? 'green' : 'gray',
                                            children: (
                                                <div className="sync-item">
                                                    <span className="sync-time">
                                                        {dayjs(sync.time).format('MMM D, h:mm A')}
                                                    </span>
                                                    <span className="sync-count">
                                                        {sync.count} workouts synced
                                                    </span>
                                                </div>
                                            ),
                                        }))}
                                    />
                                ) : (
                                    <Empty description="No sync history" />
                                )}
                            </Card>
                        </Col>
                    </Row>

                    {/* Info Banner */}
                    <Alert
                        message="Pro Tip"
                        description="Your device automatically syncs new workouts every hour. You can also manually sync anytime by clicking 'Sync Now'."
                        type="info"
                        showIcon
                        icon={<ApiOutlined />}
                        style={{ marginTop: 24 }}
                    />
                </>
            )}
        </div>
    );
};

export default Devices;
