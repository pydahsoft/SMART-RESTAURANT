import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Button,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Dashboard,
  ExitToApp,
  Menu as MenuIcon,
  PersonAdd,
  Person
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const theme = useTheme({
    palette: {
      primary: {
        main: '#FFB74D', // Light Orange
        contrastText: '#333333' // Dark Gray
      },
      secondary: {
        main: '#98FB98' // Pale Green
      },
      background: {
        default: '#FFF3E0' // Light Orange background
      }
    }
  });
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState(null);

  const isAdminRoute = location.pathname === '/admin';
  const isChefRoute = location.pathname === '/chef';
  const isHomeRoute = location.pathname === '/';
  const isServerRoute = location.pathname === '/server';

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClick = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleProfileIconClick = (event) => {
    setProfileMenuAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    
    handleMobileMenuClose();
    handleProfileMenuClose();
    await logout();
    navigate('/');
  };

  const handleDashboard = () => {
    handleClose();
    handleMobileMenuClose();
    handleProfileMenuClose();
    navigate('/orders');
  };

  // Render role indicator for Admin, Chef, and Server routes
  const renderRoleIndicator = () => {
    if (isAdminRoute) {
      return (
        <Typography
          variant="h6"
          sx={{
            color: '#333333',
            fontWeight: 'bold',
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          Admin
        </Typography>
      );
    }
    if (isChefRoute) {
      return (
        <Typography
          variant="h6"
          sx={{
            color: '#333333',
            fontWeight: 'bold',
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          Chef
        </Typography>
      );
    }
    if (isServerRoute) {
      return (
        <Typography
          variant="h6"
          sx={{
            color: '#333333',
            fontWeight: 'bold',
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          Server
        </Typography>
      );
    }
    return null;
  };

  // Render profile section only for non-admin, non-chef, and non-server routes
  const renderProfileSection = () => {
    if (isAdminRoute || isChefRoute || isServerRoute) {
      return renderRoleIndicator();
    }

    if (isMobile) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user && !isServerRoute && (
            <IconButton
              color="inherit"
              edge="end"
              onClick={handleMobileMenuClick}
              sx={{
                color: '#333333',
                '&:hover': {
                  backgroundColor: 'rgba(255,183,77,0.1)' // Light Orange with opacity
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: { sm: 2, md: 3 } 
      }}>
        {user && !isServerRoute && (
          <>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.9
                }
              }}
              onClick={handleProfileClick}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: '#FFB74D', // Light Orange
                  color: '#333333',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Typography 
                variant="body1" 
                sx={{ 
                  ml: 1, 
                  color: '#333333',
                  display: { sm: 'none', md: 'block' }
                }}
              >
                {user.name || 'User'}
              </Typography>
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: { 
                  width: '200px', 
                  mt: 1,
                  backgroundColor: '#FFF3E0', // Light Orange background
                  boxShadow: '0 4px 12px rgba(255,183,77,0.2)' // Light Orange shadow
                }
              }}
            >
              <MenuItem 
                onClick={handleDashboard}
                sx={{ 
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255,183,77,0.1)' // Light Orange with opacity
                  }
                }}
              >
                <ListItemIcon>
                  <Dashboard fontSize="small" sx={{ color: '#FFB74D' }} /> {/* Light Orange */}
                </ListItemIcon>
                <ListItemText primary="Orders" sx={{ color: '#333333' }} />
              </MenuItem>
              <Divider sx={{ backgroundColor: 'rgba(152,251,152,0.2)' }} />
              <MenuItem 
                onClick={handleLogout}
                sx={{ 
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255,183,77,0.1)' // Light Orange with opacity
                  }
                }}
              >
                <ListItemIcon>
                  <ExitToApp fontSize="small" sx={{ color: '#FFB74D' }} /> {/* Light Orange */}
                </ListItemIcon>
                <ListItemText primary="Logout" sx={{ color: '#333333' }} />
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
    );
  };

  // Render profile icon for homepage when user is logged in
  const renderHomeProfileIcon = () => {
    if (isHomeRoute && user) {
      return (
        <>
          <IconButton
            color="inherit"
            onClick={handleProfileIconClick}
            sx={{ 
              ml: 2,
              color: '#333333',
              '&:hover': {
                backgroundColor: 'rgba(255,183,77,0.1)' // Light Orange with opacity
              }
            }}
          >
            <Person />
          </IconButton>
          <Menu
            anchorEl={profileMenuAnchorEl}
            open={Boolean(profileMenuAnchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: { 
                width: '200px', 
                mt: 1,
                backgroundColor: '#FFF3E0', // Light Orange background
                boxShadow: '0 4px 12px rgba(255,183,77,0.2)' // Light Orange shadow
              }
            }}
          >
            <MenuItem 
              onClick={handleDashboard}
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255,183,77,0.1)' // Light Orange with opacity
                }
              }}
            >
              <ListItemIcon>
                <Dashboard fontSize="small" sx={{ color: '#FFB74D' }} /> {/* Light Orange */}
              </ListItemIcon>
              <ListItemText primary="Orders" sx={{ color: '#333333' }} />
            </MenuItem>
            <Divider sx={{ backgroundColor: 'rgba(152,251,152,0.2)' }} />
            <MenuItem 
              onClick={handleLogout}
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255,183,77,0.1)' // Light Orange with opacity
                }
              }}
            >
              <ListItemIcon>
                <ExitToApp fontSize="small" sx={{ color: '#FFB74D' }} /> {/* Light Orange */}
              </ListItemIcon>
              <ListItemText primary="Logout" sx={{ color: '#333333' }} />
            </MenuItem>
          </Menu>
        </>
      );
    }
    return null;
  };

  return (
    <AppBar 
      position="static" 
      sx={{
        backgroundColor: '#FFF3E0', // Light Orange background
        boxShadow: '0 2px 8px rgba(152,251,152,0.3)',
        backgroundImage: 'none',
        color: '#333333'
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          minHeight: { xs: '56px', sm: '64px' },
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 'bold',
              cursor: 'pointer',
              flexGrow: 0,
              color: '#333333',
              '&:hover': {
                opacity: 0.9
              }
            }}
            onClick={() => navigate('/')}
          >
            TestCafe
          </Typography>
          {renderHomeProfileIcon()}
        </Box>

        {renderProfileSection()}

        {isMobile && user && !isAdminRoute && !isChefRoute && !isServerRoute && (
          <Menu
            anchorEl={mobileMenuAnchorEl}
            open={Boolean(mobileMenuAnchorEl)}
            onClose={handleMobileMenuClose}
            PaperProps={{
              sx: { 
                width: '200px', 
                mt: 1,
                backgroundColor: '#FFF3E0', // Light Orange background
                boxShadow: '0 4px 12px rgba(255,183,77,0.2)' // Light Orange shadow
              }
            }}
          >
            <MenuItem 
              onClick={handleDashboard}
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255,183,77,0.1)' // Light Orange with opacity
                }
              }}
            >
              <ListItemIcon>
                <Dashboard fontSize="small" sx={{ color: '#FFB74D' }} /> {/* Light Orange */}
              </ListItemIcon>
              <ListItemText primary="Orders" sx={{ color: '#333333' }} />
            </MenuItem>
            <Divider sx={{ backgroundColor: 'rgba(152,251,152,0.2)' }} />
            <MenuItem 
              onClick={handleLogout}
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255,183,77,0.1)' // Light Orange with opacity
                }
              }}
            >
              <ListItemIcon>
                <ExitToApp fontSize="small" sx={{ color: '#FFB74D' }} /> {/* Light Orange */}
              </ListItemIcon>
              <ListItemText primary="Logout" sx={{ color: '#333333' }} />
            </MenuItem>
          </Menu>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;


