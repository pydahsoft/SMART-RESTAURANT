import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Tabs,
  Tab,
  Box,
  Snackbar,
  useTheme,
  useMediaQuery,
  IconButton,
  Badge,
  Avatar,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  Slide,
  Grow,
  Zoom,
  Fade
} from '@mui/material';
import {
  ShoppingCart,
  Search,
  Star,
  LocalFireDepartment,
  NewReleases,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { PALETTE } from '../themePalette';

const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Beverages'];
const filters = ['Popular', 'New', 'Spicy', 'Vegetarian', 'Recommended'];

// Fallback images for each category
const fallbackImages = {
  'Starters': 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?auto=format&fit=crop&w=500&q=60',
  'Main Course': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=60',
  'Desserts': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=500&q=60',
  'Beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=500&q=60',
  'default': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=60'
};

// Add keyframes for rotation animation
const rotateStyle = `
@keyframes rotate360 {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;

const Home = () => {
  const theme = useTheme({
    palette: {
      primary: {
        main: '#FFC107', // Mango Yellow
        contrastText: '#4E342E' // Cocoa Brown
      },
      secondary: {
        main: '#AED581', // Seafoam Mint
        contrastText: '#4E342E' // Cocoa Brown
      },
      background: {
        default: '#FFF8E1', // Coconut White
        paper: '#FFFFFF'
      },
      text: {
        primary: '#4E342E', // Cocoa Brown
        secondary: '#5D4037'
      }
    },
    typography: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        color: '#4E342E'
      },
      h2: {
        fontWeight: 600,
        color: '#4E342E'
      },
      h3: {
        fontWeight: 600,
        color: '#4E342E'
      },
      h4: {
        fontWeight: 500,
        color: '#4E342E'
      },
      h5: {
        fontWeight: 500,
        color: '#4E342E'
      },
      h6: {
        fontWeight: 500,
        color: '#4E342E'
      },
      body1: {
        color: '#5D4037'
      },
      body2: {
        color: '#5D4037'
      }
    }
  });
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeFilter, setActiveFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [foodItems, setFoodItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [imageLoadStatus, setImageLoadStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState(() => {
    const savedCart = sessionStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const handleImageLoad = (id) => {
    setImageLoadStatus(prev => ({ ...prev, [id]: true }));
  };

  const handleImageError = (e, id, category) => {
    if (e.target) {
      e.target.src = fallbackImages[category] || fallbackImages['default'];
      setImageLoadStatus(prev => ({ ...prev, [id]: false }));
    }
  };

  // Navigation functions
  const navigateToCart = () => {
    navigate('/cart');
  };

  // Fetch food items
  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/menu');
        setFoodItems(response.data.map(item => ({
          ...item,
          isNew: Math.random() > 0.7,
          isPopular: Math.random() > 0.5,
          rating: (Math.random() * 2 + 3).toFixed(1)
        })));
      } catch (error) {
        console.error('Error fetching food items:', error);
      }
    };
    fetchFoodItems();
  }, []);

  // Filter items based on category, filter and search
  const filteredItems = foodItems.filter(item => {
    if (!item.isAvailable) return false; // Only show available today
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (activeFilter === 'Popular') matchesFilter = item.isPopular;
    if (activeFilter === 'New') matchesFilter = item.isNew;
    if (activeFilter === 'Spicy') matchesFilter = item.tags?.includes('spicy');
    if (activeFilter === 'Vegetarian') matchesFilter = item.tags?.includes('vegetarian');
    
    return matchesCategory && matchesSearch && matchesFilter;
  });

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Effect to load cart from sessionStorage
  useEffect(() => {
    const savedCart = sessionStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
      const parsedCart = JSON.parse(savedCart);
      setCartCount(parsedCart.reduce((total, item) => total + item.quantity, 0));
    }
  }, []);

  const handleAddToCart = (item) => {
    const updatedCart = [...cart];
    const existingItemIndex = updatedCart.findIndex(cartItem => cartItem._id === item._id);

    if (existingItemIndex >= 0) {
      updatedCart[existingItemIndex].quantity += 1;
    } else {
      updatedCart.push({
        ...item,
        quantity: 1
      });
    }

    // Update state and sessionStorage
    setCart(updatedCart);
    sessionStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartCount(updatedCart.reduce((total, item) => total + item.quantity, 0));
    setSnackbarMessage(`${item.name} added to cart!`);
    setSnackbarOpen(true);
  };

  const toggleFavorite = (itemId) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  return (
    <>
      <style>{rotateStyle}</style>
      <Container 
        maxWidth="xl" 
        sx={{ 
          mt: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1, sm: 2, md: 3 },
          backgroundColor: PALETTE.background // Coconut White background
        }}
      >
        {/* Hero Section with animations and chef image */}
        <Box sx={{ 
          mb: 4,
          p: 4,
          borderRadius: 4,
          backgroundColor: PALETTE.primary, // Mango Yellow
          color: PALETTE.contrastText, // Cocoa Brown
          boxShadow: '0 8px 24px rgba(255,193,7,0.3)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: { xs: 'auto', md: '400px' }
        }}>
          {/* Chef Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              type: 'spring',
              stiffness: 100,
              damping: 10,
              delay: 0.4
            }}
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: { xs: '20px', md: '40px' }
            }}
          >
            <Box
              component="img"
              src="https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=500&q=80"
              alt="Chef preparing food"
              sx={{
                width: { xs: '200px', md: '300px' },
                height: { xs: '200px', md: '300px' },
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                animation: 'rotate360 7s linear infinite'
              }}
            />
          </motion.div>

          {/* Text Content */}
          <Box sx={{ 
            flex: 1,
            textAlign: { xs: 'center', md: 'left' },
            pl: { xs: 0, md: 4 },
            pr: { xs: 0, md: 2 }
          }}>
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                type: 'spring',
                stiffness: 100,
                damping: 10,
                delay: 0.1
              }}
            >
              <Typography variant="h3" sx={{ 
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2rem', sm: '3rem' },
                color: PALETTE.text // Cocoa Brown
              }}>
                Delicious Food Delivered
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                type: 'spring',
                stiffness: 100,
                damping: 10,
                delay: 0.3
              }}
            >
              <Typography variant="h6" sx={{ 
                mb: 3,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                color: PALETTE.text // Cocoa Brown
              }}>
                Order your favorite meals from our premium menu
              </Typography>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: 'spring',
                stiffness: 100,
                damping: 10,
                delay: 0.5
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search for dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ 
                  maxWidth: 600,
                  mx: { xs: 'auto', md: 0 },
                  backgroundColor: 'white',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    color: PALETTE.text // Cocoa Brown
                  },
                  '& .MuiInputLabel-root': {
                    color: PALETTE.text // Cocoa Brown
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" sx={{ color: PALETTE.text }} />
                    </InputAdornment>
                  ),
                }}
              />
            </motion.div>
          </Box>
        </Box>

        {/* Category Tabs & Filters */}
        <Box sx={{ 
          mb: 4,
          backgroundColor: PALETTE.background // Coconut White
        }}>
          <Tabs
            value={selectedCategory}
            onChange={(e, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 2,
              '& .MuiTabs-indicator': {
                backgroundColor: PALETTE.primary, // Mango Yellow
                height: 3
              },
              backgroundColor: PALETTE.background // Coconut White
            }}
          >
            {categories.map((category) => (
              <Tab 
                key={category} 
                label={category} 
                value={category}
                sx={{
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: selectedCategory === category ? 600 : 'normal',
                  color: selectedCategory === category ? PALETTE.primary : PALETTE.text, // Mango Yellow / Cocoa Brown
                  minWidth: 'unset',
                  px: 2,
                  mx: 1,
                  backgroundColor: PALETTE.background // Coconut White
                }}
              />
            ))}
          </Tabs>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1,
            backgroundColor: PALETTE.background // Coconut White
          }}>
            {filters.map((filter) => (
              <Chip
                key={filter}
                label={filter}
                clickable
                variant={activeFilter === filter ? 'filled' : 'outlined'}
                color={activeFilter === filter ? 'primary' : 'default'}
                onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
                icon={
                  filter === 'Popular' ? <Star fontSize="small" /> :
                  filter === 'New' ? <NewReleases fontSize="small" /> :
                  filter === 'Spicy' ? <LocalFireDepartment fontSize="small" /> : null
                }
                sx={{
                  borderRadius: 2,
                  px: 1,
                  backgroundColor: activeFilter === filter ? PALETTE.primary : PALETTE.background, // Mango Yellow / Coconut White
                  color: activeFilter === filter ? PALETTE.contrastText : PALETTE.text, // Cocoa Brown
                  borderColor: PALETTE.text, // Cocoa Brown
                  '& .MuiChip-icon': {
                    color: activeFilter === filter ? PALETTE.text : PALETTE.primary // Cocoa Brown / Mango Yellow
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Food Items Grid */}
        <Grid 
          container 
          spacing={{ xs: 2, sm: 3, md: 4 }}
          sx={{ 
            mx: 'auto',
            maxWidth: '1600px',
            backgroundColor: PALETTE.background // Coconut White
          }}
        >
          {filteredItems.map((item, index) => (
            <Grid 
              item 
              key={item._id} 
              xs={12} 
              sm={6} 
              md={4} 
              lg={3}
              sx={{ 
                display: 'flex',
                backgroundColor: PALETTE.background // Coconut White
              }}
            >
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                style={{ 
                  width: '100%',
                  backgroundColor: PALETTE.background // Coconut White
                }}
              >
                <Card 
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    backgroundColor: 'white',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(255,193,7,0.2)'
                    }
                  }}
                >
                  {/* Favorite Button */}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 2,
                      color: favorites.includes(item._id) ? PALETTE.primary : PALETTE.text, // Mango Yellow / Cocoa Brown
                      backgroundColor: 'rgba(255,248,225,0.2)', // Coconut White with opacity
                      '&:hover': {
                        backgroundColor: 'rgba(255,248,225,0.3)' // Coconut White with opacity
                      }
                    }}
                    onClick={() => toggleFavorite(item._id)}
                  >
                    {favorites.includes(item._id) ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>

                  {/* Badges */}
                  {item.isNew && (
                    <Box sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 2,
                      backgroundColor: PALETTE.primary, // Mango Yellow
                      color: PALETTE.contrastText, // Cocoa Brown
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      NEW
                    </Box>
                  )}
                  {item.isPopular && (
                    <Box sx={{
                      position: 'absolute',
                      top: item.isNew ? 40 : 8,
                      left: 8,
                      zIndex: 2,
                      backgroundColor: PALETTE.primary, // Mango Yellow
                      color: PALETTE.contrastText, // Cocoa Brown
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      POPULAR
                    </Box>
                  )}

                  {/* Image */}
                  <Box sx={{ 
                    position: 'relative', 
                    paddingTop: '75%',
                    bgcolor: PALETTE.background, // Coconut White
                    overflow: 'hidden'
                  }}>
                    <CardMedia
                      component="img"
                      alt={item.name}
                      src={item.image}
                      onLoad={() => handleImageLoad(item._id)}
                      onError={(e) => handleImageError(e, item._id, item.category)}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                        '&:hover': {
                          transform: 'scale(1.1)'
                        }
                      }}
                    />
                  </Box>

                  {/* Content */}
                  <CardContent 
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      p: 3,
                      backgroundColor: 'white'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography 
                        variant="h6" 
                        sx={{
                          fontWeight: 700,
                          color: PALETTE.text, // Cocoa Brown
                          lineHeight: 1.2
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Star sx={{ color: PALETTE.star, fontSize: '1rem', mr: 0.5 }} /> {/* Mango Yellow */}
                        <Typography variant="body2" sx={{ fontWeight: 600, color: PALETTE.text }}> {/* Cocoa Brown */}
                          {item.rating}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      sx={{
                        color: PALETTE.grey, // Darker Cocoa Brown
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {item.description}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 'auto',
                      backgroundColor: 'white'
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{
                          fontWeight: 700,
                          color: PALETTE.primary // Mango Yellow
                        }}
                      >
                        ₹{item.price.toFixed(2)}
                      </Typography>
                      <Button
                        variant="contained"
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          fontWeight: 600,
                          textTransform: 'none',
                          boxShadow: 'none',
                          backgroundColor: PALETTE.primary, // Mango Yellow
                          color: PALETTE.contrastText, // Cocoa Brown
                          '&:hover': {
                            backgroundColor: '#FFB300', // Darker Mango Yellow
                            boxShadow: '0 4px 8px rgba(255,193,7,0.3)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => handleAddToCart(item)}
                      >
                        Add to Cart
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 10,
            opacity: 0.7,
            backgroundColor: PALETTE.background // Coconut White
          }}>
            <Typography variant="h5" sx={{ mb: 2, color: PALETTE.text }}> {/* Cocoa Brown */}
              No items found
            </Typography>
            <Typography variant="body1" sx={{ color: PALETTE.text }}> {/* Cocoa Brown */}
              Try adjusting your search or filters
            </Typography>
          </Box>
        )}

        {/* Floating Cart Button */}
        {cartCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
              backgroundColor: PALETTE.background // Coconut White
            }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={
                <Badge 
                  badgeContent={cartCount} 
                  color="secondary"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: PALETTE.background, // Coconut White
                      color: PALETTE.primary, // Mango Yellow
                      fontWeight: 'bold'
                    }
                  }}
                >
                  <ShoppingCart sx={{ color: PALETTE.text }} /> {/* Cocoa Brown */}
                </Badge>
              }
              onClick={() => navigate('/cart')}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 50,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(255,193,7,0.3)',
                backgroundColor: PALETTE.primary, // Mango Yellow
                color: PALETTE.contrastText, // Cocoa Brown
                '&:hover': {
                  backgroundColor: '#FFB300', // Darker Mango Yellow
                  boxShadow: '0 6px 16px rgba(255,193,7,0.4)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              View Cart
            </Button>
          </motion.div>
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={1500}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          TransitionComponent={Slide}
          sx={{
            '& .MuiSnackbarContent-root': {
              backgroundColor: PALETTE.primary, // Mango Yellow
              color: PALETTE.contrastText, // Cocoa Brown
              borderRadius: 3,
              fontWeight: 500
            }
          }}
        />
      </Container>
    </>
  );
};

export default Home;