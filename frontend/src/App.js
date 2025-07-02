import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Home from './pages/Home.js';
import Cart from './pages/Cart.js';
import Orders from './pages/Orders.jsx';
import { AuthProvider } from './context/AuthContext';
import OrderManagementPage from './pages/OrderManagementPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ChefDashboard from './pages/ChefDashboard.jsx';
import ServerDashboard from './pages/ServerDashboard.jsx';
import Accountance from './pages/Accountance.jsx';
import WaiterLogin from './pages/WaiterLogin.jsx';
import WaiterDashboard from './pages/WaiterDashboard.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import FoodManagement from './pages/FoodManagement.jsx';
import AccountanceOrderDetail from './pages/AccountanceOrderDetail.jsx';
import AccountanceReport from './pages/AccountanceReport.jsx';

// Create theme outside of component to avoid recreation on each render
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF6A28', // Primary orange
      light: '#FF6A28',
      dark: '#FF6A28',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E91E63', // Notification badge pink
      light: '#E91E63',
      dark: '#E91E63',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#F44336', // Add button red
      light: '#F44336',
      dark: '#F44336',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFA500', // Star rating yellow-orange
      light: '#FFA500',
      dark: '#FFA500',
      contrastText: '#000000',
    },
    info: {
      main: '#9E9E9E', // Light grey text/icons
      light: '#9E9E9E',
      dark: '#9E9E9E',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
      contrastText: '#ffffff',
    },
    grey: {
      50: '#F5F5F5', // Card/light section background
      100: '#F5F5F5',
      200: '#F5F5F5',
      300: '#F5F5F5',
      400: '#9E9E9E',
      500: '#9E9E9E',
      600: '#9E9E9E',
      700: '#9E9E9E',
      800: '#9E9E9E',
      900: '#000000', // Text black
      A100: '#F5F5F5',
      A200: '#F5F5F5',
      A400: '#9E9E9E',
      A700: '#9E9E9E',
    },
    text: {
      primary: '#000000', // Text black
      secondary: '#9E9E9E', // Light grey text/icons
      disabled: '#9E9E9E',
    },
    background: {
      default: '#FFFFFF', // Background white
      paper: '#F5F5F5', // Card/light section background
    },
    action: {
      active: '#FF6A28',
      hover: '#F5F5F5',
      selected: '#FFA500',
      disabled: '#9E9E9E',
      disabledBackground: '#F5F5F5',
    },
    divider: '#F5F5F5',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
  shape: {
    borderRadius: 4,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Wrapper component to conditionally render Navbar
const AppContent = () => {
  const location = useLocation();
  const isChefRoute = location.pathname === '/chef';
  const isWaiterRoute = location.pathname.startsWith('/waiter');
  const isAdminRoute = location.pathname === '/admin';
  const isAccountanceRoute = location.pathname === '/accountance';
  // Hide navbar for AccountanceOrderDetail page
  const isAccountanceOrderDetail = location.pathname.startsWith('/accountance/order/');

  return (
    <>
      {!isChefRoute && !isWaiterRoute && !isAdminRoute && !isAccountanceRoute && !isAccountanceOrderDetail && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/food-management" element={<FoodManagement />} />
        <Route path="/chef" element={<ChefDashboard />} />
        <Route path="/server" element={<ServerDashboard />} />
        <Route path="/order-management" element={<OrderManagementPage />} />
        <Route path="/accountance" element={<Accountance />} />
        <Route path="/waiter-login" element={<WaiterLogin />} />
        <Route
          path="/waiter-dashboard"
          element={
            <ProtectedRoute requiredRole="waiter">
              <WaiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/order/:id" element={<OrderDetail />} />
        <Route path="/accountance/order/:id" element={<AccountanceOrderDetail />} />
        <Route path="/accountance/report" element={<AccountanceReport />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </Router>
  );
};

export default App;


