import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Alert,
  Menu,
  MenuItem
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  TableBar as TableBarIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import axios from 'axios';

const WaiterManagement = () => {
  // Updated color palette with new colors
  const colors = {
    coconutWhite: '#FFFFFF', // Changed to pure white
    cocoaBrown: '#000000', // Changed to black for text
    mangoYellow: '#FF6A28', // Primary orange for buttons/highlights
    seafoamMint: '#E91E63', // Notification pink
    cardBackground: '#F5F5F5', // Card background
    lightGrey: '#9E9E9E', // Light grey for text/icons
    starYellow: '#FFA500', // Star rating color
    addButtonRed: '#F44336' // Add button red
  };

  // State management (unchanged)
  const [waiters, setWaiters] = useState([]);
  const [newWaiter, setNewWaiter] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    assignedTables: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingWaiter, setEditingWaiter] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  // Check if phone number exists (unchanged)
  const checkPhoneNumberExists = (phoneNumber) => {
    return waiters.some(waiter => waiter.phoneNumber === phoneNumber);
  };

  // Fetch waiters from API (unchanged)
  const fetchWaiters = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/waiters');
      setWaiters(response.data);
    } catch (err) {
      setError('Failed to fetch waiters');
      console.error('Error fetching waiters:', err);
    }
  };

  useEffect(() => {
    fetchWaiters();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewWaiter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form inputs (unchanged)
  const validateInput = () => {
    if (!newWaiter.name || !newWaiter.phoneNumber || !newWaiter.password || !newWaiter.assignedTables) {
      setError('All fields are required');
      return false;
    }
    if (!/^\d{10}$/.test(newWaiter.phoneNumber)) {
      setError('Phone number must be 10 digits');
      return false;
    }
    if (checkPhoneNumberExists(newWaiter.phoneNumber)) {
      setError('A waiter with this phone number already exists');
      return false;
    }
    if (newWaiter.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    // Validate table numbers
    const tableNumbers = newWaiter.assignedTables.split(',').map(table => {
      const num = parseInt(table.trim());
      return isNaN(num) ? null : num;
    });

    if (tableNumbers.some(num => num === null || num < 1)) {
      setError('Invalid table numbers. Please enter positive numbers separated by commas.');
      return false;
    }

    return true;
  };

  // Handle form submission (unchanged)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateInput()) return;

    try {
      const tables = newWaiter.assignedTables
        .split(',')
        .map(table => parseInt(table.trim()))
        .filter(table => !isNaN(table) && table > 0);

      if (tables.length === 0) {
        setError('Please enter at least one valid table number');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/waiters/create', {
        name: newWaiter.name.trim(),
        phoneNumber: newWaiter.phoneNumber.trim(),
        password: newWaiter.password,
        assignedTables: tables
      });

      if (response.data) {
        setSuccess('Waiter created successfully!');
        setNewWaiter({
          name: '',
          phoneNumber: '',
          password: '',
          assignedTables: ''
        });
        fetchWaiters();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create waiter';
      setError(errorMessage);
      console.error('Error creating waiter:', err.response?.data || err.message);
    }
  };

  // Edit waiter functions (unchanged)
  const handleEditClick = (waiter) => {
    setEditingWaiter({
      ...waiter,
      password: '',
      assignedTables: waiter.assignedTables.join(', ')
    });
    setEditDialogOpen(true);
    setAnchorEl(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingWaiter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async () => {
    try {
      const tables = editingWaiter.assignedTables
        .split(',')
        .map(table => parseInt(table.trim()))
        .filter(table => !isNaN(table));

      const updateData = {
        name: editingWaiter.name,
        phoneNumber: editingWaiter.phoneNumber,
        assignedTables: tables
      };

      if (editingWaiter.password) {
        updateData.password = editingWaiter.password;
      }

      const response = await axios.put(
        `http://localhost:5000/api/waiters/${editingWaiter._id}`,
        updateData
      );

      setSuccess('Waiter updated successfully!');
      setEditDialogOpen(false);
      fetchWaiters();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update waiter');
    }
  };

  // Delete waiter functions (unchanged)
  const handleDeleteClick = (waiter) => {
    setSelectedWaiter(waiter);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/waiters/${selectedWaiter._id}`);
      setSuccess('Waiter deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedWaiter(null);
      fetchWaiters();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete waiter');
    }
  };

  // Menu functions (unchanged)
  const handleMenuClick = (event, waiter) => {
    setSelectedWaiter(waiter);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: 1200,
      mx: 'auto',
      backgroundColor: colors.coconutWhite,
      minHeight: '100vh'
    }}>
      {/* Create New Waiter Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
          borderRadius: 3,
          backgroundColor: colors.cardBackground,
          boxShadow: `0 4px 20px ${alpha(colors.cocoaBrown, 0.08)}`,
          border: `1px solid ${alpha(colors.cocoaBrown, 0.12)}`
        }}
      >
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            mb: 3,
            fontWeight: 700,
            color: colors.cocoaBrown,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <PersonIcon fontSize="large" sx={{ color: colors.mangoYellow }} />
          Create New Waiter
        </Typography>
        
        {/* Alerts */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${alpha('#f44336', 0.2)}`,
              backgroundColor: alpha('#f44336', 0.08)
            }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert 
            severity="success"
            sx={{ 
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(colors.seafoamMint, 0.3)}`,
              backgroundColor: alpha(colors.seafoamMint, 0.15)
            }}
          >
            {success}
          </Alert>
        )}

        {/* Waiter Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={newWaiter.name}
                onChange={handleInputChange}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: colors.lightGrey }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: alpha(colors.cocoaBrown, 0.3)
                    },
                    '&:hover fieldset': {
                      borderColor: colors.mangoYellow
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.mangoYellow,
                      boxShadow: `0 0 0 2px ${alpha(colors.mangoYellow, 0.2)}`
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={newWaiter.phoneNumber}
                onChange={handleInputChange}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: colors.lightGrey }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: alpha(colors.cocoaBrown, 0.3)
                    },
                    '&:hover fieldset': {
                      borderColor: colors.mangoYellow
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.mangoYellow,
                      boxShadow: `0 0 0 2px ${alpha(colors.mangoYellow, 0.2)}`
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Password</InputLabel>
                <OutlinedInput
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={newWaiter.password}
                  onChange={handleInputChange}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: colors.lightGrey }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                  sx={{
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: alpha(colors.cocoaBrown, 0.3)
                    },
                    '&:hover fieldset': {
                      borderColor: colors.mangoYellow
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.mangoYellow,
                      boxShadow: `0 0 0 2px ${alpha(colors.mangoYellow, 0.2)}`
                    }
                  }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Assigned Tables"
                name="assignedTables"
                value={newWaiter.assignedTables}
                onChange={handleInputChange}
                placeholder="1, 2, 3"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TableBarIcon sx={{ color: colors.lightGrey }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: alpha(colors.cocoaBrown, 0.3)
                    },
                    '&:hover fieldset': {
                      borderColor: colors.mangoYellow
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.mangoYellow,
                      boxShadow: `0 0 0 2px ${alpha(colors.mangoYellow, 0.2)}`
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  mt: 2,
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  backgroundColor: colors.addButtonRed,
                  color: colors.coconutWhite,
                  '&:hover': {
                    backgroundColor: alpha(colors.addButtonRed, 0.9),
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 8px ${alpha(colors.addButtonRed, 0.4)}`
                  },
                  transition: 'all 0.3s ease',
                  boxShadow: `0 2px 4px ${alpha(colors.addButtonRed, 0.3)}`
                }}
                startIcon={<AddIcon />}
                size="large"
              >
                Create Waiter
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Existing Waiters Section */}
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          mb: 3,
          fontWeight: 700,
          color: colors.cocoaBrown,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        <TableBarIcon fontSize="large" sx={{ color: colors.mangoYellow }} />
        Existing Waiters
      </Typography>
      
      <Grid container spacing={3}>
        {waiters.map((waiter) => (
          <Grid item xs={12} sm={6} md={4} key={waiter._id}>
            <Card 
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                backgroundColor: colors.cardBackground,
                boxShadow: `0 4px 12px ${alpha(colors.cocoaBrown, 0.08)}`,
                border: `1px solid ${alpha(colors.cocoaBrown, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: `0 8px 24px ${alpha(colors.cocoaBrown, 0.15)}`,
                  borderColor: alpha(colors.mangoYellow, 0.5)
                }
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  mb: 2 
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: colors.cocoaBrown
                    }}
                  >
                    {waiter.name}
                  </Typography>
                  <IconButton 
                    onClick={(e) => handleMenuClick(e, waiter)} 
                    size="small"
                    sx={{
                      color: alpha(colors.cocoaBrown, 0.7),
                      '&:hover': {
                        backgroundColor: alpha(colors.mangoYellow, 0.1),
                        color: colors.mangoYellow
                      }
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <Typography 
                  sx={{ 
                    color: colors.lightGrey,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                    fontSize: '0.95rem'
                  }}
                >
                  <PhoneIcon fontSize="small" sx={{ color: colors.lightGrey }} />
                  {waiter.phoneNumber}
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Typography 
                    variant="subtitle2" 
                    gutterBottom
                    sx={{ 
                      color: colors.lightGrey,
                      fontWeight: 600,
                      mb: 1,
                      fontSize: '0.85rem'
                    }}
                  >
                    ASSIGNED TABLES:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {waiter.assignedTables.map((table) => (
                      <Chip
                        key={table}
                        label={`Table ${table}`}
                        size="small"
                        icon={<TableBarIcon fontSize="small" />}
                        sx={{
                          borderRadius: 1.5,
                          backgroundColor: alpha(colors.mangoYellow, 0.1),
                          color: colors.cocoaBrown,
                          '& .MuiChip-icon': {
                            color: colors.lightGrey,
                            fontSize: '1rem'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 3,
            minWidth: 180,
            boxShadow: `0 8px 24px ${alpha(colors.cocoaBrown, 0.15)}`,
            border: `1px solid ${alpha(colors.cocoaBrown, 0.1)}`
          }
        }}
      >
        <MenuItem 
          onClick={() => handleEditClick(selectedWaiter)}
          sx={{
            py: 1.5,
            px: 2,
            fontSize: '0.95rem',
            '&:hover': {
              backgroundColor: alpha(colors.mangoYellow, 0.1)
            }
          }}
        >
          <EditIcon sx={{ mr: 2, color: colors.mangoYellow }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeleteClick(selectedWaiter)} 
          sx={{ 
            py: 1.5,
            px: 2,
            fontSize: '0.95rem',
            color: colors.addButtonRed,
            '&:hover': {
              backgroundColor: alpha(colors.addButtonRed, 0.08)
            }
          }}
        >
          <DeleteIcon sx={{ mr: 2 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(colors.cocoaBrown, 0.2)}`,
            backgroundColor: colors.cardBackground,
            border: `1px solid ${alpha(colors.cocoaBrown, 0.1)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          pt: 3,
          px: 3,
          typography: 'h6',
          fontWeight: 700,
          color: colors.cocoaBrown,
          backgroundColor: alpha(colors.mangoYellow, 0.1),
          borderBottom: `1px solid ${alpha(colors.mangoYellow, 0.3)}`
        }}>
          Edit Waiter Details
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={editingWaiter?.name || ''}
              onChange={handleEditInputChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: alpha(colors.cocoaBrown, 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: colors.mangoYellow
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.mangoYellow,
                    boxShadow: `0 0 0 2px ${alpha(colors.mangoYellow, 0.2)}`
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              value={editingWaiter?.phoneNumber || ''}
              onChange={handleEditInputChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: alpha(colors.cocoaBrown, 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: colors.mangoYellow
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.mangoYellow,
                    boxShadow: `0 0 0 2px ${alpha(colors.mangoYellow, 0.2)}`
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="New Password (leave blank to keep current)"
              name="password"
              type="password"
              value={editingWaiter?.password || ''}
              onChange={handleEditInputChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: alpha(colors.cocoaBrown, 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: colors.mangoYellow
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.mangoYellow,
                    boxShadow: `0 0 0 2px ${alpha(colors.mangoYellow, 0.2)}`
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="Assigned Tables (comma-separated)"
              name="assignedTables"
              value={editingWaiter?.assignedTables || ''}
              onChange={handleEditInputChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: alpha(colors.cocoaBrown, 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: colors.mangoYellow
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.mangoYellow,
                    boxShadow: `0 0 0 2px ${alpha(colors.mangoYellow, 0.2)}`
                  }
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              color: colors.cocoaBrown,
              borderColor: alpha(colors.cocoaBrown, 0.5),
              '&:hover': {
                borderColor: colors.cocoaBrown,
                backgroundColor: alpha(colors.cocoaBrown, 0.04)
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              backgroundColor: colors.mangoYellow,
              color: colors.coconutWhite,
              '&:hover': {
                backgroundColor: alpha(colors.mangoYellow, 0.9),
                boxShadow: `0 4px 8px ${alpha(colors.mangoYellow, 0.3)}`
              },
              boxShadow: `0 2px 4px ${alpha(colors.mangoYellow, 0.2)}`
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            width: '100%',
            maxWidth: 400,
            backgroundColor: colors.cardBackground,
            boxShadow: `0 8px 32px ${alpha(colors.cocoaBrown, 0.2)}`,
            border: `1px solid ${alpha(colors.addButtonRed, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          pt: 3,
          typography: 'h6',
          fontWeight: 700,
          color: colors.addButtonRed,
          backgroundColor: alpha(colors.addButtonRed, 0.08),
          borderBottom: `1px solid ${alpha(colors.addButtonRed, 0.2)}`
        }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography sx={{ color: colors.lightGrey, mb: 1 }}>
            Are you sure you want to permanently delete waiter:
          </Typography>
          <Typography sx={{ 
            fontWeight: 600, 
            color: colors.cocoaBrown,
            fontSize: '1.1rem',
            mb: 2
          }}>
            {selectedWaiter?.name}
          </Typography>
          <Typography sx={{ 
            color: colors.lightGrey,
            fontSize: '0.9rem',
            fontStyle: 'italic'
          }}>
            This action cannot be undone and will remove all associated data.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              color: colors.cocoaBrown,
              borderColor: alpha(colors.cocoaBrown, 0.5),
              '&:hover': {
                borderColor: colors.cocoaBrown,
                backgroundColor: alpha(colors.cocoaBrown, 0.04)
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              backgroundColor: colors.addButtonRed,
              '&:hover': {
                backgroundColor: '#d32f2f',
                boxShadow: `0 4px 8px ${alpha(colors.addButtonRed, 0.3)}`
              },
              boxShadow: `0 2px 4px ${alpha(colors.addButtonRed, 0.2)}`
            }}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WaiterManagement;