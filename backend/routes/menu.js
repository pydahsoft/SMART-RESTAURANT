const express = require('express');
const router = express.Router();
const FoodItem = require('../models/FoodItem');

// Get all food items
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    
    const foodItems = await FoodItem.find(query)
      .sort({ category: 1, name: 1 });
    
    res.json(foodItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get food item by ID
router.get('/:id', async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);
    
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    
    res.json(foodItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new food item
router.post('/', async (req, res) => {
  try {
    const foodItem = new FoodItem(req.body);
    await foodItem.save();
    res.status(201).json(foodItem);
  } catch (error) {
    res.status(400).json({ message: 'Error adding food item', error: error.message });
  }
});

// Update food item
router.put('/:id', async (req, res) => {
  try {
    const foodItem = await FoodItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!foodItem) return res.status(404).json({ message: 'Food item not found' });
    res.json(foodItem);
  } catch (error) {
    res.status(400).json({ message: 'Error updating food item', error: error.message });
  }
});

// Delete food item
router.delete('/:id', async (req, res) => {
  try {
    const foodItem = await FoodItem.findByIdAndDelete(req.params.id);
    if (!foodItem) return res.status(404).json({ message: 'Food item not found' });
    res.json({ message: 'Food item deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting food item', error: error.message });
  }
});

module.exports = router;