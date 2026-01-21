const mongoose = require('mongoose');

const FoodItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    unit: {
        type: String,
        enum: ['g', 'ml', 'oz', 'cup', 'piece', 'serving'],
        default: 'serving'
    },
    calories: {
        type: Number,
        default: 0
    },
    protein: {
        type: Number,
        default: 0 // in grams
    },
    carbs: {
        type: Number,
        default: 0 // in grams
    },
    fat: {
        type: Number,
        default: 0 // in grams
    },
    fiber: {
        type: Number,
        default: 0 // in grams
    },
    sugar: {
        type: Number,
        default: 0 // in grams
    }
});

const MealSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please add a meal name'],
        trim: true
    },
    type: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        required: true
    },
    foods: [FoodItemSchema],
    totalNutrition: {
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 },
        sugar: { type: Number, default: 0 }
    },
    date: {
        type: Date,
        default: Date.now
    },
    time: String,
    notes: String,
    isFavorite: {
        type: Boolean,
        default: false
    },
    imageUrl: String
}, {
    timestamps: true
});

// Calculate total nutrition before saving
MealSchema.pre('save', function (next) {
    if (this.foods && this.foods.length > 0) {
        this.totalNutrition = this.foods.reduce((total, food) => {
            return {
                calories: total.calories + (food.calories || 0),
                protein: total.protein + (food.protein || 0),
                carbs: total.carbs + (food.carbs || 0),
                fat: total.fat + (food.fat || 0),
                fiber: total.fiber + (food.fiber || 0),
                sugar: total.sugar + (food.sugar || 0)
            };
        }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 });
    }
    next();
});

module.exports = mongoose.model('Meal', MealSchema);
