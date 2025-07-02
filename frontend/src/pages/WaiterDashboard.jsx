import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { UPI_CONFIG, QR_CONFIG, PAYMENT_VALIDATION } from '../utils/paymentConfig';
import { 
  ClockIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  CurrencyRupeeIcon,
  QrCodeIcon,
  TruckIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline';
import { PALETTE } from '../themePalette';
import { buildApiUrl } from '../utils/config';

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-200 text-yellow-800',
    preparing: 'bg-blue-200 text-blue-800',
    ready: 'bg-green-200 text-green-800',
    delivered: 'bg-gray-200 text-gray-800',
    cancelled: 'bg-red-200 text-red-800',
    rejected: 'bg-red-200 text-red-800'
  };
  return colors[status] || 'bg-gray-200 text-gray-800';
};

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waiterInfo, setWaiterInfo] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [updatingOrders, setUpdatingOrders] = useState(new Set());
  const [processingPayment, setProcessingPayment] = useState(new Set());
  const [upiDialog, setUpiDialog] = useState({
    open: false,
    orderId: null,
    amount: 0,
    qrString: '',
    error: ''
  });
  const [paymentTimer, setPaymentTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(PAYMENT_VALIDATION.timeoutSeconds);

  const displayedOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    if (selectedStatus === 'all') return orders;
    return orders.filter(order => order.status === selectedStatus);
  }, [orders, selectedStatus]);

  const orderStats = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    
    const stats = [
      { status: 'pending', label: 'Pending Orders' },
      { status: 'preparing', label: 'Preparing' },
      { status: 'ready', label: 'Ready to Serve' },
      { status: 'delivered', label: 'Delivered (Unpaid)', filterFn: o => o.status === 'delivered' && o.paymentStatus !== 'completed' }
    ];

    return stats.map(stat => ({
      label: stat.label,
      value: orders.filter(o => stat.filterFn ? stat.filterFn(o) : o.status === stat.status).length,
      status: stat.status
    }));
  }, [orders]);

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('waiterToken');
      const waiterData = localStorage.getItem('waiterInfo');
      
      if (!token || !waiterData) {
        console.error('No token or waiter info found');
        setError('Authentication required. Please log in again.');
        setTimeout(() => navigate('/waiter-login'), 2000);
        return;
      }

      const response = await axios.get(
        buildApiUrl('/orders/waiter-orders'),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const fetchedOrders = response.data;
      
      // Validate and sanitize orders
      const sanitizedOrders = fetchedOrders.filter(order => 
        order && order.items && Array.isArray(order.items) && 
        order.items.every(item => 
          item && 
          item.foodItem && 
          item.foodItem.name && 
          typeof item.foodItem.price === 'number' &&
          typeof item.quantity === 'number'
        )
      );

      setOrders(sanitizedOrders);
      setError('');
    } catch (err) {
      console.error('Error fetching orders:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch orders';
      setError(errorMessage);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('waiterToken');
        localStorage.removeItem('waiterInfo');
        setTimeout(() => navigate('/waiter-login'), 2000);
      }
      
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const waiterData = localStorage.getItem('waiterInfo');
    if (waiterData) {
      try {
        const parsedData = JSON.parse(waiterData);
        setWaiterInfo(parsedData);
      } catch (err) {
        console.error('Error parsing waiter info:', err);
        localStorage.removeItem('waiterInfo');
        navigate('/waiter-login');
      }
    } else {
      navigate('/waiter-login');
    }

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('waiterToken');
    localStorage.removeItem('waiterInfo');
    navigate('/waiter-login');
  };

  const handleCloseUpiDialog = useCallback(() => {
    if (paymentTimer) {
      clearInterval(paymentTimer);
    }
    setPaymentTimer(null);
    setTimeLeft(PAYMENT_VALIDATION.timeoutSeconds);
    setUpiDialog({
      open: false,
      orderId: null,
      amount: 0,
      qrString: '',
      error: ''
    });
  }, [paymentTimer]);

  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    setUpdatingOrders(prev => new Set([...prev, orderId]));
    try {
      const token = localStorage.getItem('waiterToken');
      await axios.patch(
        buildApiUrl(`/orders/${orderId}/status`),
        {
          status: newStatus,
          comment: `Order ${newStatus} by waiter`
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setOrders(prevOrders => {
        return prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        );
      });

      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update order status`);
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  }, [fetchOrders]);

  const handlePayment = useCallback(async (orderId, paymentMethod) => {
    if (!orderId || !paymentMethod) {
      setError('Invalid payment details');
      return;
    }

    setProcessingPayment(prev => new Set([...prev, orderId]));
    try {
      const token = localStorage.getItem('waiterToken');
      
      await axios.patch(
        buildApiUrl(`/orders/${orderId}/payment`),
        {
          paymentMethod,
          paymentStatus: 'completed',
          status: 'completed'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { 
                ...order, 
                status: 'completed',
                paymentStatus: 'completed',
                paymentMethod
              }
            : order
        )
      );

      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to process payment`);
    } finally {
      setProcessingPayment(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  }, [fetchOrders]);

  const validatePayment = useCallback((amount) => {
    if (amount < PAYMENT_VALIDATION.minimumAmount) {
      return {
        isValid: false,
        message: `Amount must be at least ₹${PAYMENT_VALIDATION.minimumAmount}`
      };
    }
    if (amount > PAYMENT_VALIDATION.maximumAmount) {
      return {
        isValid: false,
        message: `Amount cannot exceed ₹${PAYMENT_VALIDATION.maximumAmount}`
      };
    }
    return { isValid: true, message: '' };
  }, []);

  const handleUpiPaymentClick = useCallback((orderId, amount) => {
    try {
      const validation = validatePayment(amount);
      if (!validation.isValid) {
        setUpiDialog({
          open: true,
          orderId,
          amount,
          qrString: '',
          error: validation.message
        });
        return;
      }

      console.log('Generating QR code for order:', orderId);
      const upiDetails = {
        pa: '9010462357@ybl',
        pn: 'TestCafe Restaurant',
        tr: `TSTCF-${orderId}`,
        tn: `Order #${orderId}`,
        am: amount.toString(),
        cu: "INR",
        mc: 'RESTAURANT',
      };
      
      console.log('UPI payment details:', upiDetails);

      const upiUrl = `upi://pay?${Object.entries(upiDetails)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')}`;
      console.log('Generated UPI URL:', upiUrl);
      console.log('QR code will be generated with this URL');

      setUpiDialog({
        open: true,
        orderId,
        amount,
        qrString: upiUrl,
        error: ''
      });

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleCloseUpiDialog();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setPaymentTimer(timer);
    } catch (error) {
      setUpiDialog({
        open: true,
        orderId,
        amount,
        qrString: '',
        error: 'Failed to generate QR code'
      });
    }
  }, [validatePayment, handleCloseUpiDialog]);

  const handlePaymentConfirm = useCallback(async (orderId, paymentMethod) => {
    if (paymentMethod === 'upi') {
      handleCloseUpiDialog();
    }
    await handlePayment(orderId, paymentMethod);
  }, [handleCloseUpiDialog, handlePayment]);

  useEffect(() => {
    return () => {
      if (paymentTimer) {
        clearInterval(paymentTimer);
      }
    };
  }, [paymentTimer]);

  if (loading) {
    return (
      <div className="flex justify-center mt-4">
        <svg className="animate-spin h-8 w-8 text-[#ff7900]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4zm16 0a8 8 0 01-8 8v-4a4 4 0 004-4h4z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with waiter details */}
      <div className="flex justify-between items-center px-6 py-4 bg-[#ffffea] shadow-sm">
        <h1 className="text-2xl font-bold text-[#ff7900]">Waiter Dashboard</h1>
        {waiterInfo && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-gray-800">{waiterInfo.name}</div>
              <div className="text-xs text-gray-500">{waiterInfo.phoneNumber}</div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-4 px-3 py-1 bg-[#ff7900] text-white rounded hover:bg-[#e56a00] transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Error display */}
        {error && (
          <div className="mb-4">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Status Filters */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center ${
                selectedStatus === 'all' ? 'bg-[#ff7900] text-white' : 'bg-[#ffffea] text-[#ff7900] border border-[#ff7900]'
              }`}
              onClick={() => setSelectedStatus('all')}
            >
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              All Orders ({orders.length})
            </button>
            
            {orderStats.map(stat => (
              <button
                key={stat.status}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center ${
                  selectedStatus === stat.status ? 'bg-[#ff7900] text-white' : 'bg-[#ffffea] text-[#ff7900] border border-[#ff7900]'
                }`}
                onClick={() => setSelectedStatus(stat.status)}
              >
                {stat.status === 'pending' && <ClockIcon className="h-5 w-5 mr-2" />}
                {stat.status === 'preparing' && <ClockIcon className="h-5 w-5 mr-2" />}
                {stat.status === 'ready' && <CheckCircleIcon className="h-5 w-5 mr-2" />}
                {stat.status === 'delivered' && <TruckIcon className="h-5 w-5 mr-2" />}
                {stat.label} ({stat.value})
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {orderStats.map((stat, index) => (
            <div key={index} className="bg-[#ffffea] rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-[#ff7900]">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Orders List */}
        {displayedOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-500">
              No {selectedStatus === 'all' ? '' : selectedStatus} orders found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedOrders.map((order) => (
              <div key={order._id} className="bg-[#ffffea] rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Table {order.tableNumber}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Item List */}
                  <div className="space-y-3 mb-4">
                    {order.items?.map((item, index) => (
                      <div key={`${order._id}-${index}`} className="flex justify-between items-center border-b pb-2">
                        <div className="flex-1">
                          {/* Item Name and Category */}
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-medium text-gray-800">
                              {item.foodItem?.name || 'Unknown Item'}
                            </p>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2">
                              {item.foodItem?.category || 'Uncategorized'}
                            </span>
                          </div>
                          
                          {/* Quantity and Notes */}
                          <div className="flex flex-col gap-1">
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity || 0}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-gray-500 italic">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Price Information */}
                        <div className="text-right">
                          <p className="font-medium text-gray-800">
                            ₹{(item.subtotal || (item.foodItem?.price * item.quantity) || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            @₹{(item.foodItem?.price || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Information */}
                  <div className="border-t pt-3 mb-4">
                    {/* Total and Payment Details */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-semibold text-gray-800">Total Amount:</p>
                        <p className="text-lg font-bold text-[#ff7900]">₹{(order.totalAmount || 0).toFixed(2)}</p>
                      </div>
                      
                      {/* Order Details */}
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Order ID:</span>
                          <span className="font-mono">{order._id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        {order.comments && order.comments.length > 0 && (
                          <div className="text-amber-600 mt-1">
                            Latest Comment: {order.comments[order.comments.length - 1].text}
                            <span className="text-xs text-gray-500 ml-2">
                              ({new Date(order.comments[order.comments.length - 1].timestamp).toLocaleTimeString()})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      {order.paymentStatus === 'completed' && order.paymentMethod ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Paid ({order.paymentMethod.toUpperCase()})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {order.status === 'delivered' ? 'Payment Pending' : 'Unpaid'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* Status update buttons */}
                    {order.status === 'pending' && (
                      <button
                        className="w-full bg-[#ff7900] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e56a00] transition-colors flex items-center justify-center disabled:opacity-50"
                        onClick={() => handleStatusUpdate(order._id, 'preparing')}
                        disabled={updatingOrders.has(order._id)}
                      >
                        <ClockIcon className="h-5 w-5 mr-2" />
                        Mark as Preparing
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        className="w-full bg-[#ff7900] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e56a00] transition-colors flex items-center justify-center disabled:opacity-50"
                        onClick={() => handleStatusUpdate(order._id, 'ready')}
                        disabled={updatingOrders.has(order._id)}
                      >
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Mark as Ready
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        className="w-full bg-[#ff7900] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e56a00] transition-colors flex items-center justify-center disabled:opacity-50"
                        onClick={() => handleStatusUpdate(order._id, 'delivered')}
                        disabled={updatingOrders.has(order._id)}
                      >
                        <TruckIcon className="h-5 w-5 mr-2" />
                        Mark as Delivered
                      </button>
                    )}

                    {/* Payment buttons for delivered orders */}
                    {order.status === 'delivered' && (!order.paymentStatus || order.paymentStatus !== 'completed') && (
                      <>
                        <button
                          className="flex-1 bg-[#ff7900] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e56a00] transition-colors flex items-center justify-center disabled:opacity-50"
                          onClick={() => handlePaymentConfirm(order._id, 'cash')}
                          disabled={processingPayment.has(order._id)}
                        >
                          <CurrencyRupeeIcon className="h-5 w-5 mr-2" />
                          Cash Payment
                        </button>
                        <button
                          className="flex-1 bg-[#ff7900] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e56a00] transition-colors flex items-center justify-center disabled:opacity-50"
                          onClick={() => handlePaymentConfirm(order._id, 'card')}
                          disabled={processingPayment.has(order._id)}
                        >
                          <CreditCardIcon className="h-5 w-5 mr-2" />
                          Card Payment
                        </button>
                        <button
                          className="flex-1 bg-[#ff7900] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e56a00] transition-colors flex items-center justify-center disabled:opacity-50"
                          onClick={() => handleUpiPaymentClick(order._id, order.totalAmount)}
                          disabled={processingPayment.has(order._id)}
                        >
                          <QrCodeIcon className="h-5 w-5 mr-2" />
                          UPI Payment
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* UPI Payment Dialog */}
        {upiDialog.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Pay with UPI
                </h2>
                
                {upiDialog.error ? (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
                    {upiDialog.error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <QRCodeSVG 
                        value={upiDialog.qrString} 
                        size={QR_CONFIG.size}
                        level={QR_CONFIG.level}
                        includeMargin={QR_CONFIG.includeMargin}
                        imageSettings={QR_CONFIG.imageSettings}
                      />
                    </div>
                    
                    <p className="text-2xl font-bold text-[#ff7900]">
                      Amount: ₹{upiDialog.amount.toFixed(2)}
                    </p>
                    
                    <p className="text-gray-600">
                      Scan with any UPI app to pay
                    </p>
                    
                    <p className="text-amber-600 text-sm">
                      Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-2">
                      {UPI_CONFIG.supportedApps.map((app) => (
                        <button
                          key={app.name}
                          className="px-4 py-2 rounded border border-[#ff7900] text-[#ff7900] hover:bg-[#ff7900] hover:text-white transition-colors"
                          onClick={() => {
                            window.location.href = `${app.scheme}://${upiDialog.qrString}`;
                          }}
                        >
                          {app.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between mt-8">
                  <button
                    onClick={handleCloseUpiDialog}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePaymentConfirm(upiDialog.orderId, 'upi')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200
                      ${processingPayment.has(upiDialog.orderId)
                        ? 'bg-[#ff7900] cursor-not-allowed'
                        : 'bg-[#ff7900] hover:bg-[#e56a00]'
                      } text-white min-w-[150px]`}
                    disabled={processingPayment.has(upiDialog.orderId)}
                  >
                    {processingPayment.has(upiDialog.orderId) ? (
                      <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4zm16 0a8 8 0 01-8 8v-4a4 4 0 004-4h4z"></path>
                      </svg>
                    ) : (
                      'Confirm Payment'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterDashboard;