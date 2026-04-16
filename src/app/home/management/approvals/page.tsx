'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
} from '@mui/material';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PersonIcon from '@mui/icons-material/Person';
import { apiService } from '@/services/api';

export default function ApprovalsPage() {
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load pending approvals on mount
  useEffect(() => {
    loadPendingApprovals();
  }, []);

  // Reload pending approvals periodically
  useEffect(() => {
    const interval = setInterval(() => {
      loadPendingApprovals();
    }, 10000); // Reload every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPendingApprovals = async () => {
    setLoadingApprovals(true);
    try {
      const response = await apiService.getPendingBookings();
      setPendingApprovals(response.bookings || []);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
      setErrorMessage('Failed to load pending approvals');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoadingApprovals(false);
    }
  };

  const handleApproveBooking = async (bookingId: number) => {
    try {
      await apiService.approveBooking(bookingId);
      setSuccessMessage('Booking approved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadPendingApprovals();
    } catch (error) {
      console.error('Failed to approve booking:', error);
      setErrorMessage('Failed to approve booking');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleRejectBooking = async (bookingId: number) => {
    try {
      await apiService.rejectBooking(bookingId);
      setSuccessMessage('Booking rejected');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadPendingApprovals();
    } catch (error) {
      console.error('Failed to reject booking:', error);
      setErrorMessage('Failed to reject booking');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e40af', mb: 1 }}>
          Approvals
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
          Review and approve booking requests from employees
        </Typography>
      </Box>

      {/* Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {/* Pending Approvals */}
      <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #bfdbfe' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PendingActionsIcon sx={{ color: '#1e40af', mr: 1, fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af' }}>
              Pending Approvals
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {loadingApprovals && <CircularProgress size={24} />}
            <Chip
              label={`${pendingApprovals.length} pending`}
              sx={{
                bgcolor: pendingApprovals.length > 0 ? '#fef3c7' : '#eff6ff',
                color: pendingApprovals.length > 0 ? '#92400e' : '#1e40af',
                fontWeight: 600,
                border: pendingApprovals.length > 0 ? '1px solid #f59e0b' : '1px solid #bfdbfe',
              }}
            />
          </Box>
        </Box>

        {loadingApprovals && pendingApprovals.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : pendingApprovals.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PendingActionsIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 1 }}>
              No pending approvals
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.5)' }}>
              All booking requests have been processed
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pendingApprovals.map((booking) => (
              <Card
                key={booking.id}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: '#bfdbfe',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
                      {/* User Avatar */}
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: booking.user?.avatar ? 'transparent' : '#1e40af',
                          border: '2px solid #bfdbfe',
                        }}
                        src={booking.user?.avatar || undefined}
                      >
                        {!booking.user?.avatar && (
                          <PersonIcon sx={{ fontSize: 28, color: '#FFFFFF' }} />
                        )}
                      </Avatar>

                      {/* Booking Details */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                          {booking.room_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.7)', mb: 0.5 }}>
                          <strong>Requested by:</strong> {booking.user?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.7)', mb: 0.5 }}>
                          <strong>Date:</strong> {booking.date}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.7)' }}>
                          <strong>Time:</strong> {booking.start} - {booking.end}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ThumbUpIcon />}
                        onClick={() => handleApproveBooking(booking.id)}
                        disabled={loadingApprovals}
                        sx={{
                          fontWeight: 600,
                          textTransform: 'none',
                          px: 3,
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<ThumbDownIcon />}
                        onClick={() => handleRejectBooking(booking.id)}
                        disabled={loadingApprovals}
                        sx={{
                          fontWeight: 600,
                          textTransform: 'none',
                          px: 3,
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

