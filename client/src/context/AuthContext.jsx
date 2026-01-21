import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { message } from 'antd';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await authAPI.getMe();
                setUser(response.data.data);
                setIsAuthenticated(true);
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    };

    const login = async (credentials) => {
        try {
            const response = await authAPI.login(credentials);
            const { token, data } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(data));

            setUser(data);
            setIsAuthenticated(true);
            message.success('Welcome back!');

            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            message.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            const { token, data } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(data));

            setUser(data);
            setIsAuthenticated(true);
            message.success('Account created successfully!');

            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Registration failed';
            message.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        message.success('Logged out successfully');
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await authAPI.updateProfile(profileData);
            setUser(response.data.data);
            message.success('Profile updated successfully');
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Update failed';
            message.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
