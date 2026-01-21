import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Badge } from 'antd';
import {
    DashboardOutlined,
    FireOutlined,
    CoffeeOutlined,
    LineChartOutlined,
    BellOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    CalculatorOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

const { Sider, Content, Header } = Layout;

const AppLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const menuItems = [
        {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: <Link to="/dashboard">Dashboard</Link>,
        },
        {
            key: '/workouts',
            icon: <FireOutlined />,
            label: <Link to="/workouts">Workouts</Link>,
        },
        {
            key: '/meals',
            icon: <CoffeeOutlined />,
            label: <Link to="/meals">Meal Planner</Link>,
        },
        {
            key: '/bmi',
            icon: <CalculatorOutlined />,
            label: <Link to="/bmi">BMI Calculator</Link>,
        },
        {
            key: '/progress',
            icon: <LineChartOutlined />,
            label: <Link to="/progress">Progress</Link>,
        },
        {
            key: '/reminders',
            icon: <BellOutlined />,
            label: <Link to="/reminders">Reminders</Link>,
        },
    ];

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Profile',
            onClick: () => navigate('/profile'),
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Settings',
            onClick: () => navigate('/settings'),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            danger: true,
            onClick: () => {
                logout();
                navigate('/login');
            },
        },
    ];

    return (
        <Layout className="app-layout">
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                className="app-sider"
                width={260}
                collapsedWidth={80}
            >
                <div className="sider-header">
                    <Link to="/dashboard" className="logo">
                        <span className="logo-icon">💪</span>
                        {!collapsed && <span className="logo-text">FitTracker</span>}
                    </Link>
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    className="sider-menu"
                />

                {!collapsed && (
                    <div className="sider-footer">
                        <div className="upgrade-card">
                            <div className="upgrade-icon">⚡</div>
                            <h4>Go Premium</h4>
                            <p>Unlock all features</p>
                            <Button type="primary" size="small" block>
                                Upgrade Now
                            </Button>
                        </div>
                    </div>
                )}
            </Sider>

            <Layout className="content-layout">
                <Header className="app-header">
                    <div className="header-left">
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            className="collapse-btn"
                        />
                    </div>

                    <div className="header-right">
                        <Badge count={3} size="small">
                            <Button
                                type="text"
                                icon={<BellOutlined />}
                                className="notification-btn"
                                onClick={() => navigate('/reminders')}
                            />
                        </Badge>

                        <Dropdown
                            menu={{ items: userMenuItems }}
                            placement="bottomRight"
                            trigger={['click']}
                        >
                            <div className="user-menu">
                                <Avatar
                                    size={36}
                                    icon={<UserOutlined />}
                                    src={user?.avatar}
                                    className="user-avatar"
                                />
                                {!collapsed && (
                                    <div className="user-info">
                                        <span className="user-name">{user?.name || 'User'}</span>
                                        <span className="user-email">{user?.email}</span>
                                    </div>
                                )}
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                <Content className="app-content">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
