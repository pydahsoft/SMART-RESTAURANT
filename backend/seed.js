const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const FoodItem = require('./models/FoodItem');

const MONGODB_URI = process.env.MONGODB_URI;

const foodItems = [
  {
    name: 'Classic Burger',
    description: 'Juicy beef patty with fresh lettuce, tomatoes, and special sauce',
    price: 9.99,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
    isAvailable: true
  },
  {
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce, parmesan cheese, croutons, and Caesar dressing',
    price: 7.99,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500',
    isAvailable: true
  },
  {
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, tomatoes, and basil on a crispy crust',
    price: 12.99,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500',
    isAvailable: true
  },
  {
    name: 'Chocolate Brownie',
    description: 'Rich chocolate brownie served with vanilla ice cream',
    price: 6.99,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    isAvailable: true
  },
  {
    name: 'Mozzarella Sticks',
    description: 'Crispy breaded mozzarella sticks with marinara sauce',
    price: 5.99,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=500',
    isAvailable: true
  },
  {
    name: 'Fresh Lemonade',
    description: 'Freshly squeezed lemonade with mint',
    price: 3.99,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500',
    isAvailable: true
  },
  {
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with creamy sauce and pancetta',
    price: 13.99,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500',
    isAvailable: true
  },
  {
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee-soaked ladyfingers',
    price: 7.99,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500',
    isAvailable: true
  },
  {
    name: 'Iced Coffee',
    description: 'Cold-brewed coffee served over ice',
    price: 4.99,
    category: 'Beverages',
    image: 'https://tse3.mm.bing.net/th?id=OIP.W8RkcPOBCxP_u0gOZZicvQHaEJ&pid=Api&P=0&h=180',
    isAvailable: true
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await FoodItem.deleteMany({});
    console.log('Cleared existing food items');

    const result = await FoodItem.insertMany(foodItems);
    console.log(`Added ${result.length} food items to the database`);

    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
