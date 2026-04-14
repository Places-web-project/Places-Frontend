'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Link,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  TablePagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CancelIcon from '@mui/icons-material/Cancel';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';

interface Booking {
  id: string;
  workspace: string;
  type: string;
  from: string;
  to: string;
  location: string;
  status: string;
  bookedFor?: string;
  id_room?: number;
  date?: string;
  start?: string;
  end?: string;
}

export default function YourBookingsPage() {
  const router = useRouter();
  const [workspaceType, setWorkspaceType] = useState<string>('All');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [workspaceType, bookings]);

  useEffect(() => {
    setPage(0);
  }, [workspaceType, bookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // Get logged-in user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error('User not found in localStorage');
        setBookings([]);
        return;
      }

      const user = JSON.parse(userStr);
      if (!user || !user.id) {
        console.error('Invalid user data');
        setBookings([]);
        return;
      }

      // Get all bookings from backend (includes status)
      const bookingsResponse = await apiService.getBookings();
      const roomsResponse = await apiService.getRooms();

      // Filter to only current user's bookings
      const userBookings = bookingsResponse.bookings.filter((b: any) => b.id_user === user.id);

      // Transform bookings to match table format
      const transformedBookings: Booking[] = userBookings.map((booking: any) => {
        const room = roomsResponse.rooms.find((r: any) => r.id === booking.id_room);
        const roomData = room ? JSON.parse(room.data) : null;
        
        // Format date and time
        const dateObj = new Date(`${booking.date}T${booking.start}:00`);
        const endDateObj = new Date(`${booking.date}T${booking.end}:00`);
        
        const formattedDate = dateObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const formattedTime = dateObj.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const formattedEndTime = endDateObj.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        // Determine type display
        let typeDisplay = 'Desk';
        if (roomData?.type === 'meeting-room') {
          typeDisplay = 'Meeting Room';
        } else if (roomData?.type === 'recreational') {
          typeDisplay = 'Recreational';
        }

        return {
          id: booking.id.toString(),
          workspace: roomData?.name || `Room ${booking.id_room}`,
          type: typeDisplay,
          from: `${formattedDate} ${formattedTime}`,
          to: `${formattedDate} ${formattedEndTime}`,
          location: 'The Bridge 2, Str. Ghercu Constantin 1A',
          status: booking.status || 'active',
          bookedFor: booking.user?.name || user.name || '-',
          id_room: booking.id_room,
          date: booking.date,
          start: booking.start,
          end: booking.end,
        };
      });

      // Sort by date (earliest first)
      transformedBookings.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return a.date.localeCompare(b.date);
      });

      setBookings(transformedBookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    if (workspaceType === 'All') {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter((booking) => {
        if (workspaceType === 'Desk') {
          return booking.type === 'Desk';
        } else if (workspaceType === 'Meeting Room') {
          return booking.type === 'Meeting Room';
        } else if (workspaceType === 'recreational') {
          return booking.type === 'Recreational';
        }
        return true;
      });
      setFilteredBookings(filtered);
    }
  };

  const handleViewOnFloorPlan = (booking: Booking) => {
    if (booking.date) {
      router.push(`/booking?date=${booking.date}`);
    } else {
      router.push('/booking');
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setEditDate(booking.date || '');
    setEditStartTime(booking.start || '');
    setEditEndTime(booking.end || '');
    setEditError('');
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingBooking(null);
    setEditDate('');
    setEditStartTime('');
    setEditEndTime('');
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;

    // Validate inputs
    if (!editDate || !editStartTime || !editEndTime) {
      setEditError('Please fill in all fields');
      return;
    }

    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(editStartTime) || !timeRegex.test(editEndTime)) {
      setEditError('Invalid time format. Use HH:MM (24-hour format)');
      return;
    }

    // Validate that end time is after start time
    const startMinutes = parseInt(editStartTime.split(':')[0]) * 60 + parseInt(editStartTime.split(':')[1]);
    const endMinutes = parseInt(editEndTime.split(':')[0]) * 60 + parseInt(editEndTime.split(':')[1]);
    if (endMinutes <= startMinutes) {
      setEditError('End time must be after start time');
      return;
    }

    try {
      setSaving(true);
      setEditError('');

      await apiService.updateBooking(parseInt(editingBooking.id), {
        date: editDate,
        start: editStartTime,
        end: editEndTime,
      });

      // Reload bookings after update
      await loadBookings();
      handleCloseEditDialog();
    } catch (error: any) {
      console.error('Failed to update booking:', error);
      setEditError(error.message || 'Failed to update booking. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (bookingId: string) => {
    setDeletingBookingId(bookingId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingBookingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBookingId) {
      return;
    }
    try {
      await apiService.deleteBooking(parseInt(deletingBookingId));
      // Reload bookings after deletion
      await loadBookings();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Failed to delete booking:', error);
      alert('Failed to delete booking. Please try again.');
    }
  };

  const getStatusChip = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'pending') {
      return (
        <Chip
          icon={<PendingActionsIcon sx={{ fontSize: 16 }} />}
          label="Pending"
          size="small"
          sx={{
            bgcolor: '#fef3c7',
            color: '#92400e',
            fontWeight: 600,
            border: '1px solid #f59e0b',
            '& .MuiChip-icon': { color: '#92400e' },
          }}
        />
      );
    } else if (statusLower === 'approved' || statusLower === 'active') {
      return (
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
          label={statusLower === 'active' ? 'Active' : 'Approved'}
          size="small"
          sx={{
            bgcolor: '#d1fae5',
            color: '#065f46',
            fontWeight: 600,
            border: '1px solid #10b981',
            '& .MuiChip-icon': { color: '#065f46' },
          }}
        />
      );
    } else if (statusLower === 'rejected') {
      return (
        <Chip
          icon={<CancelIcon sx={{ fontSize: 16 }} />}
          label="Rejected"
          size="small"
          sx={{
            bgcolor: '#fee2e2',
            color: '#991b1b',
            fontWeight: 600,
            border: '1px solid #ef4444',
            '& .MuiChip-icon': { color: '#991b1b' },
          }}
        />
      );
    } else {
      // Default styling for unknown statuses
      return (
        <Chip
          label={status}
          size="small"
          sx={{
            bgcolor: '#e5e7eb',
            color: '#374151',
            fontWeight: 600,
            border: '1px solid #d1d5db',
          }}
        />
      );
    }
  };

  const paginatedBookings = filteredBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 4, bgcolor: '#ffffff', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        Manage bookings
      </Typography>

      {/* Booked spaces section */}
      <Paper elevation={0} sx={{ mb: 4, p: 3, bgcolor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
          Booked spaces
        </Typography>

        {/* Filter section */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Workspace type</InputLabel>
            <Select
              value={workspaceType}
              label="Workspace type"
              onChange={(e) => setWorkspaceType(e.target.value)}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Desk">Desk</MenuItem>
              <MenuItem value="Meeting Room">Meeting Room</MenuItem>
              <MenuItem value="recreational">Recreational</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Workspace</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>From</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>To</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Booked For</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : filteredBookings.length > 0 ? (
                paginatedBookings.map((booking) => (
                  <TableRow key={booking.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                    <TableCell>{booking.workspace}</TableCell>
                    <TableCell>{booking.type}</TableCell>
                    <TableCell>{booking.from}</TableCell>
                    <TableCell>{booking.to}</TableCell>
                    <TableCell>{booking.location}</TableCell>
                    <TableCell>
                      {getStatusChip(booking.status)}
                    </TableCell>
                    <TableCell>{booking.bookedFor || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Link
                          component="button"
                          onClick={() => handleViewOnFloorPlan(booking)}
                          sx={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          View on floor plan
                        </Link>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(booking)}
                          sx={{ color: '#666' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(booking.id)}
                          sx={{ color: '#ef4444' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#666' }}>
                    No bookings found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredBookings.length}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      {/* Edit Booking Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Edit Booking</Typography>
            <IconButton onClick={handleCloseEditDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {editingBooking && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                Workspace: <strong>{editingBooking.workspace}</strong> ({editingBooking.type})
              </Typography>
              
              {editError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {editError}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                sx={{ mb: 2 }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0],
                  max: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                }}
              />

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 minutes
                  }}
                />

                <TextField
                  fullWidth
                  label="End Time"
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 minutes
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={saving}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': {
                bgcolor: '#1e40af',
              },
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete booking</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this booking? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

