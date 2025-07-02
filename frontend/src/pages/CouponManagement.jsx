import React, { useState, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, MenuItem, Select, FormControl, InputLabel, Switch, FormControlLabel, Snackbar, Alert, Grid, Paper, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = 'http://localhost:5000/api/coupons';

const defaultForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscount: '',
  minOrderAmount: '',
  validFrom: '',
  validTill: '',
  maxUses: '',
  maxUsesPerUser: '',
  isActive: true,
  description: ''
};

const CouponManagement = () => {
  const [form, setForm] = useState(defaultForm);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const fetchCoupons = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setCoupons(data);
    } catch {
      setCoupons([]);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = { ...form };
    if (form.discountType !== 'percentage') delete payload.maxDiscount;
    try {
      const res = await fetch(editId ? `${API_URL}/${editId}` : API_URL, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccess(true);
        setForm(defaultForm);
        setOpen(false);
        setEditId(null);
        fetchCoupons();
      } else {
        setError('Failed to save coupon.');
      }
    } catch (err) {
      setError('Failed to save coupon.');
    }
  };

  const handleEdit = coupon => {
    setForm({ ...coupon, validFrom: coupon.validFrom?.slice(0,10), validTill: coupon.validTill?.slice(0,10) });
    setEditId(coupon._id);
    setOpen(true);
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCoupons();
    } catch (err) {}
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff7900' }}>Coupon Management</Typography>
        <Button variant="contained" onClick={() => { setForm(defaultForm); setEditId(null); setOpen(true); }} sx={{ borderRadius: 3, background: 'linear-gradient(90deg, #ff7900 0%, #ffb347 100%)', color: '#fff', fontWeight: 600 }}>Add Coupon</Button>
      </Box>
      <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Max Discount</TableCell>
              <TableCell>Min Order</TableCell>
              <TableCell>Valid From</TableCell>
              <TableCell>Valid Till</TableCell>
              <TableCell>Max Uses</TableCell>
              <TableCell>Per User</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map(coupon => (
              <TableRow key={coupon._id}>
                <TableCell>{coupon.code}</TableCell>
                <TableCell>{coupon.discountType}</TableCell>
                <TableCell>{coupon.discountValue}</TableCell>
                <TableCell>{coupon.discountType === 'percentage' ? coupon.maxDiscount : '-'}</TableCell>
                <TableCell>{coupon.minOrderAmount || '-'}</TableCell>
                <TableCell>{coupon.validFrom?.slice(0,10)}</TableCell>
                <TableCell>{coupon.validTill?.slice(0,10)}</TableCell>
                <TableCell>{coupon.maxUses}</TableCell>
                <TableCell>{coupon.maxUsesPerUser}</TableCell>
                <TableCell>{coupon.isActive ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>{coupon.description || '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(coupon)}><EditIcon color="warning" /></IconButton>
                  <IconButton onClick={() => handleDelete(coupon._id)}><DeleteIcon color="error" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Coupon' : 'Add New Coupon'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Coupon Code" name="code" value={form.code} onChange={handleChange} fullWidth required placeholder="SAVE20, WELCOME10" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Discount Type</InputLabel>
                  <Select name="discountType" value={form.discountType} onChange={handleChange} label="Discount Type">
                    <MenuItem value="percentage">Percentage (%)</MenuItem>
                    <MenuItem value="flat">Flat Amount (₹)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={form.discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'} name="discountValue" value={form.discountValue} onChange={handleChange} type="number" fullWidth required />
              </Grid>
              {form.discountType === 'percentage' && (
                <Grid item xs={12} sm={6}>
                  <TextField label="Maximum Discount (₹)" name="maxDiscount" value={form.maxDiscount} onChange={handleChange} type="number" fullWidth />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField label="Minimum Order Amount (₹)" name="minOrderAmount" value={form.minOrderAmount} onChange={handleChange} type="number" fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Valid From" name="validFrom" value={form.validFrom} onChange={handleChange} type="date" fullWidth InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Valid Till" name="validTill" value={form.validTill} onChange={handleChange} type="date" fullWidth InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Max Uses Per Coupon" name="maxUses" value={form.maxUses} onChange={handleChange} type="number" fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Max Uses Per User" name="maxUsesPerUser" value={form.maxUsesPerUser} onChange={handleChange} type="number" fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} name="isActive" color="warning" />} label="Active" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Coupon Description" name="description" value={form.description} onChange={handleChange} fullWidth multiline minRows={2} />
              </Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editId ? 'Update Coupon' : 'Create Coupon'}</Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>{editId ? 'Coupon updated successfully!' : 'Coupon created successfully!'}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CouponManagement;
