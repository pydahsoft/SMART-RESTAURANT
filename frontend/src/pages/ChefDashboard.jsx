import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  Button,
  Divider,
  Grid,
  Stack
} from '@mui/material';
import {
  Print as PrintIcon,
  AccessTime as AccessTimeIcon,
  TableBar as TableBarIcon
} from '@mui/icons-material';
import { PALETTE } from '../themePalette';
import { buildApiUrl } from '../utils/config';

// Printable Order Component
const PrintableOrder = ({ order }) => {
  if (!order) return null;

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="print-only" style={{ display: 'none', padding: '20px' }}>
      <Box sx={{ maxWidth: '300px', margin: 'auto' }}>
        <Typography variant="h6" gutterBottom align="center">
          Order #{order.orderId.slice(-6)}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            Table: {order.tableNumber}
          </Typography>
          <Typography variant="body2">
            Time: {formatTime(order.createdAt)}
          </Typography>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" gutterBottom>
          Order Items:
        </Typography>
        {order.items.map((item, idx) => (
          <Box 
            key={idx} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mb: 1
            }}
          >
            <Typography variant="body2">
              {item.quantity}x {item.name}
            </Typography>
            <Typography variant="body2">
              ${(item.price * item.quantity).toFixed(2)}
            </Typography>
          </Box>
        ))}

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Typography variant="subtitle2">Total:</Typography>
          <Typography variant="subtitle2">
            ${order.totalAmount.toFixed(2)}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" align="center">
            Status: {order.status.toUpperCase()}
          </Typography>
        </Box>
      </Box>
    </div>
  );
};

const ChefDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);

  useEffect(() => {
    fetchOrders();
    // Poll every 5 seconds for new accepted orders for more responsive updates
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Add print styles to document head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-only, .print-only * {
          visibility: visible !important;
          display: block !important;
        }
        .print-only {
          position: absolute;
          left: 0;
          top: 0;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(buildApiUrl('/orders/all-orders'));
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      // Filter to show preparing and ready orders
      const chefOrders = data
        .filter(order => order.status === 'preparing' || order.status === 'ready')
        .sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === 'preparing' ? -1 : 1;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      setOrders(chefOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handlePrint = (order) => {
    setSelectedOrderForPrint(order);
    setTimeout(() => {
      window.print();
      setSelectedOrderForPrint(null);
    }, 100);
  };

  const startPreparing = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(buildApiUrl(`/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'preparing',
          comment: 'Chef has started preparing the order'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      setOrders(orders.map(order => 
        order.orderId === updatedOrder.orderId ? updatedOrder : order
      ));

    } catch (error) {
      console.error('Error starting preparation:', error);
    }
  };

  const markAsReady = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(buildApiUrl(`/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'ready',
          comment: 'Order is ready for pickup'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order status');
      }

      const updatedOrder = await response.json();
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? { ...order, status: 'ready' }
            : order
        )
      );

    } catch (error) {
      console.error('Error marking as ready:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="h6">Error: {error}</Typography>
      </Box>
    );
  }
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
        Kitchen Orders
      </Typography>

      {error && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography color="error" variant="body1">
            {error}
          </Typography>
        </Box>
      )}

      {selectedOrderForPrint && <PrintableOrder order={selectedOrderForPrint} />}

      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
          <Typography variant="h6">No orders in preparation</Typography>
          <Typography variant="body2">New orders will appear here when accepted by servers</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} sm={6} md={4} key={order.orderId || order._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">
                      Order #{(order.orderId || order._id).slice(-6)}
                    </Typography>
                    <IconButton 
                      color="primary"
                      onClick={() => handlePrint(order)}
                    >
                      <PrintIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TableBarIcon color="primary" />
                    <Typography>Table {order.tableNumber}</Typography>
                    <AccessTimeIcon sx={{ ml: 2 }} fontSize="small" />
                    <Typography variant="body2">
                      {formatTime(order.createdAt)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Order Items:
                    </Typography>
                    {order.items.map((item, idx) => (
                      <Box 
                        key={idx} 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1
                        }}
                      >
                        <Typography variant="body1">
                          {item.quantity}x {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mt: 'auto'
                  }}>
                    <Chip
                      label={order.status.toUpperCase()}
                      color={order.status === 'ready' ? 'success' : 'primary'}
                      sx={{ fontWeight: 500 }}
                    />
                    <Typography variant="h6" color="primary">
                      Total: ${order.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>

                  {order.status === 'preparing' && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => markAsReady(order.orderId || order._id)}
                        fullWidth
                        sx={{
                          py: 1,
                          fontWeight: 500
                        }}
                      >
                        MARK AS READY
                      </Button>
                    </Box>
                  )}

                  {order.status === 'ready' && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        color="success"
                        disabled
                        fullWidth
                        sx={{
                          py: 1,
                          fontWeight: 500,
                          opacity: 0.7
                        }}
                      >
                        ✓ READY FOR SERVICE
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ChefDashboard;

// Replace color values in sx and style props with PALETTE values
// Example changes below:
// color: '#ff7900' => color: PALETTE.primary
// bgcolor: 'white' => bgcolor: PALETTE.background
// borderColor: 'divider' => borderColor: PALETTE.grey
// color: 'error.light' => color: PALETTE.addButton
// color: 'text.primary' => color: PALETTE.text
// color: 'text.secondary' => color: PALETTE.grey
// backgroundColor: '#F5F5F5' => backgroundColor: PALETTE.card
// color: '#FFA500' => color: PALETTE.star
// color: '#E91E63' => color: PALETTE.badge
// ...apply this pattern throughout the file...