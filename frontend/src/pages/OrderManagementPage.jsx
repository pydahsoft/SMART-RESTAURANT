import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const OrderManagementPage = () => {
  // State for orders and loading status
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Status categories with colors
  const statusCategories = [
    { id: 'pending', title: 'New Orders', color: '#fef3c7', textColor: '#92400e' },
    { id: 'accepted', title: 'Accepted', color: '#e0f2fe', textColor: '#0369a1' },
    { id: 'preparing', title: 'In Kitchen', color: '#dbeafe', textColor: '#1e40af' },
    { id: 'ready', title: 'Ready', color: '#dcfce7', textColor: '#166534' },
    { id: 'delivered', title: 'Completed', color: '#f3e8ff', textColor: '#6b21a8' },
    { id: 'rejected', title: 'Rejected', color: '#fecaca', textColor: '#b91c1c' },
    { id: 'cancelled', title: 'Cancelled', color: '#fee2e2', textColor: '#991b1b' },
  ];

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/orders/all-orders');

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      
      // Update the orders state with the new status
      setOrders(orders.map(order => 
        order.orderId === updatedOrder.orderId ? updatedOrder : order
      ));
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    }
  };

  // Format date to readable time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Order card component
  const OrderCard = ({ order }) => {
    const [expanded, setExpanded] = useState(false);
    const statusCategory = statusCategories.find(c => c.id === order.status);

    return (
      <Card 
        sx={{ 
          mb: 2,
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 3
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                Order #{order._id.slice(-6)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Table {order.tableNumber} • {formatTime(order.createdAt)}
              </Typography>
            </Box>
            <Chip
              label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              sx={{
                backgroundColor: statusCategory.color,
                color: statusCategory.textColor,
                fontWeight: 'medium'
              }}
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              <strong>{order.userName}</strong> • {order.userPhone}
            </Typography>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
              ${order.totalAmount.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton 
              onClick={() => setExpanded(!expanded)}
              size="small"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Change Status</InputLabel>
              <Select
                value=""
                label="Change Status"
                onChange={(e) => {
                  if (e.target.value) {
                    updateOrderStatus(order.orderId, e.target.value);
                    setExpanded(false);
                  }
                }}
              >
                {statusCategories
                  .filter(cat => cat.id !== order.status)
                  .map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      Mark as {option.title}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>

          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
              Order Items:
            </Typography>
            <List dense>
              {order.items.map((item, idx) => (
                <ListItem key={idx} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={`${item.quantity}x ${item.foodItem.name}`}
                    secondary={item.specialRequest ? `Note: ${item.specialRequest}` : null}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    ${(item.foodItem.price * item.quantity).toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  // Main render
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error: {error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 'bold' }}>
          Order Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          View and manage all customer orders
        </Typography>

        <Grid container spacing={3}>
          {statusCategories.map((category) => (
            <Grid item xs={12} md={4} key={category.id}>
              <Paper 
                elevation={2}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box 
                  sx={{ 
                    p: 2,
                    backgroundColor: category.color,
                    color: category.textColor,
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {category.title}
                  </Typography>
                  <Chip
                    label={orders.filter(o => o.status === category.id).length}
                    size="small"
                    sx={{ 
                      backgroundColor: 'white',
                      color: 'text.primary'
                    }}
                  />
                </Box>
                <Box sx={{ p: 2, flexGrow: 1 }}>
                  {orders.filter(order => order.status === category.id).length > 0 ? (
                    orders
                      .filter(order => order.status === category.id)
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map((order) => (
                        <OrderCard key={order._id} order={order} />
                      ))
                  ) : (
                    <Box sx={{ 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary'
                    }}>
                      No {category.title.toLowerCase()} orders
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default OrderManagementPage;