# TestCafe - Food Ordering Platform

A full-stack food ordering platform built with React, Node.js, Express, and MongoDB.

## Features

- Browse food items by categories
- Add items to cart
- Guest mode support
- Phone number-based authentication
- Order placement and tracking
- Order history

## Tech Stack

### Frontend
- React.js
- Material-UI
- React Router
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd testcafe
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
```

4. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

5. Start the backend server:
```bash
# From the root directory
npm run dev
```

6. Start the frontend development server:
```bash
# From the client directory
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## API Endpoints

### Authentication
- POST /api/auth/phone-auth - Register/Login with phone number

### Menu
- GET /api/menu - Get all food items
- GET /api/menu/:id - Get food item by ID

### Orders
- POST /api/orders - Create new order
- GET /api/orders/my-orders - Get user's orders
- GET /api/orders/:orderId - Get order by ID

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 