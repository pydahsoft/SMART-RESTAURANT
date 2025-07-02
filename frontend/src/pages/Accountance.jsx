import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  keyframes,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Payments as PaymentsIcon,
  AccountBalanceWallet as WalletIcon,
  CalendarToday as CalendarIcon,
  CreditCard as UpiIcon,
  Money as CashIcon,
  ArrowBack as ArrowBackIcon,
  TableRestaurant as TableRestaurantIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import Divider from '@mui/material/Divider';
import { PALETTE } from '../themePalette';

// Animation
const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const StatCard = ({ title, value, icon, color = PALETTE.primary }) => (
  <Card sx={{
    height: '100%',
    minHeight: '120px',
    border: '1px solid',
    borderColor: PALETTE.card,
    borderRadius: '16px',
    background: PALETTE.card,
    boxShadow: '0 4px 12px rgba(255, 121, 0, 0.05)',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 12px 24px rgba(255, 121, 0, 0.1)',
      borderColor: `${color}30`
    }
  }}>
    <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: color, fontSize: '0.875rem', letterSpacing: '0.5px' }}>
          {title.toUpperCase()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${color}12`, borderRadius: '10px', p: 1, width: 36, height: 36 }}>
          {React.cloneElement(icon, { sx: { fontSize: '1.25rem', color: color } })}
        </Box>
      </Box>
      <Typography variant="h5" sx={{ color: color, fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.2 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const SIDEBAR_OPTIONS = [
  { label: 'Orders', value: 'orders' },
  { label: 'Accountance', value: 'statistics' },
  { label: 'End of the Day Report', value: 'report' }
];

const FILTERS = [
  { label: 'Today', value: 'day' },
  { label: 'This Month', value: 'month' }
];

const Accountance = () => {
  const navigate = useNavigate();
  const [sidebarTab, setSidebarTab] = useState('orders');
  const [orderFilter, setOrderFilter] = useState('day');
  const [statsFilter, setStatsFilter] = useState('day');
  const [allOrders, setAllOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAccountanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/orders/all-orders');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const validOrders = data.map(order => ({
          ...order,
          _id: order._id || order.orderId,
          orderId: order._id || order.orderId,
          createdAt: order.createdAt || new Date().toISOString(),
          status: order.status || 'pending',
          totalAmount: typeof order.totalAmount === 'number' ? 
            order.totalAmount : parseFloat(order.totalAmount) || 0,
          paymentMethod: order.paymentMethod?.toLowerCase() || 'cash'
        }));
        
        setAllOrders(validOrders);
        calculateFilteredStats(validOrders, orderFilter);
      } else {
        console.error('Invalid orders data:', data);
        setAllOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setAllOrders([]);
      setError('Failed to fetch orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountanceData();
    // Removed setInterval to prevent reloads
    // const interval = setInterval(fetchAccountanceData, 30000);
    // return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    calculateFilteredStats(allOrders, orderFilter);
  }, [orderFilter, allOrders]);

  const isDateInRange = (dateStr) => {
    if (!dateStr) return false;
    
    try {
      const orderDate = new Date(dateStr);
      const now = new Date();
      
      if (isNaN(orderDate.getTime())) return false;
      
      const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (orderFilter) {
        case 'day':
          return orderDay.getTime() === today.getTime();
        case 'week': {
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          return orderDay >= weekAgo && orderDay <= today;
        }
        case 'month': {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          return orderDay >= monthStart && orderDay <= today;
        }
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking date range:', error);
      return false;
    }
  };

  const calculateFilteredStats = (orders, filter) => {
    try {
      const validOrders = orders.filter(order => order && order.createdAt && isDateInRange(order.createdAt));
      
      const pendingOrders = validOrders.filter(order => 
        order.status === 'pending' || order.status === 'preparing'
      );
      
      const completedOrders = validOrders.filter(order => 
        order.status === 'delivered' || order.status === 'completed'
      );
      
      const totalAmount = validOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      const cashOrders = validOrders.filter(order => 
        order.paymentMethod?.toLowerCase() === 'cash'
      );
      
      const upiOrders = validOrders.filter(order => 
        order.paymentMethod?.toLowerCase() === 'upi'
      );
      
      const cashAmount = cashOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const upiAmount = upiOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handlePrintBill = (orderId) => {
    try {
      const orderData = allOrders.find(order => order._id === orderId);
      
      if (!orderData) {
        console.error('Order not found:', orderId);
        alert('Order not found');
        return;
      }

      const printWindow = window.open('', '_blank');
      const itemRows = orderData.items?.map(item => `
        <tr>
          <td>${item.foodItem?.name || item.name || 'Unknown Item'}</td>
          <td>${item.quantity || 0}</td>
          <td>₹${item.price.toFixed(2)}</td>
          <td>₹${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
        </tr>
      `).join('') || '';

      const invoiceHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice #${orderData._id || orderData.orderId || orderData.id}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                color: #111;
                background: #fff;
                line-height: 1.4;
              }
              .invoice-container {
                width: 320px;
                margin: 0 auto;
                padding: 16px 12px;
                background: #fff;
                border: 1px solid #222;
                border-radius: 6px;
              }
              .invoice-header {
                text-align: center;
                margin-bottom: 16px;
                padding-bottom: 10px;
                border-bottom: 1px solid #222;
              }
              .bill-details {
                margin-bottom: 10px;
                font-size: 13px;
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 6px;
                color: #111;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                background: #fff;
                font-size: 13px;
              }
              th, td {
                padding: 6px 4px;
                border-bottom: 1px solid #222;
                text-align: left;
                color: #111;
              }
              th {
                background-color: #f5f5f5;
                font-weight: 600;
                color: #111;
              }
              .total-section {
                margin-top: 10px;
                text-align: right;
                padding-top: 10px;
                border-top: 1px solid #222;
                color: #111;
                font-size: 13px;
              }
              .restaurant-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 4px;
                color: #111;
              }
              .footer {
                margin-top: 16px;
                text-align: center;
                font-size: 12px;
                color: #111;
                padding-top: 8px;
                border-top: 1px solid #222;
              }
              @media print {
                body { margin: 0; background: #fff; color: #111; }
                .no-print { display: none; }
                .invoice-container { box-shadow: none; border: none; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="invoice-header">
                <div class="restaurant-name">Urban Cafe</div>
                <div>Bill No: ${orderData._id || orderData.orderId || orderData.id}</div>
                <div>Order No: ${orderData.sequenceNumber ? String(orderData.sequenceNumber).padStart(3, '0') : 'N/A'}</div>
                <div>Tax Invoice</div>
              </div>
              <div class="bill-details">
                <div><strong>Date:</strong> ${new Date(orderData.createdAt).toLocaleString()}</div>
                <div><strong>Table No:</strong> ${orderData.tableNumber || 'N/A'}</div>
                <div><strong>Payment Method:</strong> ${orderData.paymentMethod || 'N/A'}</div>
                ${orderData.waiter ? `<div><strong>Server:</strong> ${typeof orderData.waiter === 'object' ? orderData.waiter.name : orderData.waiter}</div>` : ''}
                <div><strong>Order Status:</strong> ${orderData.status}</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
              <div class="total-section">
                <div><strong>Total Amount:</strong> ₹${(orderData.totalAmount || 0).toFixed(2)}</div>
                ${orderData.discountedAmount && orderData.discountedAmount < orderData.totalAmount ? `
                  <div><strong>Coupon Discount:</strong> -₹${(orderData.totalAmount - orderData.discountedAmount).toFixed(2)}</div>
                  <div><strong>Final Amount:</strong> ₹${orderData.discountedAmount.toFixed(2)}</div>
                  ${orderData.appliedCoupon ? `<div><strong>Coupon Applied:</strong> ${orderData.appliedCoupon}</div>` : ''}
                ` : ''}
              </div>
              <div class="footer">
                <p>Thank you for dining with us!</p>
                <p>Visit us again!</p>
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error('Error printing bill:', error);
      alert('Failed to print bill. Please try again.');
    }
  };

  const handleOrderClick = (orderId, event) => {
    if (event?.target?.closest('button')) return;
    if (!orderId) return;
    try {
      navigate(`/accountance/order/${orderId}`);
    } catch (error) {
      console.error('Error navigating to order detail:', error);
      setError('Failed to open order details. Please try again.');
    }
  };

  const RecentOrders = ({ orders, dateFilter, isDateInRange, handleOrderClick, handlePrintBill }) => {
    const filteredOrders = orders
      .filter(order => isDateInRange(order.createdAt))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
      <Paper elevation={0} sx={{ 
        p: 3, 
        borderRadius: '20px', 
        mt: 4, 
        background: PALETTE.card,
        border: `1px solid ${PALETTE.primary}22`,
        boxShadow: '0 8px 24px rgba(255, 121, 0, 0.05)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          borderBottom: `1px solid ${PALETTE.primary}22`,
          pb: 2
        }}>
          <Typography variant="h6" sx={{ 
            color: PALETTE.primary,
            fontWeight: 600,
            fontSize: '1.25rem'
          }}>
            Recent Orders
          </Typography>
          <Typography variant="subtitle2" sx={{ 
            color: PALETTE.primary,
            opacity: 0.8,
            fontWeight: 500
          }}>
            {dateFilter === 'day' ? 'Today' : 
             dateFilter === 'week' ? 'This Week' : 
             dateFilter === 'month' ? 'This Month' : 
             'All Time'} • {filteredOrders.length} orders
          </Typography>
        </Box>
        
        {filteredOrders.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '200px',
            flexDirection: 'column',
            gap: 2
          }}>
            <WalletIcon sx={{ 
              fontSize: '3rem', 
              color: PALETTE.primary,
              opacity: 0.5
            }} />
            <Typography variant="body1" sx={{ 
              color: PALETTE.primary,
              opacity: 0.7,
              textAlign: 'center'
            }}>
              {orders.length === 0 ? 'No orders found' : 'No orders for selected period'}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} elevation={0} sx={{
              borderRadius: '16px',
              border: `1px solid ${PALETTE.primary}22`,
              background: PALETTE.card
            }}>
              <Table sx={{ minWidth: 650 }} aria-label="orders table">
                <TableHead sx={{ background: PALETTE.primary }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: PALETTE.primary }}>Order ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: PALETTE.primary }}>Table</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: PALETTE.primary }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: PALETTE.primary }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: PALETTE.primary }}>Payment</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: PALETTE.primary }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: PALETTE.primary }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow 
                      key={order._id || order.orderId}
                      hover
                      onClick={(event) => handleOrderClick(order._id || order.orderId, event)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': { backgroundColor: PALETTE.primary }
                      }}
                    >
                      <TableCell component="th" scope="row">
                        #{order.sequenceNumber ? String(order.sequenceNumber).padStart(3, '0') : (order._id ? order._id.toString().slice(-6) : 'N/A')}
                      </TableCell>
                      <TableCell>{order.tableNumber || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: order.status === 'delivered' ? PALETTE.primary : 
                                  order.status === 'pending' ? PALETTE.primary : PALETTE.primary
                          }}
                        >
                          {order.status}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            textTransform: 'capitalize',
                            color: PALETTE.primary
                          }}
                        >
                          {order.paymentMethod || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: PALETTE.primary }}>
                        ₹{(order.discountedAmount && order.discountedAmount < order.totalAmount
                          ? order.discountedAmount
                          : order.totalAmount
                        ).toFixed(2)}
                        {order.discountedAmount && order.discountedAmount < order.totalAmount && (
                          <Typography variant="caption" sx={{ color: PALETTE.primary, display: 'block', fontWeight: 500 }}>
                            (Coupon Applied)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintBill(order._id || order.orderId);
                          }}
                          sx={{ 
                            color: PALETTE.primary,
                            background: PALETTE.card,
                            '&:hover': {
                              backgroundColor: PALETTE.primary,
                              color: PALETTE.white
                            }
                          }}
                          title="Print Bill"
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Total Amount Row */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              mt: 2,
              pr: 2
            }}>
              <Typography variant="h6" sx={{ color: PALETTE.primary, fontWeight: 700 }}>
                Total: ₹{filteredOrders.reduce((sum, order) => sum + (order.discountedAmount && order.discountedAmount < order.totalAmount ? order.discountedAmount : order.totalAmount || 0), 0).toFixed(2)}
              </Typography>
              {filteredOrders.some(order => order.discountedAmount && order.discountedAmount < order.totalAmount) && (
                <Typography variant="body2" sx={{ color: PALETTE.primary, fontWeight: 500 }}>
                  (Total after coupon discounts)
                </Typography>
              )}
            </Box>
          </>
        )}
      </Paper>
    );
  };

  // Sidebar
  const Sidebar = () => (
    <Box sx={{
      position: 'sticky',
      top: 0,
      height: '100vh',
      minWidth: 240,
      maxWidth: 280,
      background: PALETTE.card,
      borderRadius: '18px',
      border: `1px solid ${PALETTE.primary}22`,
      boxShadow: '0 2px 8px 0 rgba(255,106,40,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      p: 3,
      zIndex: 20
    }}>
      {/* Back Button for Admin Navigation */}
      <IconButton
        onClick={() => navigate('/admin')}
        sx={{
          alignSelf: 'flex-start',
          mb: 2,
          color: PALETTE.primary,
          background: PALETTE.card,
          border: `1px solid ${PALETTE.primary}22`,
          borderRadius: '8px',
          p: 1.2,
          '&:hover': {
            backgroundColor: PALETTE.primary,
            color: PALETTE.white
          }
        }}
        title="Back to Admin"
      >
        <ArrowBackIcon sx={{ mr: 1 }} />
        <Typography variant="button" sx={{ fontWeight: 600, fontSize: '1rem', ml: 0.5 }}>
          Back to Admin
        </Typography>
      </IconButton>
      {/* Sidebar options */}
      {SIDEBAR_OPTIONS.map(opt => (
        <Button
          key={opt.value}
          onClick={() => {
            if (opt.value === 'report') navigate('/accountance/report');
            else setSidebarTab(opt.value);
          }}
          variant={sidebarTab === opt.value ? 'contained' : 'outlined'}
          sx={{
            mb: 2,
            color: sidebarTab === opt.value ? PALETTE.white : PALETTE.primary,
            background: sidebarTab === opt.value ? PALETTE.primary : 'transparent',
            borderColor: PALETTE.primary,
            fontWeight: 700,
            borderRadius: '10px',
            px: 2,
            py: 1.2,
            '&:hover': { background: sidebarTab === opt.value ? PALETTE.primary : PALETTE.card }
          }}
          fullWidth
        >
          {opt.label}
        </Button>
      ))}
    </Box>
  );

  // Sticky header
  const StickyHeader = () => (
    <Box sx={{
      position: 'sticky',
      top: 0,
      zIndex: 15,
      background: PALETTE.card,
      borderRadius: '0 0 16px 16px',
      borderBottom: `1px solid ${PALETTE.primary}22`,
      boxShadow: '0 4px 12px rgba(255, 106, 40, 0.05)',
      p: 3,
    }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: PALETTE.primary, lineHeight: 1.2, mb: 0.5 }}>
        Accountance
      </Typography>
    </Box>
  );

  // Orders filtered by orderFilter
  const filteredOrders = allOrders.filter(order => {
    if (!order.createdAt) return false;
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (orderFilter === 'day') {
      return orderDate.getFullYear() === today.getFullYear() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getDate() === today.getDate();
    }
    if (orderFilter === 'month') {
      return orderDate.getFullYear() === today.getFullYear() &&
        orderDate.getMonth() === today.getMonth();
    }
    return true;
  });

  // Stats filtered by statsFilter
  const filteredStats = (() => {
    const filter = statsFilter;
    const now = new Date();
    return allOrders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (filter === 'day') {
        return orderDate.getFullYear() === today.getFullYear() &&
          orderDate.getMonth() === today.getMonth() &&
          orderDate.getDate() === today.getDate();
      }
      if (filter === 'month') {
        return orderDate.getFullYear() === today.getFullYear() &&
          orderDate.getMonth() === today.getMonth();
      }
      return true;
    });
  })();

  // Statistics calculation for filteredStats
  const getStats = (orders) => {
    const validOrders = orders;
    const pendingOrders = validOrders.filter(order => order.status === 'pending' || order.status === 'preparing');
    const completedOrders = validOrders.filter(order => order.status === 'delivered' || order.status === 'completed');
    const totalAmount = validOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const cashOrders = validOrders.filter(order => order.paymentMethod?.toLowerCase() === 'cash');
    const upiOrders = validOrders.filter(order => order.paymentMethod?.toLowerCase() === 'upi');
    const cashAmount = cashOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const upiAmount = upiOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    return {
      totalOrders: validOrders.length,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      totalAmount,
      cashOrders: cashOrders.length,
      upiOrders: upiOrders.length,
      cashAmount,
      upiAmount
    };
  };

  const stats = getStats(filteredStats);

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', background: PALETTE.background, overflow: 'hidden' }}>
      {/* Sidebar: sticky and fit to window height */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        minWidth: 240,
        maxWidth: 280,
        background: PALETTE.card,
        borderRadius: '18px',
        border: `1px solid ${PALETTE.primary}22`,
        boxShadow: '0 2px 8px 0 rgba(255,106,40,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 3,
        zIndex: 20
      }}>
        {/* Back Button for Admin Navigation */}
        <IconButton
          onClick={() => navigate('/admin')}
          sx={{
            alignSelf: 'flex-start',
            mb: 2,
            color: PALETTE.primary,
            background: PALETTE.card,
            border: `1px solid ${PALETTE.primary}22`,
            borderRadius: '8px',
            p: 1.2,
            '&:hover': {
              backgroundColor: PALETTE.primary,
              color: PALETTE.white
            }
          }}
          title="Back to Admin"
        >
          <ArrowBackIcon sx={{ mr: 1 }} />
          <Typography variant="button" sx={{ fontWeight: 600, fontSize: '1rem', ml: 0.5 }}>
            Back to Admin
          </Typography>
        </IconButton>
        {/* Sidebar options */}
        {SIDEBAR_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            onClick={() => {
              if (opt.value === 'report') navigate('/accountance/report');
              else setSidebarTab(opt.value);
            }}
            variant={sidebarTab === opt.value ? 'contained' : 'outlined'}
            sx={{
              mb: 2,
              color: sidebarTab === opt.value ? PALETTE.white : PALETTE.primary,
              background: sidebarTab === opt.value ? PALETTE.primary : 'transparent',
              borderColor: PALETTE.primary,
              fontWeight: 700,
              borderRadius: '10px',
              px: 2,
              py: 1.2,
              '&:hover': { background: sidebarTab === opt.value ? PALETTE.primary : PALETTE.card }
            }}
            fullWidth
          >
            {opt.label}
          </Button>
        ))}
      </Box>
      {/* Main Content */}
      <Box sx={{ flex: 1, minWidth: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Sticky Header - no extra margin below */}
        <Box sx={{
          position: 'sticky',
          top: 0,
          zIndex: 15,
          background: PALETTE.card,
          borderRadius: '0 0 16px 16px',
          borderBottom: `1px solid ${PALETTE.primary}22`,
          boxShadow: '0 4px 12px rgba(255, 106, 40, 0.05)',
          p: 3,
        }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: PALETTE.primary, lineHeight: 1.2 }}>
            Accountance
          </Typography>
        </Box>
        {/* Main content by sidebarTab, with scrollable list area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', px: 4, pt: 2 }}>
          {sidebarTab === 'orders' && (
            <>
              {/* Inline heading and filters, admin dashboard style */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: PALETTE.primary, mr: 2, mb: 0 }}>
                  Recent Orders
                </Typography>
                {FILTERS.map(f => (
                  <Button
                    key={f.value}
                    variant={orderFilter === f.value ? 'contained' : 'outlined'}
                    onClick={() => setOrderFilter(f.value)}
                    sx={{
                      color: orderFilter === f.value ? PALETTE.white : PALETTE.primary,
                      background: orderFilter === f.value ? PALETTE.primary : 'transparent',
                      borderColor: PALETTE.primary,
                      fontWeight: 600,
                      borderRadius: '10px',
                      px: 2,
                      py: 1.2,
                      '&:hover': { background: orderFilter === f.value ? PALETTE.primary : PALETTE.card }
                    }}
                  >
                    {f.label}
                  </Button>
                ))}
              </Box>
              {/* Scrollable orders list area, no extra section heading */}
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <RecentOrders orders={filteredOrders} dateFilter={orderFilter} isDateInRange={() => true} handleOrderClick={handleOrderClick} handlePrintBill={handlePrintBill} />
              </Box>
            </>
          )}
          {sidebarTab === 'statistics' && (
            <>
              {/* Inline heading and filters, admin dashboard style */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: PALETTE.primary, mr: 2, mb: 0 }}>
                  Statistics
                </Typography>
                {FILTERS.map(f => (
                  <Button
                    key={f.value}
                    variant={statsFilter === f.value ? 'contained' : 'outlined'}
                    onClick={() => setStatsFilter(f.value)}
                    sx={{
                      color: statsFilter === f.value ? PALETTE.white : PALETTE.primary,
                      background: statsFilter === f.value ? PALETTE.primary : 'transparent',
                      borderColor: PALETTE.primary,
                      fontWeight: 600,
                      borderRadius: '10px',
                      px: 2,
                      py: 1.2,
                      '&:hover': { background: statsFilter === f.value ? PALETTE.primary : PALETTE.card }
                    }}
                  >
                    {f.label}
                  </Button>
                ))}
              </Box>
              {/* Scrollable statistics area, no extra section heading */}
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6} lg={3}>
                    <StatCard title="Total Orders" value={stats.totalOrders} icon={<TableRestaurantIcon />} />
                  </Grid>
                  <Grid item xs={12} md={6} lg={3}>
                    <StatCard title="Pending Orders" value={stats.pendingOrders} icon={<CalendarIcon />} color={PALETTE.primary} />
                  </Grid>
                  <Grid item xs={12} md={6} lg={3}>
                    <StatCard title="Completed Orders" value={stats.completedOrders} icon={<PaymentsIcon />} color={PALETTE.primary} />
                  </Grid>
                  <Grid item xs={12} md={6} lg={3}>
                    <StatCard title="Total Revenue" value={formatCurrency(stats.totalAmount)} icon={<WalletIcon />} />
                  </Grid>
                </Grid>
                <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: '16px', background: PALETTE.card, border: `1px solid ${PALETTE.primary}22` }}>
                  <Typography variant="h6" sx={{ mb: 3, color: PALETTE.primary, fontWeight: 600 }}>
                    Payment Methods
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <StatCard title="Cash Payments" value={`${stats.cashOrders} (${formatCurrency(stats.cashAmount)})`} icon={<CashIcon />} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <StatCard title="UPI Payments" value={`${stats.upiOrders} (${formatCurrency(stats.upiAmount)})`} icon={<UpiIcon />} />
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Accountance;