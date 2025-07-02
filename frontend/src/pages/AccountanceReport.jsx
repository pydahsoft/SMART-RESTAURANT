import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const COLORS = {
  orange: '#ff7900',
  orangeLight: 'rgba(255, 121, 0, 0.08)',
  orangeLighter: 'rgba(255, 121, 0, 0.04)'
};

function isToday(dateStr) {
  if (!dateStr) return false;
  const orderDate = new Date(dateStr);
  const now = new Date();
  const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return orderDay.getTime() === today.getTime();
}

const AccountanceReport = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalDiscount: 0,
    totalFinal: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:5000/api/orders/all-orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        if (Array.isArray(data)) {
          const todayOrders = data.filter(order => isToday(order.createdAt));
          setOrders(todayOrders);
          // Calculate summary
          let totalRevenue = 0, totalDiscount = 0, totalFinal = 0;
          todayOrders.forEach(order => {
            const total = typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(order.totalAmount) || 0;
            const discounted = order.discountedAmount && order.discountedAmount < total ? order.discountedAmount : total;
            totalRevenue += total;
            totalFinal += discounted;
            totalDiscount += (total - discounted);
          });
          setSummary({
            totalOrders: todayOrders.length,
            totalRevenue,
            totalDiscount,
            totalFinal
          });
        } else {
          setOrders([]);
        }
      } catch (err) {
        setError('Failed to fetch orders.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleDownload = () => {
    if (!orders || orders.length === 0) return;
    // Prepare data for Excel
    const data = orders.map(order => {
      const total = typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(order.totalAmount) || 0;
      const discounted = order.discountedAmount && order.discountedAmount < total ? order.discountedAmount : total;
      const discountAmount = total - discounted;
      return {
        'Order ID': '#' + (order.sequenceNumber ? String(order.sequenceNumber).padStart(3, '0') : (order._id ? order._id.toString().slice(-6) : 'N/A')),
        'Table': order.tableNumber || 'N/A',
        'Time': new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'Payment': order.paymentMethod || 'N/A',
        'Total Amount': total,
        'Coupon Discount Amount': discountAmount > 0 ? discountAmount : 0,
        'Final Amount after Discount': discounted
      };
    });
    // Add total row
    const totalFinal = orders.reduce((sum, order) => {
      const total = typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(order.totalAmount) || 0;
      const discounted = order.discountedAmount && order.discountedAmount < total ? order.discountedAmount : total;
      return sum + discounted;
    }, 0);
    data.push({
      'Order ID': '',
      'Table': '',
      'Time': '',
      'Payment': '',
      'Total Amount': '',
      'Coupon Discount Amount': 'Total',
      'Final Amount after Discount': totalFinal
    });
    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');
    // Download
    XLSX.writeFile(wb, `Daily_Accountance_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };
  const handlePrint = async () => {
    const reportElement = document.getElementById('accountance-report-content');
    if (!reportElement) return;
    const canvas = await html2canvas(reportElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    pdf.save(`Daily_Accountance_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };
  const handleSend = () => {
    // Implement send logic (e.g., email)
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon sx={{ color: COLORS.orange, fontSize: 28 }} />}
          sx={{
            minWidth: 0,
            borderRadius: '50%',
            background: COLORS.orangeLighter,
            boxShadow: '0 2px 8px 0 rgba(255,121,0,0.08)',
            mr: 2,
            p: 1.2,
            '&:hover': {
              background: COLORS.orangeLight
            }
          }}
        />
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Daily Accountance Report
        </Typography>
      </Box>
      <div id="accountance-report-content">
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 4, background: COLORS.orangeLighter, boxShadow: '0 4px 24px 0 rgba(255,121,0,0.08)', border: `1px solid ${COLORS.orangeLight}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: COLORS.orange, fontWeight: 700, fontSize: '1.5rem' }}>
              Summary
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle2" sx={{ color: '#888', fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })}
              </Typography>
              <Typography variant="subtitle2" sx={{ color: COLORS.orange, fontWeight: 700 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long' })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#888', fontWeight: 600 }}>Total Orders</Typography>
              <Typography variant="h5" sx={{ color: '#111', fontWeight: 700 }}>{summary.totalOrders}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#888', fontWeight: 600 }}>Total Revenue</Typography>
              <Typography variant="h5" sx={{ color: COLORS.orange, fontWeight: 700 }}>₹{summary.totalRevenue.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#888', fontWeight: 600 }}>Total Discount</Typography>
              <Typography variant="h5" sx={{ color: '#d84315', fontWeight: 700 }}>₹{summary.totalDiscount.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#888', fontWeight: 600 }}>Final Amount</Typography>
              <Typography variant="h5" sx={{ color: '#1b5e20', fontWeight: 700 }}>₹{summary.totalFinal.toFixed(2)}</Typography>
            </Box>
          </Box>
        </Paper>
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Orders</Typography>
          {loading ? (
            <Box sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">Loading...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : orders.length === 0 ? (
            <Box sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No orders to display.</Typography>
            </Box>
          ) : (
            <TableContainer sx={{ borderRadius: 3, boxShadow: '0 4px 24px 0 rgba(255,121,0,0.08)', border: `1px solid ${COLORS.orangeLight}` }}>
              <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow sx={{ background: COLORS.orangeLighter }}>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.orange, fontSize: '1.1rem', borderTopLeftRadius: 12 }}>Order ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.orange, fontSize: '1.1rem' }}>Table</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.orange, fontSize: '1.1rem' }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.orange, fontSize: '1.1rem' }}>Payment</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.orange, fontSize: '1.1rem' }}>Total Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.orange, fontSize: '1.1rem' }}>Coupon Discount Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.orange, fontSize: '1.1rem', borderTopRightRadius: 12 }}>Final Amount after Discount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order, idx) => {
                    const total = typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(order.totalAmount) || 0;
                    const discounted = order.discountedAmount && order.discountedAmount < total ? order.discountedAmount : total;
                    const discountAmount = total - discounted;
                    return (
                      <TableRow key={order._id || order.orderId} sx={{ background: idx % 2 === 0 ? COLORS.orangeLighter : COLORS.orangeLight, transition: 'background 0.2s', '&:hover': { background: '#fffbe6' } }}>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.orange }}>{'#' + (order.sequenceNumber ? String(order.sequenceNumber).padStart(3, '0') : (order._id ? order._id.toString().slice(-6) : 'N/A'))}</TableCell>
                        <TableCell sx={{ color: '#333', fontWeight: 500 }}>{order.tableNumber || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#333', fontWeight: 500 }}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell sx={{ color: '#333', fontWeight: 500, textTransform: 'capitalize' }}>{order.paymentMethod || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#333', fontWeight: 500 }}>₹{total.toFixed(2)}</TableCell>
                        <TableCell sx={{ color: discountAmount > 0 ? COLORS.orange : '#888', fontWeight: 600 }}>{discountAmount > 0 ? `-₹${discountAmount.toFixed(2)}` : '-'}</TableCell>
                        <TableCell sx={{ color: '#1b5e20', fontWeight: 700 }}>₹{discounted.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Total row for Final Amount after Discount */}
                  <TableRow sx={{ background: COLORS.orangeLighter }}>
                    <TableCell colSpan={6} sx={{ fontWeight: 700, color: COLORS.orange, textAlign: 'right', fontSize: '1.1rem', borderBottomLeftRadius: 12 }}>Total Final Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1b5e20', fontSize: '1.1rem', borderBottomRightRadius: 12 }}>
                      ₹{orders.reduce((sum, order) => {
                        const total = typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(order.totalAmount) || 0;
                        const discounted = order.discountedAmount && order.discountedAmount < total ? order.discountedAmount : total;
                        return sum + discounted;
                      }, 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </div>
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={handleDownload}>Download</Button>
        <Button variant="outlined" color="primary" onClick={handlePrint}>Print</Button>
        <Button variant="outlined" color="secondary" onClick={handleSend}>Send</Button>
      </Box>
    </Box>
  );
};

export default AccountanceReport;
