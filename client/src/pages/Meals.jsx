import { useState, useEffect } from 'react';
import {
    Card, Button, Modal, Form, Input, Select, InputNumber,
    Row, Col, Tag, Empty, Spin, Popconfirm, message, Tabs, DatePicker, Progress
} from 'antd';
import {
    PlusOutlined, DeleteOutlined, EditOutlined, HeartOutlined,
    ClockCircleOutlined, StarOutlined, StarFilled
} from '@ant-design/icons';
import { mealAPI } from '../services/api';
import dayjs from 'dayjs';
import './Meals.css';

const { Option } = Select;
const { TextArea } = Input;

const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🌅', color: '#f97316' },
    { value: 'lunch', label: 'Lunch', icon: '☀️', color: '#22c55e' },
    { value: 'dinner', label: 'Dinner', icon: '🌙', color: '#8b5cf6' },
    { value: 'snack', label: 'Snack', icon: '🍎', color: '#06b6d4' },
];

const Meals = () => {
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [form] = Form.useForm();

    const calorieGoal = 2000;
    const proteinGoal = 150;
    const carbsGoal = 250;
    const fatGoal = 65;

    useEffect(() => {
        fetchMeals();
    }, [selectedDate]);

    const fetchMeals = async () => {
        try {
            setLoading(true);
            const response = await mealAPI.getDaily(selectedDate.format('YYYY-MM-DD'));
            setMeals(response.data.data || []);
            setDailyTotals(response.data.dailyTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 });
        } catch (error) {
            // If no meals found, just set empty
            setMeals([]);
            setDailyTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);

            const mealData = {
                ...values,
                date: selectedDate.toDate(),
                foods: [
                    {
                        name: values.foodName,
                        quantity: values.quantity || 1,
                        unit: values.unit || 'serving',
                        calories: values.calories,
                        protein: values.protein,
                        carbs: values.carbs,
                        fat: values.fat,
                    }
                ]
            };

            if (editingMeal) {
                await mealAPI.update(editingMeal._id, mealData);
                message.success('Meal updated successfully!');
            } else {
                await mealAPI.create(mealData);
                message.success('Meal logged successfully! 🥗');
            }

            setModalVisible(false);
            form.resetFields();
            setEditingMeal(null);
            fetchMeals();
        } catch (error) {
            message.error('Failed to save meal');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (meal) => {
        setEditingMeal(meal);
        form.setFieldsValue({
            name: meal.name,
            type: meal.type,
            foodName: meal.foods?.[0]?.name || '',
            quantity: meal.foods?.[0]?.quantity || 1,
            unit: meal.foods?.[0]?.unit || 'serving',
            calories: meal.totalNutrition?.calories || 0,
            protein: meal.totalNutrition?.protein || 0,
            carbs: meal.totalNutrition?.carbs || 0,
            fat: meal.totalNutrition?.fat || 0,
            notes: meal.notes,
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await mealAPI.delete(id);
            message.success('Meal deleted');
            fetchMeals();
        } catch (error) {
            message.error('Failed to delete meal');
        }
    };

    const toggleFavorite = async (meal) => {
        try {
            await mealAPI.update(meal._id, { isFavorite: !meal.isFavorite });
            fetchMeals();
        } catch (error) {
            message.error('Failed to update favorite');
        }
    };

    const openNewMealModal = () => {
        setEditingMeal(null);
        form.resetFields();
        setModalVisible(true);
    };

    const getMealTypeInfo = (type) => {
        return mealTypes.find(t => t.value === type) || mealTypes[0];
    };

    return (
        <div className="meals-page">
            <div className="page-header">
                <div>
                    <h1>Meal Planner</h1>
                    <p>Track your nutrition and plan your meals</p>
                </div>
                <div className="header-actions">
                    <DatePicker
                        value={selectedDate}
                        onChange={(date) => setSelectedDate(date || dayjs())}
                        format="MMM D, YYYY"
                        allowClear={false}
                        size="large"
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openNewMealModal}
                        size="large"
                        className="add-btn"
                    >
                        Add Meal
                    </Button>
                </div>
            </div>

            {/* Daily Nutrition Summary */}
            <Card className="nutrition-summary glass-card">
                <div className="nutrition-header">
                    <h3>Daily Nutrition</h3>
                    <span className="date-label">{selectedDate.format('dddd, MMMM D')}</span>
                </div>
                <Row gutter={[24, 24]} className="nutrition-bars">
                    <Col xs={24} sm={12} md={6}>
                        <div className="nutrition-stat">
                            <div className="nutrition-stat-header">
                                <span className="stat-label">Calories</span>
                                <span className="stat-value">{dailyTotals.calories} / {calorieGoal}</span>
                            </div>
                            <Progress
                                percent={Math.min((dailyTotals.calories / calorieGoal) * 100, 100)}
                                showInfo={false}
                                strokeColor={{
                                    '0%': '#3b82f6',
                                    '100%': '#8b5cf6',
                                }}
                                trailColor="rgba(255,255,255,0.1)"
                            />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div className="nutrition-stat">
                            <div className="nutrition-stat-header">
                                <span className="stat-label">Protein</span>
                                <span className="stat-value">{dailyTotals.protein}g / {proteinGoal}g</span>
                            </div>
                            <Progress
                                percent={Math.min((dailyTotals.protein / proteinGoal) * 100, 100)}
                                showInfo={false}
                                strokeColor="#22c55e"
                                trailColor="rgba(255,255,255,0.1)"
                            />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div className="nutrition-stat">
                            <div className="nutrition-stat-header">
                                <span className="stat-label">Carbs</span>
                                <span className="stat-value">{dailyTotals.carbs}g / {carbsGoal}g</span>
                            </div>
                            <Progress
                                percent={Math.min((dailyTotals.carbs / carbsGoal) * 100, 100)}
                                showInfo={false}
                                strokeColor="#f97316"
                                trailColor="rgba(255,255,255,0.1)"
                            />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div className="nutrition-stat">
                            <div className="nutrition-stat-header">
                                <span className="stat-label">Fat</span>
                                <span className="stat-value">{dailyTotals.fat}g / {fatGoal}g</span>
                            </div>
                            <Progress
                                percent={Math.min((dailyTotals.fat / fatGoal) * 100, 100)}
                                showInfo={false}
                                strokeColor="#ec4899"
                                trailColor="rgba(255,255,255,0.1)"
                            />
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Meals by Type */}
            <div className="meals-content">
                {loading ? (
                    <div className="loading-container">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Row gutter={[16, 16]}>
                        {mealTypes.map(mealType => {
                            const typeMeals = meals.filter(m => m.type === mealType.value);
                            return (
                                <Col xs={24} sm={12} lg={6} key={mealType.value}>
                                    <Card
                                        className="meal-type-card glass-card"
                                        title={
                                            <div className="meal-type-header">
                                                <span className="meal-type-icon">{mealType.icon}</span>
                                                <span>{mealType.label}</span>
                                            </div>
                                        }
                                    >
                                        {typeMeals.length === 0 ? (
                                            <div className="no-meals">
                                                <p>No {mealType.label.toLowerCase()} logged</p>
                                                <Button
                                                    type="dashed"
                                                    icon={<PlusOutlined />}
                                                    onClick={() => {
                                                        form.setFieldsValue({ type: mealType.value });
                                                        setModalVisible(true);
                                                    }}
                                                    block
                                                >
                                                    Add {mealType.label}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="meal-items">
                                                {typeMeals.map(meal => (
                                                    <div key={meal._id} className="meal-item">
                                                        <div className="meal-item-header">
                                                            <h4>{meal.name}</h4>
                                                            <div className="meal-item-actions">
                                                                <Button
                                                                    type="text"
                                                                    icon={meal.isFavorite ? <StarFilled style={{ color: '#eab308' }} /> : <StarOutlined />}
                                                                    size="small"
                                                                    onClick={() => toggleFavorite(meal)}
                                                                />
                                                                <Button
                                                                    type="text"
                                                                    icon={<EditOutlined />}
                                                                    size="small"
                                                                    onClick={() => handleEdit(meal)}
                                                                />
                                                                <Popconfirm
                                                                    title="Delete this meal?"
                                                                    onConfirm={() => handleDelete(meal._id)}
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
                                                        <div className="meal-item-nutrition">
                                                            <span>{meal.totalNutrition?.calories || 0} kcal</span>
                                                            <span>P: {meal.totalNutrition?.protein || 0}g</span>
                                                            <span>C: {meal.totalNutrition?.carbs || 0}g</span>
                                                            <span>F: {meal.totalNutrition?.fat || 0}g</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                title={editingMeal ? 'Edit Meal' : 'Log New Meal'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingMeal(null);
                }}
                footer={null}
                width={600}
                className="meal-modal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        type: 'breakfast',
                        quantity: 1,
                        unit: 'serving',
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Meal Name"
                                rules={[{ required: true, message: 'Please enter meal name' }]}
                            >
                                <Input placeholder="e.g., Oatmeal with Berries" size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label="Meal Type"
                                rules={[{ required: true }]}
                            >
                                <Select size="large">
                                    {mealTypes.map(type => (
                                        <Option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="foodName"
                        label="Main Food Item"
                    >
                        <Input placeholder="e.g., Oatmeal" size="large" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="quantity"
                                label="Quantity"
                            >
                                <InputNumber min={0.1} step={0.5} size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item
                                name="unit"
                                label="Unit"
                            >
                                <Select size="large">
                                    <Option value="serving">Serving</Option>
                                    <Option value="g">Grams</Option>
                                    <Option value="ml">Milliliters</Option>
                                    <Option value="cup">Cup</Option>
                                    <Option value="piece">Piece</Option>
                                    <Option value="oz">Ounces</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="nutrition-inputs-header">
                        <h4>Nutritional Information</h4>
                    </div>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item name="calories" label="Calories">
                                <InputNumber min={0} max={5000} size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="protein" label="Protein (g)">
                                <InputNumber min={0} max={500} size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="carbs" label="Carbs (g)">
                                <InputNumber min={0} max={500} size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="fat" label="Fat (g)">
                                <InputNumber min={0} max={500} size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="notes" label="Notes (optional)">
                        <TextArea rows={2} placeholder="Any additional notes about this meal" />
                    </Form.Item>

                    <div className="modal-actions">
                        <Button onClick={() => setModalVisible(false)}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {editingMeal ? 'Update Meal' : 'Log Meal'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default Meals;
