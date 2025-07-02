import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  TableRestaurant as TableIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Money as MoneyIcon,
  Print as PrintIcon,
  Room as RoomIcon,
  LocalDining as DiningIcon,
  Payment as PaymentIcon,
  LocalShipping as LocalShippingIcon,
  Sms as SmsIcon,
  Restaurant as RestaurantIcon,
  DoneAll as DoneAllIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { PALETTE } from '../themePalette';

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

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/public/${id}`, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }

        const data = await response.json();
        if (data.success) {
          setOrder(data.order);
        } else {
          throw new Error(data.message || 'Failed to fetch order details');
        }
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const handlePayment = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${id}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: selectedPaymentMethod,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment update failed');
      }

      const data = await response.json();
      setOrder(data);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentDialogOpen(false);
        setPaymentSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimelineSteps = () => {
    if (!order) return [];
    
    const steps = [];

    // Add initial order creation step
    steps.push({
      status: 'created',
      message: 'Order has been placed',
      timestamp: order.createdAt
    });

    // Add steps from comments
    if (order.comments && Array.isArray(order.comments)) {
      const commentSteps = order.comments
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(comment => ({
          status: comment.status || 'update',
          message: comment.text,
          timestamp: comment.timestamp,
          icon: comment.status === 'preparing' ? DiningIcon :
                comment.status === 'delivered' ? TableIcon :
                comment.status === 'cancelled' ? MoneyIcon :
                comment.status === 'sms sent' ? SmsIcon :
                TimeIcon
        }));
      steps.push(...commentSteps);
    }

    // Add payment step if payment is completed
    if (order.paymentStatus === 'completed') {
      steps.push({
        status: 'payment_completed',
        message: `Payment completed via ${order.paymentMethod}`,
        timestamp: order.updatedAt || new Date().toISOString(),
        icon: MoneyIcon
      });
    }

    return steps.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: PALETTE.card
      }}>
        <Typography>Loading order details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: PALETTE.card
      }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: PALETTE.card
      }}>
        <Typography>Order not found</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ 
      py: 4,
      backgroundColor: PALETTE.card,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        backgroundColor: PALETTE.background,
        p: 2,
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${PALETTE.cocoaBrown}`
      }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2, color: PALETTE.cocoaBrown }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flex: 1, color: PALETTE.cocoaBrown, fontWeight: 600 }}>
          Order Details
        </Typography>
        <IconButton onClick={() => window.print()} sx={{ ml: 2, color: PALETTE.cocoaBrown }}>
          <PrintIcon />
        </IconButton>
      </Box>

      {/* Order Summary Card */}
      <Card sx={{ 
        mb: 4,
        backgroundColor: PALETTE.background,
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${PALETTE.cocoaBrown}`
      }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptIcon sx={{ mr: 1, color: PALETTE.cocoaBrown }} />
                <Typography variant="subtitle1">
                  Order #{order.sequenceNumber ? String(order.sequenceNumber).padStart(3, '0') : order._id.substring(0, 8)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TableIcon sx={{ mr: 1, color: PALETTE.cocoaBrown }} />
                <Typography variant="subtitle1">Table {order.tableNumber}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimeIcon sx={{ mr: 1, color: PALETTE.cocoaBrown }} />
                <Typography variant="subtitle1">{formatDate(order.createdAt)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon sx={{ mr: 1, color: PALETTE.cocoaBrown }} />
                {order.status?.toLowerCase() === 'delivered' && order.discountedAmount ? (
                  <>
                    <Typography variant="subtitle1" sx={{ textDecoration: 'line-through', color: '#888', fontSize: '1em', mr: 1 }}>
                      ₹{order.totalAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: '#388e3c', fontWeight: 700 }}>
                      ₹{order.discountedAmount.toFixed(2)}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="subtitle1">₹{order.totalAmount.toFixed(2)}</Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Order Status Timeline */}
      <Paper sx={{ 
        p: 3, 
        mb: 4,
        backgroundColor: PALETTE.background,
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${PALETTE.cocoaBrown}`
      }}>
        <Typography variant="h6" sx={{ mb: 3, color: PALETTE.cocoaBrown, fontWeight: 600 }}>Order Timeline</Typography>
        <Stepper orientation="vertical" activeStep={getTimelineSteps().length}>
          {getTimelineSteps().map((step, index) => (
            <Step key={index} completed={true}>
              <StepLabel
                optional={
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(step.timestamp)}
                  </Typography>
                }
                StepIconProps={{
                  sx: {
                    color: step.status === 'delivered' ? PALETTE.seafoamMint :
                          step.status === 'cancelled' ? 'error.main' :
                          step.status === 'preparing' ? PALETTE.mangoYellow : PALETTE.cocoaBrown
                  }
                }}
              >
                <Typography variant="body1" sx={{ color: PALETTE.cocoaBrown, fontWeight: 500 }}>
                  {step.status.charAt(0).toUpperCase() + step.status.slice(1).replace('_', ' ')}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {step.message}
                </Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Order Items */}
      <Paper sx={{ 
        p: 3, 
        mb: 4,
        backgroundColor: PALETTE.background,
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${PALETTE.cocoaBrown}`
      }}>
        <Typography variant="h6" sx={{ mb: 3, color: PALETTE.cocoaBrown, fontWeight: 600 }}>Order Items</Typography>
        <Box sx={{ width: '100%' }}>
          {order.items.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2,
                borderBottom: index < order.items.length - 1 ? 1 : 0,
                borderColor: PALETTE.grey
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DiningIcon sx={{ mr: 2, color: PALETTE.cocoaBrown }} />
                <Box>
                  <Typography variant="body1">{item.foodItem?.name || item.name || 'Unknown Item'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {item.quantity}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: PALETTE.cocoaBrown }}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Typography variant="h6" sx={{ color: PALETTE.cocoaBrown }}>Total Amount</Typography>
          {order.status?.toLowerCase() === 'delivered' && order.discountedAmount ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography variant="h6" sx={{ textDecoration: 'line-through', color: '#888', fontWeight: 400 }}>
                ₹{order.totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="h6" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                ₹{order.discountedAmount.toFixed(2)}
              </Typography>
              {order.appliedCoupon && (
                <Typography variant="body2" sx={{ color: '#009688', fontWeight: 500 }}>
                  Coupon Applied: {order.appliedCoupon}
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="h6" sx={{ color: PALETTE.cocoaBrown, fontWeight: 'bold' }}>
              ₹{order.totalAmount.toFixed(2)}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Payment Details with Action Button */}
      <Paper sx={{ 
        p: 3,
        backgroundColor: PALETTE.background,
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${PALETTE.cocoaBrown}`
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ color: PALETTE.cocoaBrown, fontWeight: 600 }}>Payment Details</Typography>
          {order?.paymentStatus === 'pending' && (
            <Button
              variant="contained"
              sx={{
                backgroundColor: PALETTE.cocoaBrown,
                '&:hover': {
                  backgroundColor: '#3E2822',
                }
              }}
              startIcon={<PaymentIcon />}
              onClick={() => setPaymentDialogOpen(true)}
            >
              Make Payment
            </Button>
          )}
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MoneyIcon sx={{ mr: 1, color: PALETTE.cocoaBrown }} />
              <Typography variant="body1">
                Payment Method: {order?.paymentMethod || 'Not specified'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ReceiptIcon sx={{ mr: 1, color: PALETTE.cocoaBrown }} />
              <Typography variant="body1">
                Payment Status: 
                <Chip 
                  label={order?.paymentStatus}
                  size="small"
                  sx={{ 
                    ml: 1,
                    backgroundColor: order?.paymentStatus === 'completed' ? PALETTE.seafoamMint : PALETTE.mangoYellow,
                    color: PALETTE.cocoaBrown,
                    fontWeight: 500
                  }}
                />
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => {
          setPaymentDialogOpen(false);
          setPaymentError(null);
          setPaymentSuccess(false);
        }}
        PaperProps={{
          sx: {
            backgroundColor: PALETTE.coconutWhite,
            borderRadius: '12px',
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ color: PALETTE.cocoaBrown, fontWeight: 600 }}>Select Payment Method</DialogTitle>
        <DialogContent>
          {paymentError && (
            <Alert severity="error" sx={{ mb: 2 }}>{paymentError}</Alert>
          )}
          {paymentSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>Payment successful!</Alert>
          )}
          <Box sx={{
            background: '#fffde7',
            borderRadius: '8px',
            p: 2,
            mb: 2,
            textAlign: 'center',
            border: '1px solid #ffe082'
          }}>
            <Typography variant="subtitle2" sx={{ color: '#888', mb: 0.5 }}>
              Order #{order?._id?.slice(-6)}
            </Typography>
            {order?.status?.toLowerCase() === 'delivered' && order?.discountedAmount ? (
              <>
                <Typography variant="h4" sx={{ textDecoration: 'line-through', color: '#888', fontWeight: 400, display: 'inline', mr: 1 }}>
                  ₹{order.totalAmount.toFixed(2)}
                </Typography>
                <Typography variant="h4" sx={{ color: '#388e3c', fontWeight: 700, display: 'inline', ml: 1 }}>
                  ₹{order.discountedAmount.toFixed(2)}
                </Typography>
                {order.appliedCoupon && (
                  <Typography variant="body2" sx={{ color: '#009688', fontWeight: 500, mt: 1 }}>
                    Coupon Applied: {order.appliedCoupon}
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="h4" sx={{ color: PALETTE.cocoaBrown, fontWeight: 700 }}>
                ₹{order?.totalAmount?.toFixed(2)}
              </Typography>
            )}
          </Box>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ color: PALETTE.cocoaBrown, mb: 2 }}>Payment Method</FormLabel>
            <RadioGroup
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            >
              <FormControlLabel 
                value="cash" 
                control={<Radio sx={{ color: PALETTE.cocoaBrown }} />} 
                label="Cash" 
                sx={{ mb: 1 }}
              />
              <FormControlLabel 
                value="upi" 
                control={<Radio sx={{ color: PALETTE.cocoaBrown }} />} 
                label="UPI" 
                sx={{ mb: 1 }}
              />
              <FormControlLabel 
                value="card" 
                control={<Radio sx={{ color: PALETTE.cocoaBrown }} />} 
                label="Card" 
                sx={{ mb: 1 }}
              />
            </RadioGroup>
          </FormControl>
          <Typography variant="h6" sx={{ mt: 2, color: PALETTE.cocoaBrown, fontWeight: 600 }}>
            Total Amount: {order.status?.toLowerCase() === 'delivered' && order.discountedAmount ? (
              <>
                <span style={{ textDecoration: 'line-through', color: '#888', marginRight: 8 }}>
                  ₹{order.totalAmount.toFixed(2)}
                </span>
                <span style={{ color: '#388e3c', fontWeight: 700 }}>
                  ₹{order.discountedAmount.toFixed(2)}
                </span>
                {order.appliedCoupon && (
                  <span style={{ color: '#009688', fontWeight: 500, marginLeft: 8 }}>
                    (Coupon: {order.appliedCoupon})
                  </span>
                )}
              </>
            ) : (
              <>₹{order.totalAmount.toFixed(2)}</>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPaymentDialogOpen(false)}
            sx={{ color: PALETTE.cocoaBrown }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            variant="contained" 
            disabled={paymentSuccess}
            sx={{
              backgroundColor: PALETTE.cocoaBrown,
              '&:hover': {
                backgroundColor: '#3E2822',
              },
              '&:disabled': {
                backgroundColor: PALETTE.cocoaBrownLight
              }
            }}
          >
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderDetail;