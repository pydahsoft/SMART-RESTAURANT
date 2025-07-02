import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  useTheme,
  Button,
  keyframes
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  TableRestaurant as TableRestaurantIcon,
  AccessTime as AccessTimeIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import WaiterManagement from '../components/WaiterManagement';
import FoodManagement from './FoodManagement';
import CouponManagement from './CouponManagement';
import { PALETTE } from '../themePalette';
import { buildApiUrl } from '../utils/config';

// Animation keyframes
const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const OrderCard = ({ order, isBlinking }) => {
  const theme = useTheme();
  
  if (!order) return null;

  const getStatusColor = (status) => {
    const colors = {
      pending: PALETTE.primary,
      accepted: PALETTE.primary,
      preparing: PALETTE.primary,
      ready: PALETTE.primary,
      delivered: PALETTE.primary,
      cancelled: PALETTE.primary
    };
    return colors[status?.toLowerCase()] || PALETTE.primary;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const orderId = order.sequenceNumber ? String(order.sequenceNumber).padStart(3, '0') : (order._id ? order._id.toString().slice(-6) : 'N/A');
  const status = order.status || 'pending';
  const paymentStatus = order.paymentStatus || 'pending';
  const paymentMethod = order.paymentMethod || 'N/A';
  const totalAmount = order.totalAmount || 0;
  const tableNumber = order.tableNumber || 'N/A';
  const statusColor = getStatusColor(status);

  // Card colors using only the specified palette
  const cardColors = [PALETTE.primary, PALETTE.primary];
  const cardColor = cardColors[parseInt(orderId, 16) % cardColors.length];

  return (
    <Card 
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: '12px',
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha(cardColor, 0.2)}, ${alpha(cardColor, 0.3)})`
          : `linear-gradient(135deg, ${alpha(PALETTE.card, 0.1)}, ${alpha(PALETTE.card, 0.2)})`,
        transition: 'all 0.3s ease-in-out',
        border: 'none',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`,
          animation: `${floatAnimation} 3s ease-in-out infinite`
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              px: 2,
              py: 0.5,
              borderRadius: '8px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.mode === 'dark' ? PALETTE.background : PALETTE.text
                }}
              >
                #{orderId}
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: theme.palette.mode === 'dark' ? PALETTE.background : PALETTE.grey
            }}>
              <AccessTimeIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {formatTime(order.createdAt)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            p: 2,
            borderRadius: '8px',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)'
          }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: PALETTE.primary,
              color: 'white'
            }}>
              <TableRestaurantIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="body2" color={theme.palette.mode === 'dark' ? PALETTE.background : PALETTE.grey} gutterBottom>
                Table Number
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.mode === 'dark' ? PALETTE.background : PALETTE.text }}>
                {tableNumber}
              </Typography>
            </Box>
          </Box>

          {/* Status/Payment Chips neatly aligned and wrapped */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            minHeight: 32,
            mb: 0.5,
            px: 0.5
          }}>
            <Chip
              label={status.toUpperCase()}
              sx={{
                bgcolor: alpha(statusColor, 0.2),
                color: statusColor,
                fontWeight: 600,
                px: 1,
                '& .MuiChip-label': {
                  px: 1.5
                },
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            />
            <Chip
              size="small"
              label={
                paymentStatus === 'completed' 
                  ? `Paid with ${paymentMethod.toUpperCase()}`
                  : 'PAYMENT PENDING'
              }
              sx={{ 
                fontWeight: 500,
                bgcolor: paymentStatus === 'completed' ? alpha(PALETTE.primary, 0.2) : alpha(PALETTE.addButton, 0.2),
                color: paymentStatus === 'completed' ? PALETTE.primary : PALETTE.addButton,
                '& .MuiChip-label': {
                  px: 1.5
                },
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            />
          </Box>

          <Box sx={{ 
            p: 2,
            borderRadius: '8px',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)'
          }}>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color={theme.palette.mode === 'dark' ? PALETTE.background : PALETTE.grey}>
                  Payment Status
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: paymentStatus === 'completed' ? PALETTE.primary : PALETTE.addButton
                }}>
                  {paymentStatus === 'completed' 
                    ? `Paid with ${paymentMethod}` 
                    : 'Payment Pending'}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pt: 1.5,
                borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
              }}>
                <Box>
                  <Typography variant="body2" color={theme.palette.mode === 'dark' ? PALETTE.background : PALETTE.grey}>
                    Total Amount
                  </Typography>
                  <Typography variant="body2" color={theme.palette.mode === 'dark' ? PALETTE.background : PALETTE.grey}>
                    Coupon Discount
                  </Typography>
                  <Typography variant="body2" color={theme.palette.mode === 'dark' ? PALETTE.background : PALETTE.grey}>
                    Final Amount
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: PALETTE.text }}>
                    ₹{totalAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: PALETTE.text }}>
                    -₹{order.discountedAmount && order.discountedAmount < totalAmount ? (totalAmount - order.discountedAmount).toFixed(2) : '0.00'}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: PALETTE.text }}>
                    ₹{order.discountedAmount && order.discountedAmount < totalAmount ? order.discountedAmount.toFixed(2) : totalAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const StatsCard = ({ icon: Icon, title, value, color, small }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '12px',
        minWidth: small ? 140 : 200,
        minHeight: small ? 70 : 90,
        maxWidth: small ? 160 : 260,
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha(color, 0.2)}, ${alpha(color, 0.3)})`
          : `linear-gradient(135deg, ${alpha(PALETTE.card, 0.1)}, ${alpha(PALETTE.card, 0.2)})`,
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: `0 10px 15px -1px ${alpha(color, 0.2)}`
        },
        display: 'flex',
        alignItems: 'center',
        px: small ? 1.5 : 2,
        py: small ? 1 : 2
      }}
    >
      <CardContent sx={{ p: small ? 1.5 : 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: small ? 32 : 40,
            height: small ? 32 : 40,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: color,
            color: 'white',
            mr: 1.5
          }}
        >
          <Icon sx={{ fontSize: small ? 16 : 20 }} />
        </Box>
        <Box>
          <Typography variant="body2" color={theme.palette.mode === 'dark' ? PALETTE.background : PALETTE.grey} gutterBottom sx={{ fontSize: small ? '0.95rem' : '1rem' }}>
            {title}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.mode === 'dark' ? PALETTE.background : PALETTE.text, fontSize: small ? '1.15rem' : '1.5rem' }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Sidebar options with SVGs
const SIDEBAR_OPTIONS = [
  {
    label: 'Orders',
    value: 'orders',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="18" height="14" rx="3" fill={PALETTE.primary} fillOpacity="0.12"/>
        <rect x="3" y="5" width="18" height="14" rx="3" stroke={PALETTE.primary} strokeWidth="2"/>
        <rect x="7" y="9" width="10" height="2" rx="1" fill={PALETTE.primary}/>
        <rect x="7" y="13" width="6" height="2" rx="1" fill={PALETTE.primary}/>
      </svg>
    )
  },
  {
    label: 'Waiter Management',
    value: 'waiters',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="4" fill={PALETTE.primary} fillOpacity="0.12"/>
        <circle cx="12" cy="8" r="4" stroke={PALETTE.primary} strokeWidth="2"/>
        <rect x="6" y="15" width="12" height="5" rx="2.5" fill={PALETTE.primary} fillOpacity="0.12"/>
        <rect x="6" y="15" width="12" height="5" rx="2.5" stroke={PALETTE.primary} strokeWidth="2"/>
      </svg>
    )
  },
  {
    label: 'Food Management',
    value: 'food',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="12" cy="8" rx="7" ry="3" fill={PALETTE.primary} fillOpacity="0.12"/>
        <ellipse cx="12" cy="8" rx="7" ry="3" stroke={PALETTE.primary} strokeWidth="2"/>
        <path d="M5 8v4c0 1.66 3.13 3 7 3s7-1.34 7-3V8" stroke={PALETTE.primary} strokeWidth="2"/>
        <path d="M5 12v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" stroke={PALETTE.primary} strokeWidth="2"/>
      </svg>
    )
  },
  {
    label: 'Coupon Management',
    value: 'coupons',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="7" width="18" height="10" rx="3" fill={PALETTE.primary} fillOpacity="0.12"/>
        <rect x="3" y="7" width="18" height="10" rx="3" stroke={PALETTE.primary} strokeWidth="2"/>
        <circle cx="8" cy="12" r="2" fill={PALETTE.primary}/>
        <circle cx="16" cy="12" r="2" fill={PALETTE.primary}/>
      </svg>
    )
  }
];

const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [dateFilter, setDateFilter] = useState('day');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonthDate, setSelectedMonthDate] = useState(null); // For calendar date selection
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const handleSidebarChange = (value) => {
    setActiveTab(value);
  };

  const handleAccountanceClick = () => {
    navigate('/accountance');
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(buildApiUrl('/orders/all-orders'));
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
            totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(order.totalAmount) || 0,
            paymentMethod: order.paymentMethod?.toLowerCase() || 'cash'
          }));
          setOrders(validOrders);
          setFilteredOrders(validOrders);
        } else {
          setOrders([]);
          setFilteredOrders([]);
        }
      } catch (err) {
        setError(err.message);
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    // Removed setInterval to prevent reloads
    // const interval = setInterval(fetchOrders, 30000);
    // return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filterOrders = () => {
      let filteredData = orders.filter(order => {
        if (!order.createdAt) return false;
        const orderDateObj = new Date(order.createdAt);
        const orderDay = new Date(orderDateObj.getFullYear(), orderDateObj.getMonth(), orderDateObj.getDate());
        if (dateFilter === 'month') {
          // Use calendarMonth/calendarYear for month view
          return (
            orderDay.getMonth() === calendarMonth &&
            orderDay.getFullYear() === calendarYear
          );
        }
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        switch (dateFilter) {
          case 'day': {
            return orderDay.getTime() === today.getTime();
          }
          case 'week': {
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 6);
            return orderDay >= weekAgo && orderDay <= today;
          }
          default:
            return true;
        }
      });
      // If month filter and a date is selected, filter further
      if (dateFilter === 'month' && selectedMonthDate) {
        filteredData = filteredData.filter(order => {
          const orderDateObj = new Date(order.createdAt);
          return (
            orderDateObj.getFullYear() === selectedMonthDate.getFullYear() &&
            orderDateObj.getMonth() === selectedMonthDate.getMonth() &&
            orderDateObj.getDate() === selectedMonthDate.getDate()
          );
        });
      }
      setFilteredOrders(filteredData);
    };
    filterOrders();
  }, [orders, dateFilter, selectedMonthDate, calendarMonth, calendarYear]);

  const getFilteredStats = () => {
    return {
      total: filteredOrders.length,
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      completed: filteredOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length
    };
  };

  const stats = getFilteredStats();

  useEffect(() => {
    if (highlightedOrderId) {
      const t = setTimeout(() => setHighlightedOrderId(null), 2000);
      return () => clearTimeout(t);
    }
  }, [highlightedOrderId]);

  if (loading) return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '100vh',
      background: PALETTE.background
    }}>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: PALETTE.primary,
          animation: `${floatAnimation} 2s ease-in-out infinite`
        }}
      />
    </Box>
  );

  if (error) return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      mt: 4,
      p: 3,
      borderRadius: '12px',
      background: PALETTE.background,
      border: `1px solid ${PALETTE.primary}`
    }}>
      <Typography color={PALETTE.primary} sx={{ fontWeight: 600 }}>
        {error}
      </Typography>
    </Box>
  );

  // Calendar component for month/year view
  const CalendarSidebar = ({ selectedDate, onSelectDate }) => {
    const now = new Date();
    const year = calendarYear;
    const month = calendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
    // Build calendar grid
    const weeks = [];
    let week = [];
    let dayNum = 1 - startDay;
    for (let i = 0; i < 6; i++) { // up to 6 weeks
      week = [];
      for (let j = 0; j < 7; j++, dayNum++) {
        if (dayNum < 1 || dayNum > daysInMonth) {
          week.push(null);
        } else {
          week.push(new Date(year, month, dayNum));
        }
      }
      weeks.push(week);
    }
    // Orders per day for highlighting
    const ordersByDay = {};
    orders.forEach(order => {
      const d = new Date(order.createdAt);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const key = d.getDate();
        ordersByDay[key] = (ordersByDay[key] || 0) + 1;
      }
    });
    // Month/year dropdowns
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const yearOptions = [];
    for (let y = now.getFullYear() - 5; y <= now.getFullYear() + 2; y++) {
      yearOptions.push(y);
    }
    return (
      <Box sx={{
        width: '100%',
        minWidth: 200,
        maxWidth: 320,
        background: PALETTE.card,
        borderRadius: '18px',
        boxShadow: '0 8px 32px 0 rgba(255,106,40,0.10)',
        p: 3,
        position: 'sticky',
        top: 24,
        zIndex: 10,
        height: 'fit-content',
        mb: 2
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
          <select
            value={calendarMonth}
            onChange={e => {
              setCalendarMonth(Number(e.target.value));
              setSelectedMonthDate(null);
            }}
            style={{ fontWeight: 700, fontSize: 16, borderRadius: 8, border: `1px solid ${PALETTE.primary}`, color: PALETTE.primary, background: 'white', padding: '2px 8px' }}
          >
            {monthNames.map((m, idx) => (
              <option value={idx} key={m}>{m}</option>
            ))}
          </select>
          <select
            value={calendarYear}
            onChange={e => {
              setCalendarYear(Number(e.target.value));
              setSelectedMonthDate(null);
            }}
            style={{ fontWeight: 700, fontSize: 16, borderRadius: 8, border: `1px solid ${PALETTE.primary}`, color: PALETTE.primary, background: 'white', padding: '2px 8px' }}
          >
            {yearOptions.map(y => (
              <option value={y} key={y}>{y}</option>
            ))}
          </select>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map(d => (
            <Typography key={d} variant="caption" sx={{ color: PALETTE.grey, fontWeight: 700, textAlign: 'center' }}>{d}</Typography>
          ))}
        </Box>
        {weeks.map((week, i) => (
          <Box key={i} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 0.5 }}>
            {week.map((date, j) => {
              if (!date) return <Box key={j} sx={{ height: 32 }} />;
              const isSelected = selectedDate && date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
              const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              const hasOrders = ordersByDay[date.getDate()];
              return (
                <Button
                  key={j}
                  onClick={() => onSelectDate(date)}
                  sx={{
                    minWidth: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isSelected ? PALETTE.primary : isToday ? PALETTE.addButton : 'transparent',
                    color: isSelected ? PALETTE.background : PALETTE.text,
                    fontWeight: isSelected ? 700 : 500,
                    border: hasOrders ? `2px solid ${PALETTE.primary}` : '1px solid transparent',
                    boxShadow: isSelected ? '0 2px 8px 0 rgba(255,106,40,0.18)' : 'none',
                    mb: 0.5,
                    mx: 'auto',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: isSelected ? PALETTE.primary : alpha(PALETTE.primary, 0.15),
                      color: PALETTE.background
                    }
                  }}
                >
                  {date.getDate()}
                </Button>
              );
            })}
          </Box>
        ))}
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 2, borderRadius: '12px', color: PALETTE.primary, borderColor: PALETTE.primary, fontWeight: 600 }}
          onClick={() => onSelectDate(null)}
        >
          Show All Days
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ background: PALETTE.background, minHeight: '100vh', width: '100vw', position: 'relative', p: 0, m: 0, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw', p: 0, m: 0 }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: 260,
            minHeight: '100vh',
            background: PALETTE.card,
            borderRadius: 0,
            boxShadow: '0 8px 32px 0 rgba(255,106,40,0.10)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 3,
            position: 'sticky',
            top: 0,
            left: 0,
            zIndex: 10
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: PALETTE.primary, mb: 4 }}>
              Admin
            </Typography>
            <Stack spacing={2}>
              {SIDEBAR_OPTIONS.map(option => (
                <Button
                  key={option.value}
                  onClick={() => handleSidebarChange(option.value)}
                  startIcon={option.icon}
                  sx={{
                    justifyContent: 'flex-start',
                    borderRadius: '12px',
                    px: 2.5,
                    py: 1.5,
                    fontWeight: 600,
                    color: activeTab === option.value ? PALETTE.background : PALETTE.primary,
                    background: activeTab === option.value ? PALETTE.primary : 'transparent',
                    boxShadow: activeTab === option.value ? '0 4px 16px 0 rgba(255,106,40,0.18)' : 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: activeTab === option.value ? PALETTE.primary : alpha(PALETTE.primary, 0.08),
                      color: PALETTE.background
                    }
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Stack>
          </Box>
          <Box sx={{ mt: 6 }}>
            <Button
              variant="contained"
              onClick={handleAccountanceClick}
              startIcon={<AccountBalanceWalletIcon />}
              sx={{
                width: '100%',
                borderRadius: '12px',
                textTransform: 'none',
                background: PALETTE.primary,
                color: PALETTE.background,
                fontWeight: 600,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: alpha(PALETTE.primary, 0.8)
                }
              }}
            >
              View Accountance
            </Button>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, height: '100vh', overflow: 'auto', p: 0, m: 0 }}>
          {/* Sticky Top Content */}
          <Box sx={{
            position: 'sticky',
            top: 0,
            zIndex: 5,
            background: PALETTE.background,
            pt: 4,
            pb: 2,
            px: 4,
            borderBottom: `1px solid ${alpha(PALETTE.primary, 0.08)}`
          }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: PALETTE.primary, mb: 1 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color={PALETTE.grey}>
              Manage your restaurant operations efficiently
            </Typography>
            {/* Date Filter and Stats Row (only for Orders tab) */}
            {activeTab === 'orders' && (
              <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                {/* Date Filter Buttons */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant={dateFilter === 'day' ? 'contained' : 'outlined'}
                    onClick={() => setDateFilter('day')}
                    sx={{
                      background: dateFilter === 'day' ? PALETTE.primary : 'transparent',
                      borderColor: dateFilter === 'day' ? 'transparent' : PALETTE.primary,
                      color: dateFilter === 'day' ? PALETTE.background : PALETTE.primary,
                      '&:hover': {
                        background: dateFilter === 'day' ? alpha(PALETTE.primary, 0.8) : alpha(PALETTE.primary, 0.1)
                      }
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant={dateFilter === 'week' ? 'contained' : 'outlined'}
                    onClick={() => setDateFilter('week')}
                    sx={{
                      background: dateFilter === 'week' ? PALETTE.primary : 'transparent',
                      borderColor: dateFilter === 'week' ? 'transparent' : PALETTE.primary,
                      color: dateFilter === 'week' ? PALETTE.background : PALETTE.primary,
                      '&:hover': {
                        background: dateFilter === 'week' ? alpha(PALETTE.primary, 0.8) : alpha(PALETTE.primary, 0.1)
                      }
                    }}
                  >
                    This Week
                  </Button>
                  <Button
                    variant={dateFilter === 'month' ? 'contained' : 'outlined'}
                    onClick={() => setDateFilter('month')}
                    sx={{
                      background: dateFilter === 'month' ? PALETTE.primary : 'transparent',
                      borderColor: dateFilter === 'month' ? 'transparent' : PALETTE.primary,
                      color: dateFilter === 'month' ? PALETTE.background : PALETTE.primary,
                      '&:hover': {
                        background: dateFilter === 'month' ? alpha(PALETTE.primary, 0.8) : alpha(PALETTE.primary, 0.1)
                      }
                    }}
                  >
                    This Month
                  </Button>
                </Box>
                {/* Stats Cards Row */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <StatsCard
                    icon={TableRestaurantIcon}
                    title="Total Orders"
                    value={stats.total}
                    color={PALETTE.primary}
                    small
                  />
                  <StatsCard
                    icon={AccessTimeIcon}
                    title="Pending Orders"
                    value={stats.pending}
                    color={PALETTE.primary}
                    small
                  />
                  <StatsCard
                    icon={TableRestaurantIcon}
                    title="Completed Orders"
                    value={stats.completed}
                    color={PALETTE.primary}
                    small
                  />
                </Box>
              </Box>
            )}
          </Box>

          {/* Scrollable Main Content */}
          <Box sx={{ px: 0, pt: 2, pb: 4, width: '100%', boxSizing: 'border-box' }}>
            {activeTab === 'orders' && (
              dateFilter === 'month' ? (
                <Grid container spacing={0} sx={{ width: '100%', m: 0, boxSizing: 'border-box' }}>
                  <Grid item xs={12} md={9} lg={10} sx={{ pr: { md: 2, xs: 0 }, boxSizing: 'border-box' }}>
                    <Box sx={{
                      background: PALETTE.card,
                      borderRadius: '18px',
                      boxShadow: '0 8px 32px 0 rgba(255,106,40,0.10)',
                      p: { xs: 1.5, md: 3 },
                      minHeight: 500,
                      transition: 'box-shadow 0.3s',
                      '&:hover': {
                        boxShadow: '0 16px 40px 0 rgba(255,106,40,0.18)'
                      },
                      display: 'block',
                      overflow: 'hidden',
                      width: '100%',
                      boxSizing: 'border-box',
                      maxHeight: '70vh',
                    }}>
                      <Box sx={{
                        width: '100%',
                        overflowY: 'auto',
                        maxHeight: { xs: 'none', md: '64vh' },
                        pr: 1,
                        boxSizing: 'border-box',
                      }}>
                        <Grid container spacing={3} sx={{ m: 0, width: '100%' }}>
                          {filteredOrders.length === 0 && (
                            <Grid item xs={12}>
                              <Typography variant="body1" sx={{ color: PALETTE.grey, textAlign: 'center', mt: 4 }}>
                                {selectedMonthDate ? `No orders for ${selectedMonthDate.toLocaleDateString()}` : 'No orders for this month.'}
                              </Typography>
                            </Grid>
                          )}
                          {filteredOrders.map((order) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={order._id} sx={{ boxSizing: 'border-box' }}>
                              <OrderCard order={order} isBlinking={highlightedOrderId === order._id} />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3} lg={2} sx={{ pl: { md: 2, xs: 0 }, boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <Box sx={{ width: '100%', maxWidth: 320, minWidth: 200 }}>
                      <CalendarSidebar selectedDate={selectedMonthDate} onSelectDate={setSelectedMonthDate} />
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={3}>
                  {dateFilter === 'day' ? (
                    <>
                      <Grid item xs={12} md={7.2}>
                        <Box sx={{
                          background: PALETTE.card,
                          borderRadius: '18px',
                          boxShadow: '0 8px 32px 0 rgba(255,106,40,0.10)',
                          p: 3,
                          minHeight: 500,
                          transition: 'box-shadow 0.3s',
                          '&:hover': {
                            boxShadow: '0 16px 40px 0 rgba(255,106,40,0.18)'
                          },
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 3,
                          alignItems: 'flex-start',
                          justifyContent: 'flex-start',
                          overflowY: 'auto',
                          maxHeight: '70vh'
                        }}>
                          <Grid container spacing={3}>
                            {filteredOrders.map((order) => (
                              <Grid item xs={12} sm={6} md={6} lg={6} key={order._id}>
                                <OrderCard order={order} isBlinking={highlightedOrderId === order._id} />
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4.8}>
                        <Box sx={{
                          background: PALETTE.card,
                          borderRadius: '18px',
                          boxShadow: '0 8px 32px 0 rgba(255,106,40,0.10)',
                          p: 3,
                          minHeight: 500,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 2,
                          alignItems: 'flex-start',
                          justifyContent: 'flex-start',
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          maxHeight: '70vh',
                          overflowY: 'auto'
                        }}>
                          {[...Array(20)].map((_, i) => {
                            const tableNum = i + 1;
                            // Table is active if there is an order in progress OR payment is pending
                            const activeOrder = filteredOrders.find(o =>
                              Number(o.tableNumber) === tableNum &&
                              (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' ||
                                (o.status === 'delivered' && (
                                  (o.paymentMethod === 'cash' && o.paymentStatus !== 'completed') ||
                                  (o.paymentMethod !== 'cash' && o.paymentStatus !== 'completed')
                                ))
                              )
                            );
                            const isActive = Boolean(activeOrder && !(
                              activeOrder.paymentMethod === 'cash' && activeOrder.paymentStatus === 'completed'
                            ));
                            return (
                              <Box
                                key={tableNum}
                                sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', m: 1 }}
                              >
                                <Box
                                  onClick={() => isActive && setHighlightedOrderId(activeOrder._id)}
                                  sx={{
                                    width: 70,
                                    height: 110,
                                    borderRadius: '18px',
                                    background: isActive ? PALETTE.primary : PALETTE.card,
                                    color: isActive ? PALETTE.background : PALETTE.grey,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    boxShadow: isActive ? '0 4px 16px 0 rgba(255,106,40,0.18)' : 'none',
                                    cursor: isActive ? 'pointer' : 'default',
                                    border: isActive ? `3px solid ${PALETTE.primary}` : `2px solid ${PALETTE.grey}`,
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    '&:hover': {
                                      boxShadow: isActive ? '0 8px 24px 0 rgba(255,106,40,0.25)' : 'none',
                                    }
                                  }}
                                >
                                  <TableRestaurantIcon sx={{ fontSize: 32, mb: 0.5, color: isActive ? PALETTE.background : PALETTE.grey }} />
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: PALETTE.text }}>
                                    Table {tableNum}
                                  </Typography>
                                </Box>
                                {/* Sequence number and Active label below the border, outside the card */}
                                {isActive && (
                                  <Box sx={{
                                    width: 70,
                                    mt: 0.5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none',
                                    zIndex: 2
                                  }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: PALETTE.primary, lineHeight: 1, mb: 0.2, textAlign: 'center', fontSize: '1.1rem' }}>
                                      {activeOrder.sequenceNumber ? String(activeOrder.sequenceNumber).padStart(3, '0') : ''}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: PALETTE.primary, fontWeight: 600, letterSpacing: 1, textAlign: 'center' }}>
                                      Active
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      </Grid>
                    </>
                  ) : (
                    // For week/month, show only the order cards full width
                    <Grid item xs={12}>
                      <Box sx={{
                        background: PALETTE.card,
                        borderRadius: '18px',
                        boxShadow: '0 8px 32px 0 rgba(255,106,40,0.10)',
                        p: 3,
                        minHeight: 500,
                        transition: 'box-shadow 0.3s',
                        '&:hover': {
                          boxShadow: '0 16px 40px 0 rgba(255,106,40,0.18)'
                        },
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        overflowY: 'auto',
                        maxHeight: '70vh'
                      }}>
                        <Grid container spacing={3}>
                          {filteredOrders.map((order) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={order._id}>
                              <OrderCard order={order} isBlinking={highlightedOrderId === order._id} />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )
            )}
            {activeTab === 'waiters' && <WaiterManagement />}
            {activeTab === 'food' && <FoodManagement />}
            {activeTab === 'coupons' && <CouponManagement />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// Add keyframes for blinking animation
const styles = {
  '@keyframes blinker': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0 },
    '100%': { opacity: 1 }
  }
};

// Apply global styles
Object.keys(styles).forEach(key => {
  const style = document.createElement('style');
  style.innerHTML = `${key} { ${Object.entries(styles[key]).map(([k, v]) => `${k}: ${v}`).join('; ')} }`;
  document.head.appendChild(style);
});
export default AdminDashboard;