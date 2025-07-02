import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl, InputLabel,
  InputAdornment, FormGroup, FormControlLabel, Switch, Chip, Stack
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import { PALETTE } from '../themePalette';
import { buildApiUrl } from '../utils/config';

const API_URL = buildApiUrl('/menu');

const defaultForm = {
  name: '',
  description: '',
  price: '',
  category: 'Starters',
  image: '',
  isAvailable: true
};

const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Beverages'];

const FoodManagement = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showAvailable, setShowAvailable] = useState(false);

  const fetchFood = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setFoodItems(data);
  };

  useEffect(() => { fetchFood(); }, []);

  // Filtering logic
  const filteredItems = foodItems.filter(item => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchesAvailable = !showAvailable || item.isAvailable;
    return matchesCategory && matchesSearch && matchesAvailable;
  });

  const handleOpen = (item = null) => {
    if (item) {
      setForm(item);
      setEditId(item._id);
    } else {
      setForm(defaultForm);
      setEditId(null);
    }
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async () => {
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API_URL}/${editId}` : API_URL;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    fetchFood();
    handleClose();
  };

  const handleDelete = async id => {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchFood();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: PALETTE.primary, letterSpacing: 1 }}>Food Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ borderRadius: 3, background: 'linear-gradient(90deg, #ff7900 0%, #ffb347 100%)', color: '#fff', fontWeight: 600, boxShadow: '0 4px 20px 0 rgba(255,121,0,0.15)' }}>Add Food Item</Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 2px 12px 0 rgba(255,121,0,0.08)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <TextField
            variant="outlined"
            placeholder="Search food..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 3, background: '#fff' }
            }}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            {categories.map(cat => (
              <Chip
                key={cat}
                label={cat}
                color={category === cat ? 'warning' : 'default'}
                variant={category === cat ? 'filled' : 'outlined'}
                onClick={() => setCategory(cat)}
                sx={{ fontWeight: 500, fontSize: 15, borderRadius: 2, px: 1.5 }}
              />
            ))}
          </Stack>
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={showAvailable} onChange={e => setShowAvailable(e.target.checked)} color="warning" />}
              label="Available Today Only"
            />
          </FormGroup>
        </Stack>
      </Paper>
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 16px 0 rgba(255,121,0,0.10)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Available</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map(item => (
              <TableRow key={item._id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>₹{item.price}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell><img src={item.image} alt={item.name} width={50} /></TableCell>
                <TableCell>{item.isAvailable ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(item)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(item._id)} color="error"><Delete /></IconButton>
                  <Button
                    size="small"
                    variant={item.isAvailable ? 'outlined' : 'contained'}
                    color={item.isAvailable ? 'warning' : 'success'}
                    sx={{ ml: 1 }}
                    onClick={async () => {
                      await fetch(`${API_URL}/${item._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...item, isAvailable: !item.isAvailable })
                      });
                      fetchFood();
                    }}
                  >
                    {item.isAvailable ? 'Hide for Today' : 'Show for Today'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Edit Food Item' : 'Add Food Item'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Description" name="description" value={form.description} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Price" name="price" value={form.price} onChange={handleChange} type="number" fullWidth required />
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select name="category" value={form.category} onChange={handleChange} label="Category">
              <MenuItem value="Starters">Starters</MenuItem>
              <MenuItem value="Main Course">Main Course</MenuItem>
              <MenuItem value="Desserts">Desserts</MenuItem>
              <MenuItem value="Beverages">Beverages</MenuItem>
            </Select>
          </FormControl>
          <TextField margin="dense" label="Image URL" name="image" value={form.image} onChange={handleChange} fullWidth required />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodManagement;
