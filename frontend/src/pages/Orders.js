import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import CancelIcon from '@mui/icons-material/Cancel';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All Orders');
  const navigate = useNavigate();
  const { token, user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setOrders(data.orders || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch orders');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      preparing: '#2196f3',
      ready: '#4caf50',
      delivered: '#8bc34a',
      cancelled: '#f44336',
      completed: '#009688'
    };
    return colors[status] || '#757575';
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ShoppingCartIcon />;
      case 'preparing':
        return <RestaurantIcon />;
      case 'ready':
        return <DoneAllIcon />;
      case 'delivered':
        return <DeliveryDiningIcon />;
      case 'cancelled':
        return <CancelIcon />;
      case 'completed':
        return <LocalDiningIcon />;
      default:
        return <AccessTimeIcon />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filterButtons = ['All Orders', 'Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled', 'Completed'];

  const filteredOrders = orders.filter(order => {
    if (filter === 'All Orders') return true;
    return order.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="orders-page">
      <div className="welcome-banner" style={{
        background: 'linear-gradient(135deg, #4169E1 0%, #6495ED 100%)',
        borderRadius: '16px',
        padding: '20px',
        color: 'white',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0' }}>Welcome back, {user?.name || 'Guest'}!</h1>
          {user?.phoneNumber && (
            <p style={{ margin: '8px 0 0', opacity: '0.9' }}>📞 {user.phoneNumber}</p>
          )}
        </div>
        <div className="stats" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '12px 24px',
          borderRadius: '12px'
        }}>
          <h3 style={{ margin: '0' }}>Total Orders: {orders.length}</h3>
        </div>
      </div>

      <h2 style={{ marginBottom: '20px' }}>My Orders</h2>

      <div className="filter-buttons" style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '24px',
        overflowX: 'auto',
        padding: '4px'
      }}>
        {filterButtons.map(btn => (
          <button
            key={btn}
            onClick={() => setFilter(btn)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: filter === btn ? '#4169E1' : '#f0f0f0',
              color: filter === btn ? 'white' : '#333',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease'
            }}
          >
            {btn}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="no-orders" style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666'
        }}>
          No orders found
        </div>
      ) : (
        <div className="orders-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          padding: '4px'
        }}>
          {filteredOrders.map(order => (
            <div
              key={order._id}
              className="order-card"
              onClick={() => navigate(`/order/${order._id}`)}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '1px solid #eee',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start'
              }}>
                <h3 style={{ margin: '0', color: '#2c3e50' }}>
                  Order #{order._id.slice(-5)}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: getStatusColor(order.status),
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.85rem'
                }}>
                  {getStatusIcon(order.status)}
                  <span style={{ marginLeft: '4px' }}>{order.status}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                <TableRestaurantIcon fontSize="small" />
                <span>Table {order.tableNumber}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                <AccessTimeIcon fontSize="small" />
                <span>{formatDate(order.createdAt)}</span>
              </div>

              <div style={{
                marginTop: 'auto',
                paddingTop: '12px',
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ color: '#2c3e50', fontWeight: '500', display: 'flex', flexDirection: 'column' }}>
                  {order.status?.toLowerCase() === 'delivered' && order.discountedAmount ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.95em', marginRight: 8 }}>
                        Original: ₹{order.totalAmount?.toFixed(2) || '0.00'}
                      </span>
                      <span style={{ color: '#388e3c', fontWeight: 700 }}>
                        Final: ₹{order.discountedAmount?.toFixed(2)}
                      </span>
                      {order.appliedCoupon && (
                        <span style={{ color: '#009688', fontWeight: 500, fontSize: '0.95em', marginTop: 2 }}>
                          Coupon Applied: <b>{order.appliedCoupon}</b>
                        </span>
                      )}
                    </>
                  ) : (
                    <>₹{order.totalAmount?.toFixed(2) || '0.00'}</>
                  )}
                </div>
                <div style={{ 
                  color: '#666',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {order.items?.length || 0} items
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
