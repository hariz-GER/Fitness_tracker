import { useState } from 'react';
import { Card, Form, InputNumber, Button, Row, Col, Slider, Radio, message } from 'antd';
import { ManOutlined, WomanOutlined, CalculatorOutlined } from '@ant-design/icons';
import { progressAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './BMICalculator.css';

const BMICalculator = () => {
    const { user, updateProfile } = useAuth();
    const [form] = Form.useForm();
    const [bmiResult, setBmiResult] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [gender, setGender] = useState(user?.profile?.gender || 'male');

    const calculateBMI = async (values) => {
        try {
            setCalculating(true);
            const response = await progressAPI.calculateBMI({
                weight: values.weight,
                height: values.height,
            });
            setBmiResult(response.data.data);
        } catch (error) {
            // Calculate locally if API fails
            const heightInMeters = values.height / 100;
            const bmi = values.weight / (heightInMeters * heightInMeters);

            let category;
            if (bmi < 18.5) category = 'Underweight';
            else if (bmi < 25) category = 'Normal';
            else if (bmi < 30) category = 'Overweight';
            else category = 'Obese';

            setBmiResult({
                bmi: bmi.toFixed(1),
                category,
                healthyWeightRange: {
                    min: (18.5 * heightInMeters * heightInMeters).toFixed(1),
                    max: (24.9 * heightInMeters * heightInMeters).toFixed(1),
                },
                currentWeight: values.weight,
                height: values.height,
            });
        } finally {
            setCalculating(false);
        }
    };

    const saveToProfile = async () => {
        const values = form.getFieldsValue();
        try {
            await updateProfile({
                profile: {
                    height: values.height,
                    weight: values.weight,
                    gender: gender,
                }
            });
            message.success('Profile updated with your measurements!');
        } catch (error) {
            message.error('Failed to update profile');
        }
    };

    const getBMIColor = (bmi) => {
        if (bmi < 18.5) return '#eab308';
        if (bmi < 25) return '#22c55e';
        if (bmi < 30) return '#f97316';
        return '#ef4444';
    };

    const getBMIInfo = (category) => {
        const info = {
            'Underweight': {
                description: 'You may need to gain some weight. Consider consulting a nutritionist.',
                tips: ['Increase caloric intake', 'Eat nutrient-dense foods', 'Add strength training']
            },
            'Normal': {
                description: 'Great job! Your weight is within the healthy range.',
                tips: ['Maintain balanced diet', 'Stay active', 'Keep up the good work']
            },
            'Overweight': {
                description: 'You may benefit from losing some weight for optimal health.',
                tips: ['Increase physical activity', 'Reduce processed foods', 'Monitor portion sizes']
            },
            'Obese': {
                description: 'Consider consulting a healthcare provider for personalized guidance.',
                tips: ['Seek professional advice', 'Start with light exercises', 'Focus on sustainable habits']
            }
        };
        return info[category] || info['Normal'];
    };

    const getBMIPosition = (bmi) => {
        const minBMI = 15;
        const maxBMI = 40;
        const position = ((bmi - minBMI) / (maxBMI - minBMI)) * 100;
        return Math.min(Math.max(position, 0), 100);
    };

    return (
        <div className="bmi-page">
            <div className="page-header">
                <div>
                    <h1>BMI Calculator</h1>
                    <p>Calculate your Body Mass Index and track your health</p>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                {/* Calculator Card */}
                <Col xs={24} lg={12}>
                    <Card className="calculator-card glass-card">
                        <div className="calculator-header">
                            <CalculatorOutlined className="calc-icon" />
                            <h3>Calculate Your BMI</h3>
                        </div>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={calculateBMI}
                            initialValues={{
                                height: user?.profile?.height || 170,
                                weight: user?.profile?.weight || 70,
                            }}
                        >
                            {/* Gender Selection */}
                            <div className="gender-selector">
                                <label className="field-label">Gender</label>
                                <Radio.Group
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="gender-buttons"
                                >
                                    <Radio.Button value="male">
                                        <ManOutlined /> Male
                                    </Radio.Button>
                                    <Radio.Button value="female">
                                        <WomanOutlined /> Female
                                    </Radio.Button>
                                </Radio.Group>
                            </div>

                            {/* Height Input */}
                            <Form.Item
                                name="height"
                                label="Height"
                                rules={[{ required: true, message: 'Please enter your height' }]}
                            >
                                <div className="slider-input-group">
                                    <Slider
                                        min={100}
                                        max={250}
                                        value={form.getFieldValue('height') || 170}
                                        onChange={(val) => form.setFieldsValue({ height: val })}
                                        className="custom-slider"
                                    />
                                    <InputNumber
                                        min={100}
                                        max={250}
                                        value={form.getFieldValue('height')}
                                        onChange={(val) => form.setFieldsValue({ height: val })}
                                        addonAfter="cm"
                                        className="slider-number-input"
                                    />
                                </div>
                            </Form.Item>

                            {/* Weight Input */}
                            <Form.Item
                                name="weight"
                                label="Weight"
                                rules={[{ required: true, message: 'Please enter your weight' }]}
                            >
                                <div className="slider-input-group">
                                    <Slider
                                        min={30}
                                        max={200}
                                        value={form.getFieldValue('weight') || 70}
                                        onChange={(val) => form.setFieldsValue({ weight: val })}
                                        className="custom-slider"
                                    />
                                    <InputNumber
                                        min={30}
                                        max={200}
                                        value={form.getFieldValue('weight')}
                                        onChange={(val) => form.setFieldsValue({ weight: val })}
                                        addonAfter="kg"
                                        className="slider-number-input"
                                    />
                                </div>
                            </Form.Item>

                            <div className="calculator-actions">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={calculating}
                                    block
                                    className="calculate-btn"
                                >
                                    Calculate BMI
                                </Button>
                            </div>
                        </Form>
                    </Card>
                </Col>

                {/* Results Card */}
                <Col xs={24} lg={12}>
                    <Card className="results-card glass-card">
                        {bmiResult ? (
                            <>
                                <div className="bmi-result-header">
                                    <h3>Your BMI Result</h3>
                                </div>

                                <div className="bmi-value-display">
                                    <div
                                        className="bmi-value"
                                        style={{ color: getBMIColor(bmiResult.bmi) }}
                                    >
                                        {bmiResult.bmi}
                                    </div>
                                    <div
                                        className="bmi-category"
                                        style={{ color: getBMIColor(bmiResult.bmi) }}
                                    >
                                        {bmiResult.category}
                                    </div>
                                </div>

                                {/* BMI Scale */}
                                <div className="bmi-scale">
                                    <div className="scale-bar">
                                        <div className="scale-section underweight">
                                            <span>Underweight</span>
                                            <span className="range">&lt;18.5</span>
                                        </div>
                                        <div className="scale-section normal">
                                            <span>Normal</span>
                                            <span className="range">18.5-24.9</span>
                                        </div>
                                        <div className="scale-section overweight">
                                            <span>Overweight</span>
                                            <span className="range">25-29.9</span>
                                        </div>
                                        <div className="scale-section obese">
                                            <span>Obese</span>
                                            <span className="range">&gt;30</span>
                                        </div>
                                    </div>
                                    <div
                                        className="scale-indicator"
                                        style={{
                                            left: `${getBMIPosition(bmiResult.bmi)}%`,
                                            backgroundColor: getBMIColor(bmiResult.bmi)
                                        }}
                                    />
                                </div>

                                {/* Info Section */}
                                <div className="bmi-info">
                                    <p className="info-description">
                                        {getBMIInfo(bmiResult.category).description}
                                    </p>

                                    <div className="healthy-range">
                                        <h4>Healthy Weight Range for Your Height</h4>
                                        <p>
                                            <strong>{bmiResult.healthyWeightRange.min}</strong> -
                                            <strong> {bmiResult.healthyWeightRange.max}</strong> kg
                                        </p>
                                    </div>

                                    <div className="tips-section">
                                        <h4>Recommendations</h4>
                                        <ul>
                                            {getBMIInfo(bmiResult.category).tips.map((tip, index) => (
                                                <li key={index}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <Button
                                    type="default"
                                    onClick={saveToProfile}
                                    block
                                    className="save-profile-btn"
                                >
                                    Save to My Profile
                                </Button>
                            </>
                        ) : (
                            <div className="no-result">
                                <div className="no-result-icon">📊</div>
                                <h3>Calculate Your BMI</h3>
                                <p>Enter your height and weight to see your Body Mass Index and health recommendations.</p>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Info Cards */}
            <Row gutter={[16, 16]} className="info-row">
                <Col xs={24} sm={12} md={6}>
                    <Card className="info-card glass-card underweight-card">
                        <div className="info-card-icon">🔵</div>
                        <h4>Underweight</h4>
                        <p>BMI less than 18.5</p>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card className="info-card glass-card normal-card">
                        <div className="info-card-icon">🟢</div>
                        <h4>Normal</h4>
                        <p>BMI 18.5 - 24.9</p>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card className="info-card glass-card overweight-card">
                        <div className="info-card-icon">🟠</div>
                        <h4>Overweight</h4>
                        <p>BMI 25 - 29.9</p>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card className="info-card glass-card obese-card">
                        <div className="info-card-icon">🔴</div>
                        <h4>Obese</h4>
                        <p>BMI 30 or greater</p>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default BMICalculator;
