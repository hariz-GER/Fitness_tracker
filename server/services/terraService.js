/**
 * Terra API Integration Service
 * 
 * Terra API allows you to connect to 50+ wearables including:
 * - Apple Watch (via iPhone)
 * - Wear OS / Samsung Galaxy Watch
 * - Fitbit
 * - Garmin
 * - Whoop
 * - Oura Ring
 * - And many more...
 * 
 * To use this integration:
 * 1. Sign up at https://tryterra.co (free tier available)
 * 2. Get your API key and Dev ID
 * 3. Add them to your .env file
 * 
 * TERRA_API_KEY=your_api_key
 * TERRA_DEV_ID=your_dev_id
 */

const axios = require('axios');

const TERRA_API_URL = 'https://api.tryterra.co/v2';
const TERRA_DEV_ID = process.env.TERRA_DEV_ID;
const TERRA_API_KEY = process.env.TERRA_API_KEY;

// Create Terra API client
const terraClient = axios.create({
    baseURL: TERRA_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'dev-id': TERRA_DEV_ID,
        'x-api-key': TERRA_API_KEY,
    },
});

/**
 * Generate a widget session for user to connect their device
 * This opens a UI where users can authorize their fitness device
 */
const generateWidgetSession = async (userId, providers = []) => {
    try {
        const response = await terraClient.post('/auth/generateWidgetSession', {
            reference_id: userId,
            providers: providers.length > 0 ? providers : undefined,
            language: 'en',
            auth_success_redirect_url: `${process.env.APP_URL}/connect-device/success`,
            auth_failure_redirect_url: `${process.env.APP_URL}/connect-device/failure`,
        });

        return {
            success: true,
            widgetUrl: response.data.url,
            sessionId: response.data.session_id,
        };
    } catch (error) {
        console.error('Terra Widget Session Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to generate widget session',
        };
    }
};

/**
 * Get user's connected devices/providers
 */
const getUserDevices = async (terraUserId) => {
    try {
        const response = await terraClient.get(`/userInfo?user_id=${terraUserId}`);
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        console.error('Terra Get User Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to get user devices',
        };
    }
};

/**
 * Get activity/workout data from connected device
 * @param {string} terraUserId - Terra user ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 */
const getActivityData = async (terraUserId, startDate, endDate) => {
    try {
        const response = await terraClient.get('/activity', {
            params: {
                user_id: terraUserId,
                start_date: startDate,
                end_date: endDate,
                to_webhook: false,
            },
        });

        return {
            success: true,
            activities: response.data.data || [],
        };
    } catch (error) {
        console.error('Terra Activity Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to get activity data',
        };
    }
};

/**
 * Get body metrics (weight, body fat, etc.) from connected device
 */
const getBodyData = async (terraUserId, startDate, endDate) => {
    try {
        const response = await terraClient.get('/body', {
            params: {
                user_id: terraUserId,
                start_date: startDate,
                end_date: endDate,
                to_webhook: false,
            },
        });

        return {
            success: true,
            bodyData: response.data.data || [],
        };
    } catch (error) {
        console.error('Terra Body Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to get body data',
        };
    }
};

/**
 * Get sleep data from connected device
 */
const getSleepData = async (terraUserId, startDate, endDate) => {
    try {
        const response = await terraClient.get('/sleep', {
            params: {
                user_id: terraUserId,
                start_date: startDate,
                end_date: endDate,
                to_webhook: false,
            },
        });

        return {
            success: true,
            sleepData: response.data.data || [],
        };
    } catch (error) {
        console.error('Terra Sleep Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to get sleep data',
        };
    }
};

/**
 * Get daily summary (steps, calories, heart rate, etc.)
 */
const getDailyData = async (terraUserId, startDate, endDate) => {
    try {
        const response = await terraClient.get('/daily', {
            params: {
                user_id: terraUserId,
                start_date: startDate,
                end_date: endDate,
                to_webhook: false,
            },
        });

        return {
            success: true,
            dailyData: response.data.data || [],
        };
    } catch (error) {
        console.error('Terra Daily Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to get daily data',
        };
    }
};

/**
 * Get nutrition data from connected device
 */
const getNutritionData = async (terraUserId, startDate, endDate) => {
    try {
        const response = await terraClient.get('/nutrition', {
            params: {
                user_id: terraUserId,
                start_date: startDate,
                end_date: endDate,
                to_webhook: false,
            },
        });

        return {
            success: true,
            nutritionData: response.data.data || [],
        };
    } catch (error) {
        console.error('Terra Nutrition Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to get nutrition data',
        };
    }
};

/**
 * Disconnect a user's device
 */
const disconnectUser = async (terraUserId) => {
    try {
        await terraClient.delete(`/user/${terraUserId}`);
        return { success: true };
    } catch (error) {
        console.error('Terra Disconnect Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to disconnect user',
        };
    }
};

/**
 * Transform Terra activity data to our workout format
 */
const transformToWorkout = (terraActivity) => {
    // Map Terra activity types to our workout types
    const typeMapping = {
        running: 'cardio',
        walking: 'cardio',
        cycling: 'cardio',
        swimming: 'cardio',
        hiking: 'cardio',
        strength_training: 'strength',
        weight_training: 'strength',
        yoga: 'yoga',
        hiit: 'hiit',
        crossfit: 'hiit',
        soccer: 'sports',
        basketball: 'sports',
        tennis: 'sports',
        other: 'mixed',
    };

    const activityType = terraActivity.metadata?.type?.toLowerCase() || 'other';

    return {
        title: terraActivity.metadata?.name || `${activityType} Workout`,
        type: typeMapping[activityType] || 'mixed',
        duration: Math.round((terraActivity.active_durations_data?.activity_seconds || 0) / 60),
        totalCaloriesBurned: Math.round(terraActivity.calories_data?.total_burned_calories || 0),
        intensity: determineIntensity(terraActivity),
        source: 'wearable',
        sourceDevice: terraActivity.metadata?.source_name || 'Unknown Device',
        completedAt: new Date(terraActivity.metadata?.start_time),
        heartRateAvg: terraActivity.heart_rate_data?.summary?.avg_hr_bpm,
        heartRateMax: terraActivity.heart_rate_data?.summary?.max_hr_bpm,
        distance: terraActivity.distance_data?.summary?.distance_meters,
        steps: terraActivity.distance_data?.summary?.steps,
        notes: `Synced from ${terraActivity.metadata?.source_name || 'wearable device'}`,
    };
};

/**
 * Determine workout intensity based on heart rate and other metrics
 */
const determineIntensity = (terraActivity) => {
    const avgHR = terraActivity.heart_rate_data?.summary?.avg_hr_bpm;
    const maxHR = terraActivity.heart_rate_data?.summary?.max_hr_bpm;

    if (!avgHR) return 'moderate';

    // Estimate max heart rate (220 - age), assuming age 30 if unknown
    const estimatedMaxHR = maxHR || 190;
    const hrPercentage = (avgHR / estimatedMaxHR) * 100;

    if (hrPercentage >= 85) return 'extreme';
    if (hrPercentage >= 70) return 'high';
    if (hrPercentage >= 55) return 'moderate';
    return 'low';
};

module.exports = {
    generateWidgetSession,
    getUserDevices,
    getActivityData,
    getBodyData,
    getSleepData,
    getDailyData,
    getNutritionData,
    disconnectUser,
    transformToWorkout,
};
