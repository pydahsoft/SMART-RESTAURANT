import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Select, MenuItem, InputLabel, FormControl, Snackbar, Alert, Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { alpha } from '@mui/material/styles';
import { buildApiUrl } from '../utils/config';

// Color constants
const COLORS = {
  primaryOrange: '#FF6A28',
  red: '#F44336',
  white: '#FFFFFF',
  lightBg: '#F5F5F5',
  black: '#000000',
  yellow: '#FFA500',
  grey: '#9E9E9E',
  pink: '#E91E63',
  successGreen: '#4CAF50'
};

const API_ORDER = buildApiUrl('/orders/all-orders');
const API_COUPONS = buildApiUrl('/coupons');

const AccountanceOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [snackbar, setSnackbar] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await fetch(API_ORDER);
      const data = await res.json();
      const found = data.find(o => o._id === id || o.orderId === id);
      setOrder(found);
    };
    fetchOrder();
  }, [id]);

  useEffect(() => {
    fetch(API_COUPONS)
      .then(res => res.json())
      .then(couponsList => {
        setCoupons(couponsList);
        // Auto-apply best coupon if available
        if (order && couponsList.length > 0) {
          // Find all valid coupons for this order
          const validCoupons = couponsList.filter(c => c.isActive && (!c.minOrderAmount || order.totalAmount >= c.minOrderAmount));
          // Pick the coupon with the highest discount
          let bestCoupon = null;
          let maxDiscount = 0;
          validCoupons.forEach(coupon => {
            let discountValue = 0;
            if (coupon.discountType === 'percentage') {
              discountValue = (order.totalAmount * coupon.discountValue) / 100;
              if (coupon.maxDiscount) discountValue = Math.min(discountValue, coupon.maxDiscount);
            } else {
              discountValue = coupon.discountValue;
            }
            if (discountValue > maxDiscount) {
              maxDiscount = discountValue;
              bestCoupon = coupon;
            }
          });
          if (bestCoupon) {
            setSelectedCoupon(bestCoupon._id);
            setDiscount(maxDiscount);
            // Store discounted amount in DB if not already set
            const discountedAmount = Math.max(0, order.totalAmount - maxDiscount);
            if (order.discountedAmount !== discountedAmount) {
              fetch(buildApiUrl(`/orders/${order._id || order.orderId}/apply-coupon`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discountedAmount, appliedCoupon: bestCoupon.code })
              });
              setOrder({ ...order, discountedAmount, appliedCoupon: bestCoupon.code });
            }
          }
        }
      });
  }, [order]);

  if (!order) return <Typography sx={{ mt: 4, textAlign: 'center' }}>Loading order details...</Typography>;

  const finalTotal = Math.max(0, order.totalAmount - discount);

  return (
    <Box sx={{ background: COLORS.lightBg, minHeight: '100vh', width: '100vw', position: 'relative', p: 0, m: 0, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw', p: 0, m: 0 }}>
        {/* Sidebar (not sticky) */}
        <Box
          sx={{
            width: 260,
            minHeight: '100vh',
            background: COLORS.white,
            borderRadius: 0,
            boxShadow: '0 8px 32px 0 rgba(255,106,40,0.10)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            p: 3,
            position: 'static',
            top: 'unset',
            left: 'unset',
            zIndex: 1
          }}
        >
          {/* Back Button SVG and label */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, cursor: 'pointer', width: 'fit-content' }} onClick={() => navigate('/accountance')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#FF6A28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Typography sx={{ ml: 1, color: COLORS.primaryOrange, fontWeight: 700, fontSize: '1.05rem' }}>
              Back to Accountance
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.primaryOrange, mb: 4, mt: 1 }}>
            Accountance
          </Typography>
        </Box>
        {/* Main Content */}
        <Box sx={{ flex: 1, minHeight: '100vh', overflow: 'auto', p: 0, m: 0 }}>
          {/* Heading (not sticky) */}
          <Box sx={{
            position: 'static', // Not sticky, not relative
            top: 'unset',
            zIndex: 1,
            background: COLORS.white,
            pt: 4,
            pb: 2,
            px: 4,
            borderBottom: `1px solid ${alpha(COLORS.primaryOrange, 0.08)}`
          }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.primaryOrange, mb: 1 }}>
              Order Details
            </Typography>
            <Typography variant="body1" color={COLORS.grey}>
              View and manage order payment and coupon details
            </Typography>
          </Box>
          <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4, mb: 4 }}>
            <Paper elevation={0} sx={{
              p: 4,
              borderRadius: '18px',
              boxShadow: '0 8px 32px 0 rgba(255,106,40,0.10)',
              backgroundColor: COLORS.white,
              border: 'none',
              transition: 'box-shadow 0.3s',
              '&:hover': {
                boxShadow: '0 16px 40px 0 rgba(255,106,40,0.18)'
              }
            }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}><Typography><b style={{ color: COLORS.black }}>Order ID:</b> {order._id || order.orderId}</Typography></Grid>
                <Grid item xs={6}><Typography><b style={{ color: COLORS.black }}>Table Number:</b> {order.tableNumber}</Typography></Grid>
                <Grid item xs={6}><Typography><b style={{ color: COLORS.black }}>Order Time:</b> {new Date(order.createdAt).toLocaleString()}</Typography></Grid>
                <Grid item xs={6}><Typography><b style={{ color: COLORS.black }}>Payment Status:</b> {order.paymentStatus || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography><b style={{ color: COLORS.black }}>Payment Method:</b> {order.paymentMethod ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1) : 'N/A'}</Typography></Grid>
                <Grid item xs={12}><Typography><b style={{ color: COLORS.black }}>Sequence Number:</b> #{order.sequenceNumber ? String(order.sequenceNumber).padStart(3, '0') : 'N/A'}</Typography></Grid>
              </Grid>
              
              <Divider sx={{ my: 2, borderColor: COLORS.grey }} />
              
              {/* Payment Method Update Section */}
              {order.paymentStatus !== 'completed' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: COLORS.primaryOrange, mb: 1, fontWeight: 700 }}>Update Payment Method</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant={order.paymentMethod === 'cash' ? 'contained' : 'outlined'}
                      sx={{ 
                        minWidth: 100,
                        backgroundColor: order.paymentMethod === 'cash' ? COLORS.primaryOrange : 'transparent',
                        color: order.paymentMethod === 'cash' ? COLORS.white : COLORS.primaryOrange,
                        borderColor: COLORS.primaryOrange,
                        '&:hover': {
                          backgroundColor: alpha(COLORS.primaryOrange, 0.1)
                        }
                      }}
                      onClick={() => setOrder({ ...order, paymentMethod: 'cash' })}
                    >
                      Cash
                    </Button>
                    <Button
                      variant={order.paymentMethod === 'upi' ? 'contained' : 'outlined'}
                      sx={{ 
                        minWidth: 100,
                        backgroundColor: order.paymentMethod === 'upi' ? COLORS.primaryOrange : 'transparent',
                        color: order.paymentMethod === 'upi' ? COLORS.white : COLORS.primaryOrange,
                        borderColor: COLORS.primaryOrange,
                        '&:hover': {
                          backgroundColor: alpha(COLORS.primaryOrange, 0.1)
                        }
                      }}
                      onClick={() => setOrder({ ...order, paymentMethod: 'upi' })}
                    >
                      UPI
                    </Button>
                    <Button
                      variant={order.paymentMethod === 'card' ? 'contained' : 'outlined'}
                      sx={{ 
                        minWidth: 100,
                        backgroundColor: order.paymentMethod === 'card' ? COLORS.primaryOrange : 'transparent',
                        color: order.paymentMethod === 'card' ? COLORS.white : COLORS.primaryOrange,
                        borderColor: COLORS.primaryOrange,
                        '&:hover': {
                          backgroundColor: alpha(COLORS.primaryOrange, 0.1)
                        }
                      }}
                      onClick={() => setOrder({ ...order, paymentMethod: 'card' })}
                    >
                      Card
                    </Button>
                  </Box>
                  <Button
                    variant="contained"
                    sx={{
                      mt: 1,
                      backgroundColor: COLORS.successGreen,
                      borderRadius: '12px',
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      '&:hover': {
                        backgroundColor: alpha(COLORS.successGreen, 0.8)
                      }
                    }}
                    onClick={async () => {
                      // Update payment method and status in backend
                      await fetch(buildApiUrl(`/orders/${order._id || order.orderId}/payment`), {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentMethod: order.paymentMethod, paymentStatus: 'completed' })
                      });
                      // Refresh order
                      const res = await fetch(API_ORDER);
                      const data = await res.json();
                      const found = data.find(o => o._id === id || o.orderId === id);
                      setOrder(found);
                      setSnackbar('Payment updated successfully!');
                    }}
                  >
                    Pay Now
                  </Button>
                </Box>
              )}
              
              <Divider sx={{ my: 2, borderColor: COLORS.grey }} />
              
              <Typography variant="h6" sx={{ mb: 1, color: COLORS.primaryOrange, fontWeight: 700 }}>Items</Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 2, backgroundColor: COLORS.lightBg, boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(COLORS.primaryOrange, 0.1) }}>
                      <TableCell sx={{ fontWeight: 600, color: COLORS.black }}>Item Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: COLORS.black }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: COLORS.black }}>Item Price</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: COLORS.black }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(order.items || []).map((item, idx) => (
                      <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { backgroundColor: alpha(COLORS.primaryOrange, 0.05) } }}>
                        <TableCell sx={{ color: COLORS.black }}>{item.foodItem?.name || item.name}</TableCell>
                        <TableCell sx={{ color: COLORS.black }}>{item.quantity}</TableCell>
                        <TableCell sx={{ color: COLORS.black }}>₹{item.price}</TableCell>
                        <TableCell sx={{ color: COLORS.black }}>₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel sx={{ color: COLORS.black, fontWeight: 600 }}>Apply Coupon</InputLabel>
                  <Select
                    value={selectedCoupon}
                    label="Apply Coupon"
                    onChange={e => { setSelectedCoupon(e.target.value); setDiscount(0); }}
                    sx={{
                      borderRadius: '12px',
                      fontWeight: 600,
                      '& .MuiSelect-select': {
                        color: COLORS.black
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: COLORS.primaryOrange
                      }
                    }}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {coupons.filter(c => c.isActive).map(c => (
                      <MenuItem value={c._id} key={c._id} sx={{ color: COLORS.black }}>
                        {c.code} ({c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {discount > 0 && (
                <Typography sx={{ color: COLORS.successGreen, mb: 1, fontWeight: 700 }}>
                  Discount Applied: -₹{discount.toFixed(2)}
                </Typography>
              )}
              
              <Divider sx={{ my: 2, borderColor: COLORS.grey }} />
              
              <Typography variant="h6" sx={{
                textAlign: 'right',
                color: COLORS.primaryOrange,
                fontWeight: 700,
                fontSize: '1.5rem',
                letterSpacing: 1
              }}>
                Total Bill: ₹{finalTotal.toFixed(2)}
              </Typography>
            </Paper>
            <Snackbar
              open={!!snackbar}
              autoHideDuration={3000}
              onClose={() => setSnackbar('')}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert
                severity={snackbar === 'Coupon applied!' ? 'success' : 'warning'}
                sx={{ width: '100%', fontWeight: 600 }}
              >
                {snackbar}
              </Alert>
            </Snackbar>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AccountanceOrderDetail;