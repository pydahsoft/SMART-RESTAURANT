import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { Delete, Add, Remove } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import BackButton from '../components/BackButton';
import { PALETTE } from '../themePalette';

const validatePhoneNumber = (number) => {
  // Accept 10-digit phone numbers
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(number.replace(/[^0-9]/g, ''));
};

const Cart = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user, login } = useAuth();
  
  // Initialize state from sessionStorage
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = sessionStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableNumber, setTableNumber] = useState(() => {
    const storedTable = sessionStorage.getItem('tableNumber');
    return storedTable ? parseInt(storedTable) : '';
  });

  // Effect to handle empty cart
  useEffect(() => {
    if (cartItems.length === 0) {
      const savedCart = sessionStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    }
  }, []);

  // Update cart in sessionStorage
  const updateCart = (newCart) => {
    setCartItems(newCart);
    if (newCart.length > 0) {
      sessionStorage.setItem('cart', JSON.stringify(newCart));
    } else {
      sessionStorage.removeItem('cart');
      // Redirect to home if cart is empty
      navigate('/');
    }
  };

  const handleQuantityChange = (itemId, change) => {
    const newCart = cartItems.map(item => {
      if (item._id === itemId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    updateCart(newCart);
  };

  const handleRemoveItem = (itemId) => {
    const newCart = cartItems.filter(item => item._id !== itemId);
    updateCart(newCart);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (!tableNumber) {
      setError('Please select a table number');
      return;
    }
    if (!phoneNumber) {
      setOpenDialog(true);
      return;
    }
    if (!name && !user?.name) {
      setOpenDialog(true);
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
          foodItem: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: calculateTotal(),
        tableNumber: parseInt(tableNumber),
        phoneNumber,
        customerName: name || user?.name
      };

      // Place the order - this will handle authentication/registration
      const response = await axios.post(
        'http://localhost:5000/api/orders',
        orderData
      );

      // Store authentication token and user info
      const { token, user: userInfo, order } = response.data;
      localStorage.setItem('token', token);
      await login({
        _id: userInfo._id,
        name: userInfo.name,
        phoneNumber: userInfo.phoneNumber,
        role: 'customer',
        orders: [order._id],
        token
      });

      sessionStorage.removeItem('cart');
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      setError(error.response?.data?.message || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectOrder = async () => {
    if (!name) {
      setError('Please enter your name');
      return;
    }
    
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    await handlePlaceOrder();
  };

  if (cartItems.length === 0) {
    return (
      <Container 
        maxWidth="sm" 
        sx={{ 
          mt: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 }
        }}
      >
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <BackButton />
          <Typography
            variant="h5"
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.35rem' },
              fontWeight: 600,
              color: 'text.primary',
              ml: 1
            }}
          >
            Your Cart
          </Typography>
        </Box>

        <Card
          elevation={0}
          sx={{
            bgcolor: 'white',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)'
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Box 
              sx={{ 
                mb: 2.5,
                bgcolor: 'white',
                borderRadius: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              {cartItems.map((item, index) => (
                <Box
                  key={item._id}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: index !== cartItems.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'rgba(255, 121, 0, 0.05)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: 'text.primary'
                      }}
                    >
                      {item.name}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'rgba(255, 121, 0, 0.05)',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item._id, -1)}
                        sx={{
                          color: PALETTE.primary,
                          p: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(255, 121, 0, 0.1)'
                          }
                        }}
                      >
                        <Remove sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                      <Typography
                        sx={{
                          mx: 1.5,
                          fontWeight: 500,
                          color: 'text.primary',
                          userSelect: 'none',
                          fontSize: '0.9rem'
                        }}
                      >
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item._id, 1)}
                        sx={{
                          color: PALETTE.primary,
                          p: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(255, 121, 0, 0.1)'
                          }
                        }}
                      >
                        <Add sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Box>

                    <Typography
                      sx={{
                        minWidth: '70px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: PALETTE.primary,
                        fontSize: '0.95rem'
                      }}
                    >
                      ₹{(item.quantity * item.price).toFixed(2)}
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={() => handleRemoveItem(item._id)}
                      sx={{
                        color: 'error.light',
                        p: 0.5,
                        '&:hover': {
                          bgcolor: 'rgba(255, 121, 0, 0.1)',
                          color: 'error.main'
                        }
                      }}
                    >
                      <Delete sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  color: 'text.secondary',
                  fontSize: '0.85rem'
                }}
              >
                Table Number
              </Typography>
              <Select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                displayEmpty
                fullWidth
                size="small"
                sx={{
                  bgcolor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: PALETTE.primary
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: PALETTE.primary
                  }
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <MenuItem 
                    key={num} 
                    value={num}
                    sx={{
                      fontSize: '0.9rem',
                      py: 1,
                      '&:hover': {
                        bgcolor: 'rgba(255, 121, 0, 0.1)'
                      }
                    }}
                  >
                    Table {num}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                bgcolor: 'white',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.85rem',
                    mb: 0.5
                  }}
                >
                  Total Amount
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: '1.1rem'
                  }}
                >
                  ₹{calculateTotal().toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  boxShadow: 'none',
                  backgroundColor: PALETTE.primary,
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#e56a00',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => setOpenDialog(true)
                }
                disabled={loading || cartItems.length === 0}
                size="small"
              >
                {loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  'Place Order'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Dialog
          open={openDialog}
          onClose={() => !loading && setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              bgcolor: 'white',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }
          }}
        >
          <Box sx={{ 
            position: 'relative',
            p: { xs: 2.5, sm: 3 },
            pb: 0
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'text.primary',
                mb: 1.5
              }}
            >
              Complete Your Order
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                mb: 4,
                fontSize: '0.95rem'
              }}
            >
              Please provide your details to place the order
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: 'text.secondary',
                    fontSize: '0.9rem'
                  }}
                >
                  Name
                </Typography>
                <TextField
                  autoFocus
                  fullWidth
                  placeholder="Enter your name"
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'white',
                      '& fieldset': {
                        borderColor: 'divider'
                      },
                      '&:hover fieldset': {
                        borderColor: PALETTE.primary
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: PALETTE.primary
                      }
                    }
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: 'text.secondary',
                    fontSize: '0.9rem'
                  }}
                >
                  Phone Number
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your phone number"
                  variant="outlined"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'white',
                      '& fieldset': {
                        borderColor: 'divider'
                      },
                      '&:hover fieldset': {
                        borderColor: PALETTE.primary
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: PALETTE.primary
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Box 
            sx={{ 
              p: { xs: 2.5, sm: 3 },
              display: 'flex',
              gap: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'white'
            }}
          >
            <Button
              variant="outlined"
              onClick={() => setOpenDialog(false)}
              disabled={loading}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: '12px',
                borderColor: 'divider',
                color: 'text.primary',
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                '&:hover': {
                  borderColor: 'text.primary',
                  bgcolor: 'rgba(255, 121, 0, 0.05)'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleDirectOrder}
              disabled={loading}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: '12px',
                bgcolor: PALETTE.primary,
                color: 'white',
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#e56a00',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Place Order'
              )}
            </Button>
          </Box>
        </Dialog>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        mt: { xs: 3, sm: 4 },
        px: { xs: 2, sm: 3 },
        position: 'relative'
      }}
    >
      <BackButton />
      <Card
        elevation={0}
        sx={{
          bgcolor: 'white',
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Typography
            variant="h5"
            sx={{ 
              mb: 3,
              fontSize: { xs: '1.4rem', sm: '1.5rem' },
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            Your Cart
          </Typography>

          <Box 
            sx={{ 
              mb: 3,
              bgcolor: 'white',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            {cartItems.map((item) => (
              <Box
                key={item._id}
                sx={{
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': {
                    borderBottom: 'none'
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255, 121, 0, 0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: 'text.primary'
                    }}
                  >
                    {item.name}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: 'rgba(255, 121, 0, 0.05)',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(item._id, -1)}
                      sx={{
                        color: PALETTE.primary,
                        p: 0.8,
                        '&:hover': {
                          bgcolor: 'rgba(255, 121, 0, 0.1)'
                        }
                      }}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography
                      sx={{
                        mx: 2,
                        fontWeight: 500,
                        color: 'text.primary',
                        userSelect: 'none'
                      }}
                    >
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(item._id, 1)}
                      sx={{
                        color: PALETTE.primary,
                        p: 0.8,
                        '&:hover': {
                          bgcolor: 'rgba(255, 121, 0, 0.1)'
                        }
                      }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>

                  <Typography
                    sx={{
                      minWidth: '80px',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: PALETTE.primary
                    }}
                  >
                    ₹{(item.quantity * item.price).toFixed(2)}
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={() => handleRemoveItem(item._id)}
                    sx={{
                      color: 'error.light',
                      '&:hover': {
                        bgcolor: 'rgba(255, 121, 0, 0.1)',
                        color: 'error.main'
                      }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                color: 'text.secondary',
                fontSize: '0.9rem'
              }}
            >
              Table Number
            </Typography>
            <Select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              displayEmpty
              fullWidth
              sx={{
                height: '48px',
                bgcolor: 'white',
                borderRadius: '12px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: PALETTE.primary
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: PALETTE.primary
                }
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <MenuItem 
                  key={num} 
                  value={num}
                  sx={{
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'rgba(255, 121, 0, 0.1)'
                    }
                  }}
                >
                  Table {num}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2.5,
              bgcolor: 'white',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mb: 0.5
                }}
              >
                Total Amount
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary'
                }}
              >
                ₹{calculateTotal().toFixed(2)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={() => setOpenDialog(true)}
              disabled={loading || cartItems.length === 0}
              sx={{
                px: 4,
                py: 1.2,
                borderRadius: '10px',
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                boxShadow: 'none',
                bgcolor: PALETTE.primary,
                color: 'white',
                '&:hover': {
                  bgcolor: '#e56a00',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Place Order'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={() => !loading && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            bgcolor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          position: 'relative',
          p: { xs: 2.5, sm: 3 },
          pb: 0
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'text.primary',
              mb: 1.5
            }}
          >
            Complete Your Order
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              mb: 4,
              fontSize: '0.95rem'
            }}
          >
            Please provide your details to place the order
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  color: 'text.secondary',
                  fontSize: '0.9rem'
                }}
              >
                Name
              </Typography>
              <TextField
                autoFocus
                fullWidth
                placeholder="Enter your name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: 'white',
                    '& fieldset': {
                      borderColor: 'divider'
                    },
                    '&:hover fieldset': {
                      borderColor: PALETTE.primary
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: PALETTE.primary
                    }
                  }
                }}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  color: 'text.secondary',
                  fontSize: '0.9rem'
                }}
              >
                Phone Number
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter your phone number"
                variant="outlined"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: 'white',
                    '& fieldset': {
                      borderColor: 'divider'
                    },
                    '&:hover fieldset': {
                      borderColor: PALETTE.primary
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: PALETTE.primary
                    }
                  }
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box 
          sx={{ 
            p: { xs: 2.5, sm: 3 },
            display: 'flex',
            gap: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'white'
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setOpenDialog(false)}
            disabled={loading}
            sx={{
              flex: 1,
              py: 1.2,
              borderRadius: '12px',
              borderColor: 'divider',
              color: 'text.primary',
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              '&:hover': {
                borderColor: 'text.primary',
                bgcolor: 'rgba(255, 121, 0, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDirectOrder}
            disabled={loading}
            sx={{
              flex: 1,
              py: 1.2,
              borderRadius: '12px',
              bgcolor: PALETTE.primary,
              color: 'white',
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#e56a00',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Place Order'
            )}
          </Button>
        </Box>
      </Dialog>
    </Container>
  );
};

export default Cart;