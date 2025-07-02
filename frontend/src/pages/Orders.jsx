import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from '../utils/config';

const OrderTimeline = ({ comments }) => {
  if (!comments || comments.length === 0) return null;

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-[#ff7900] text-white',
      preparing: 'bg-[#ff7900] text-white',
      ready: 'bg-[#ff7900] text-white',
      delivered: 'bg-[#ff7900] text-white',
      cancelled: 'bg-red-500 text-white',
      completed: 'bg-[#ff7900] text-white'
    };
    return statusColors[status] || 'bg-gray-500 text-white';
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 right-4 top-3 h-1 bg-gray-200 z-0"></div>
      
      <div className="relative flex overflow-x-auto pb-2">
        <div className="flex space-x-2 md:space-x-0 md:grid md:grid-cols-5 md:w-full">
          {comments.map((comment, index) => (
            <div key={index} className="flex flex-col items-center relative z-10 min-w-[80px]">
              {/* Dot with pulse animation for current status */}
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${getStatusColor(comment.status)} mb-1 
                ${index === comments.length - 1 ? 'animate-pulse' : ''}`}>
                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="10" />
                </svg>
              </div>
              
              {/* Status label with tooltip */}
              <div className="group relative">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(comment.status)} mb-0.5`}>
                  {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                </span>
                <div className="absolute z-20 hidden group-hover:block bottom-full mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                  {new Date(comment.timestamp).toLocaleString()}
                </div>
              </div>
              
              {/* Time */}
              <span className="text-[10px] text-gray-500 text-center">
                {new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentError, setPaymentError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your orders');
          navigate('/login');
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        try {
          const profileResponse = await axios.get(buildApiUrl('/auth/profile'), { headers });
          setUserProfile(profileResponse.data);

          const ordersResponse = await axios.get(buildApiUrl('/orders/my-orders'), { headers });
          const sortedOrders = ordersResponse.data.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setOrders(sortedOrders);
        } catch (error) {
          if (error.response?.status === 404) {
            setError('No profile found. Please complete your profile first.');
          } else if (error.response?.status === 401) {
            localStorage.removeItem('token');
            setError('Your session has expired. Please log in again.');
            navigate('/login');
          } else {
            setError('Failed to load orders or profile. Please try again later.');
            console.error('API Error:', error.response?.data || error.message);
          }
          throw error;
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const filteredOrders = orders.filter(order => 
    filterStatus === 'all' ? true : order.status === filterStatus
  );

  const handlePaymentClick = (order) => {
    setSelectedOrder(order);
    setPaymentMethod('cash');
    setPaymentOpen(true);
    setPaymentError(null);
  };

  const handlePaymentClose = () => {
    setPaymentOpen(false);
    setSelectedOrder(null);
    setPaymentError(null);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentMethod) {
      setPaymentError('Please select a payment method');
      return;
    }

    setProcessingPayment(true);
    setPaymentError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPaymentError('You need to be logged in to make a payment');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      // Process payment
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const { data: updatedOrder } = await axios.patch(
        buildApiUrl(`/orders/${selectedOrder._id}/payment`),
        {
          paymentMethod,
          paymentStatus: 'completed'
        },
        { headers }
      );

      // Update orders list with new order status
      setOrders(orders.map(order => 
        order._id === selectedOrder._id ? { ...order, ...updatedOrder } : order
      ));

      // Refresh user profile to get latest orders
      try {
        const profileResponse = await axios.get(buildApiUrl('/auth/profile'), { headers });
        setUserProfile(profileResponse.data);
      } catch (profileError) {
        console.error('Error refreshing profile:', profileError);
        // Don't block the payment completion if profile refresh fails
      }

      handlePaymentClose();
    } catch (error) {
      console.error('Error processing payment:', error);
      if (error.response?.status === 401) {
        setPaymentError('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setPaymentError(
          error.response?.data?.message || 
          'Failed to process payment. Please try again.'
        );
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-[#ff7900] text-white',
      preparing: 'bg-[#ff7900] text-white',
      ready: 'bg-[#ff7900] text-white',
      delivered: 'bg-[#ff7900] text-white',
      cancelled: 'bg-red-500 text-white',
      completed: 'bg-[#ff7900] text-white'
    };
    return statusColors[status] || 'bg-gray-500 text-white';
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-8 max-w-7xl bg-white">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-[#ff7900] hover:text-[#e56a00] transition-colors mb-6"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff7900]"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto px-4 py-8 max-w-7xl bg-white">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-[#ff7900] hover:text-[#e56a00] transition-colors mb-6"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl bg-white">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-[#ff7900] hover:text-[#e56a00] transition-colors mb-6"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      
      {/* User Profile Card */}
      {userProfile && (
        <div className="bg-gradient-to-r from-[#ff7900] to-[#e56a00] rounded-xl shadow-lg mb-8 p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {userProfile.name}!
              </h2>
              <p className="flex items-center text-[#ffffea]">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {userProfile.phoneNumber}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-3">
              <p className="text-lg font-semibold">
                Total Orders: <span className="text-2xl">{orders.length}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Status Filter */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Orders</h1>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-[#ff7900] text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-[#ffffea]'
            }`}
          >
            All Orders
          </button>
          {['pending', 'preparing', 'ready', 'delivered', 'cancelled', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? `${getStatusColor(status)} shadow-md`
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-[#ffffea]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            {filterStatus === 'all' 
              ? 'No orders found' 
              : `No ${filterStatus} orders found`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterStatus === 'all' 
              ? 'You haven\'t placed any orders yet.' 
              : `Try changing your filter to see other orders.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.sequenceNumber ? String(order.sequenceNumber).padStart(3, '0') : order._id.slice(-6).toUpperCase()}
                    </h3>
                    {order.paymentStatus === 'completed' && (
                      <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="border-t border-gray-200 my-4"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-[#ff7900] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="font-medium text-gray-700">Table {order.tableNumber}</span>
                  </div>
                  <div className="flex items-center sm:justify-end">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-[#ffffea] rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-[#ff7900] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h4 className="font-medium text-gray-800">Order Items</h4>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                          {item.specialInstructions && (
                            <p className="text-xs text-gray-400 mt-1">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          ${(item.quantity * item.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.comments && order.comments.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 text-[#ff7900] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="font-medium text-gray-800">Order Progress</h4>
                    </div>
                    <OrderTimeline comments={order.comments} />
                  </div>
                )}

                <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="mb-3 sm:mb-0">
                    {order.status === 'delivered' && order.discountedAmount ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-semibold text-gray-500 line-through">
                          Original: ₹{order.totalAmount.toFixed(2)}
                        </span>
                        <span className="text-xl font-bold text-green-700">
                          Final: ₹{order.discountedAmount.toFixed(2)}
                        </span>
                        {order.appliedCoupon && (
                          <span className="text-sm font-medium text-[#ff7900]">
                            Coupon Applied: <b>{order.appliedCoupon}</b>
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xl font-semibold text-[#ff7900]">
                        Total: ₹{order.totalAmount.toFixed(2)}
                      </span>
                    )}
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-[#ffffea] text-[#ff7900]'
                      }`}>
                        Payment: {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Pending'}
                      </span>
                      {order.paymentStatus === 'completed' && (
                        <span className="ml-3 text-sm text-gray-500">
                          via {order.paymentMethod}
                        </span>
                      )}
                    </div>
                  </div>
                  {order.status === 'delivered' && (!order.paymentStatus || order.paymentStatus === 'pending') && (
                    <button
                      onClick={() => handlePaymentClick(order)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#ff7900] hover:bg-[#e56a00] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff7900]"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {paymentOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
              <button
                onClick={handlePaymentClose}
                className="text-gray-400 hover:text-gray-500"
                disabled={processingPayment}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {paymentError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{paymentError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#ffffea] rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">
                Order #{selectedOrder?.sequenceNumber ? String(selectedOrder.sequenceNumber).padStart(3, '0') : selectedOrder?._id.slice(-6).toUpperCase()}
              </p>
              {selectedOrder?.appliedCoupon && selectedOrder?.discountedAmount ? (
                <div>
                  <div className="flex flex-col gap-1">
                    <span className="text-base text-gray-500 line-through">
                      Original: ₹{selectedOrder.totalAmount.toFixed(2)}
                    </span>
                    <span className="text-base text-green-700 font-semibold">
                      Coupon Discount: -₹{(selectedOrder.totalAmount - selectedOrder.discountedAmount).toFixed(2)}
                    </span>
                    <span className="text-2xl font-bold text-[#ff7900]">
                      Final: ₹{selectedOrder.discountedAmount.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#ff7900] block mt-1">
                    Coupon Applied: <b>{selectedOrder.appliedCoupon}</b>
                  </span>
                </div>
              ) : (
                <p className="text-2xl font-semibold text-[#ff7900]">
                  ₹{selectedOrder?.totalAmount.toFixed(2)}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'upi'
                      ? 'bg-[#ff7900] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-[#ffffea]'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 01-8 0" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v4m0 0a4 4 0 01-4 4H4m8-4a4 4 0 014 4h4" />
                  </svg>
                  UPI
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'card'
                      ? 'bg-[#ff7900] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-[#ffffea]'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18m-7 5h7" />
                  </svg>
                  Card
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={handlePaymentClose}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#ff7900] text-white hover:bg-[#e56a00] transition-colors flex items-center justify-center gap-2"
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor" />
                  </svg>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18m-7 5h7" />
                    </svg>
                    Pay Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;