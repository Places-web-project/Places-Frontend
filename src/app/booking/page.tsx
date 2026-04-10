'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Desk, DeskStatus } from '@/types/desk';
import FloorPlanMap from '@/components/FloorPlanMap';
import BookingModal from '@/components/BookingModal';
import AdminPanel from '@/components/AdminPanel';
import {
  Box,
  Typography,
  TextField,
  Alert,
  Chip,
  Snackbar,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ErrorIcon from '@mui/icons-material/Error';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import FilterListIcon from '@mui/icons-material/FilterList';
import { apiService } from '@/services/api';


function BookingPageContent() {
  const searchParams = useSearchParams();
  const [desks, setDesks] = useState<Desk[]>([]);
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [selectedDeskForModal, setSelectedDeskForModal] = useState<Desk | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [pendingDeskToAdd, setPendingDeskToAdd] = useState<Omit<Desk, 'id' | 'position'> | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Check if date is provided in URL query params
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const dateParam = urlParams.get('date');
      if (dateParam) {
        return dateParam;
      }
    }
    // Default to today's date (using local timezone to avoid UTC issues)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [typeFilters, setTypeFilters] = useState<{
    desk: boolean;
    'meeting-room': boolean;
    recreational: boolean;
  }>({
    desk: true,
    'meeting-room': true,
    recreational: true,
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Check for date parameter in URL on mount and when searchParams change
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(dateParam)) {
        setSelectedDate(dateParam);
      }
    }
  }, [searchParams]);

  // Keyboard shortcut for admin mode (Ctrl+Shift+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setIsAdminMode(prev => !prev);
        setSelectedDesk(null);
        setPendingDeskToAdd(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load desks and bookings from backend API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch rooms and bookings from backend API
        const [roomsResponse, bookingsResponse] = await Promise.all([
          apiService.getRooms(),
          apiService.getBookings(),
        ]);

        // Transform backend data to frontend Desk format, filtering by selected date
        const desks = await apiService.transformRoomsToDesks(
          roomsResponse.rooms,
          bookingsResponse.bookings,
          selectedDate // Filter bookings by selected date
        );

        setDesks(desks);
      } catch (error) {
        console.error('Failed to load desks from API:', error);
        // Fallback: try localStorage for migration
        const savedDesks = localStorage.getItem('desk-layout');
        if (savedDesks) {
          try {
            const parsed: Desk[] = JSON.parse(savedDesks);
            setDesks(parsed);
          } catch (e) {
            console.error('Failed to load from localStorage:', e);
          }
        }
      }
    };

    loadData();
  }, [selectedDate]); // Reload when selectedDate changes

  const handleDeskClick = (desk: Desk) => {
    if (isAdminMode) {
      setSelectedDesk(desk);
    } else {
      // Check if this is a management-only space
      if (desk.managementOnly) {
        // Check if user is a manager or admin
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.type !== 'MANAGER' && user.type !== 'ADMIN') {
              setSnackbar({
                open: true,
                message: 'This space is reserved for management only.',
                severity: 'warning',
              });
              return;
            }
          } catch (e) {
            console.error('Failed to parse user data:', e);
          }
        }
      }
      setSelectedDeskForModal(desk);
    }
  };

  const handleMapClick = (x: number, y: number) => {
    if (!isAdminMode || !pendingDeskToAdd) return;

    const newDesk: Desk = {
      ...pendingDeskToAdd,
      id: Date.now(),
      position: { x, y },
    };

    setDesks(prev => [...prev, newDesk]);
    setPendingDeskToAdd(null);
  };

  const handleAddDesk = (deskData: Omit<Desk, 'id'>) => {
    setPendingDeskToAdd(deskData);
  };

  const handleDeleteDesk = (deskId: number) => {
    setDesks(prev => prev.filter(d => d.id !== deskId));
    setSelectedDesk(null);
  };

  const handleDeskMove = (deskId: number, x: number, y: number) => {
    setDesks(prev =>
      prev.map(desk =>
        desk.id === deskId
          ? { ...desk, position: { x, y } }
          : desk
      )
    );
  };

  const handleBookDesk = async (deskId: number, date: string, startTime?: string, endTime?: string, duration?: number, userName?: string, participants?: string[]) => {
    try {
      const finalStartTime = startTime || '09:00';
      const finalEndTime = endTime || '18:00';
      const finalUserName = userName || 'You';

      // Get the desk being booked to check if it's a desk type
      const deskToBook = desks.find(d => d.id === deskId);
      const isDeskType = deskToBook && (deskToBook.type === 'desk' || !deskToBook.type);

      // Check if user already has a desk booking for this date (only for desk types, not meeting rooms)
      if (isDeskType) {
        const userStr = localStorage.getItem('user');
        let currentUserId: number | null = null;
        
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            currentUserId = user.id;
          } catch (e) {
            console.error('Failed to parse user data:', e);
          }
        }

        if (currentUserId) {
          // Get all bookings for this date
          try {
            const bookingsResponse = await apiService.getBookingsByDate(date);
            
            // Check if user already has a desk booking
            const userHasDeskBooking = bookingsResponse.users.some((userBooking: any) => {
              if (userBooking.user_id !== currentUserId) return false;
              
              // Check if any of their bookings are for desks (not meeting rooms)
              return userBooking.bookings.some((booking: any) => {
                const room = desks.find(d => d.id === booking.id_room);
                return room && (room.type === 'desk' || !room.type);
              });
            });

            if (userHasDeskBooking) {
              alert('You already have a desk booking for this date. You can only book one desk per day.');
              return;
            }
          } catch (error: any) {
            // If it's our validation error, re-throw it
            if (error.message === 'User already has a desk booking for this date') {
              throw error;
            }
            // Otherwise, log but continue (maybe the check failed due to network)
            console.warn('Failed to check existing bookings:', error);
          }
        }
      }

      // Transform and create booking via backend API
      const bookingData = await apiService.transformBookingToBackend(
        deskId,
        date,
        finalStartTime,
        finalEndTime,
        finalUserName
      );

      const createResponse = await apiService.createBooking(bookingData);
      
      // Show message if booking is pending approval
      if (createResponse.status === 'pending') {
        setSnackbar({
          open: true,
          message: 'Your booking request has been submitted and is pending manager approval. You will be notified once it is approved.',
          severity: 'info',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Booking created successfully!',
          severity: 'success',
        });
      }

      // Reload data from backend to get updated bookings
      const [roomsResponse, bookingsResponse] = await Promise.all([
        apiService.getRooms(),
        apiService.getBookings(),
      ]);

      const updatedDesks = await apiService.transformRoomsToDesks(
        roomsResponse.rooms,
        bookingsResponse.bookings,
        selectedDate // Filter bookings by selected date
      );

      setDesks(updatedDesks);
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      // Show error to user with more details
      let errorMessage = 'Failed to create booking. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running.';
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
      throw error; // Re-throw to prevent modal from closing on error
    }
  };

  const handleExportDesks = () => {
    const dataStr = JSON.stringify(desks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'desk-layout.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDesks = (importedDesks: Desk[]) => {
    setDesks(importedDesks);
  };

  const handleToggleAdminMode = () => {
    setIsAdminMode(prev => !prev);
    setSelectedDesk(null);
    setPendingDeskToAdd(null);
  };

  // Filter desks by type
  const filteredDesks = desks.filter(desk => {
    // Filter by type
    const deskType = desk.type || 'desk';
    return typeFilters[deskType as keyof typeof typeFilters];
  });

  const availableDesks = filteredDesks.filter(d => d.status === 'available').length;
  
  // Calculate user's bookings from all spaces (desks, meeting rooms, recreational)
  const myBookings = (() => {
    // Get logged-in user from localStorage
    if (typeof window === 'undefined') return 0;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return 0;

    try {
      const user = JSON.parse(userStr);
      if (!user || !user.name) return 0;

      // Count all spaces (desks, meeting rooms, recreational) that are booked by the current user
      // The desks are already filtered by selectedDate, so this counts bookings for the selected date
      return filteredDesks.filter(d => 
        d.status === 'booked' && 
        d.bookedBy === user.name &&
        d.bookedDate === selectedDate // Ensure it's for the selected date
      ).length;
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return 0;
    }
  })();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#fafafa' }}>
      {/* Horizontal Top Bar - Book a Desk */}
      <Box sx={{ 
        width: '100%', 
        bgcolor: 'white', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 2.5, md: 3 },
      }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h4" 
            fontWeight="700" 
            sx={{ 
              letterSpacing: '-0.03em',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              color: '#1a1a1a'
            }}
          >
            Book a Place
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6b7280',
              fontSize: '0.875rem',
              mt: 0.5
            }}
          >
            Choose your personal workspace for the day
          </Typography>
        </Box>

        {/* Main Controls - Cleaner Grid Layout */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { 
            xs: '1fr',
            sm: 'auto 1fr auto',
            md: 'auto 1fr auto auto'
          },
          gap: 2,
          alignItems: 'center',
          mb: 2.5
        }}>
          {/* Date Selector */}
          <TextField
            label="Select Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            inputProps={{ 
              min: (() => {
                // Get today's date in local timezone (not UTC)
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              })()
            }}
            size="small"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <EventIcon sx={{ mr: 0.5, color: '#9ca3af', fontSize: 18 }} />,
            }}
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3b82f6',
                  }
                }
              }
            }}
          />

          {/* Location Info - Compact */}
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1,
              bgcolor: '#eff6ff',
              borderRadius: 2,
              border: '1px solid #bfdbfe',
            }}
          >
            <LocationOnIcon sx={{ color: '#3b82f6', fontSize: 18 }} />
            <Box>
              <Typography variant="body2" fontWeight="600" sx={{ color: '#1e40af', fontSize: '0.813rem' }}>
                The Bridge 2, Str. Ghercu Constantin 1A
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                Drop-Ins, Bucharest
              </Typography>
            </Box>
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2.5,
              py: 1.5,
              bgcolor: '#eff6ff',
              borderRadius: 2,
              border: '1px solid #bfdbfe',
            }}
          >
            <Typography variant="h5" fontWeight="700" sx={{ color: '#1e40af', fontSize: '1.875rem' }}>
              {myBookings}
            </Typography>
            <Typography variant="caption" sx={{ color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.688rem' }}>
              Your<br/>Bookings
            </Typography>
          </Box>
        </Box>

        {/* Type Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#6b7280' }}>
            <FilterListIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.688rem' }}>
              Filters
            </Typography>
          </Box>
          <Chip
            label="Desk"
            size="small"
            onClick={() => setTypeFilters(prev => ({ ...prev, desk: !prev.desk }))}
            sx={{ 
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: typeFilters.desk ? '#10b981' : 'white',
              color: typeFilters.desk ? 'white' : '#4b5563',
              border: '1px solid',
              borderColor: typeFilters.desk ? '#10b981' : '#e5e7eb',
              '&:hover': {
                bgcolor: typeFilters.desk ? '#059669' : '#f9fafb',
              }
            }}
          />
          <Chip
            label="Meeting Room"
            size="small"
            onClick={() => setTypeFilters(prev => ({ ...prev, 'meeting-room': !prev['meeting-room'] }))}
            sx={{ 
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: typeFilters['meeting-room'] ? '#10b981' : 'white',
              color: typeFilters['meeting-room'] ? 'white' : '#4b5563',
              border: '1px solid',
              borderColor: typeFilters['meeting-room'] ? '#10b981' : '#e5e7eb',
              '&:hover': {
                bgcolor: typeFilters['meeting-room'] ? '#059669' : '#f9fafb',
              }
            }}
          />
          <Chip
            label="Recreational"
            size="small"
            onClick={() => setTypeFilters(prev => ({ ...prev, recreational: !prev.recreational }))}
            sx={{ 
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: typeFilters.recreational ? '#10b981' : 'white',
              color: typeFilters.recreational ? 'white' : '#4b5563',
              border: '1px solid',
              borderColor: typeFilters.recreational ? '#10b981' : '#e5e7eb',
              '&:hover': {
                bgcolor: typeFilters.recreational ? '#059669' : '#f9fafb',
              }
            }}
          />
        </Box>

        {/* Color Legend */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', px: 0.5 }}>
          <Typography variant="caption" fontWeight="600" sx={{ color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.688rem' }}>
            Legend:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981' }} />
            <Typography variant="caption" sx={{ color: '#4b5563', fontSize: '0.75rem' }}>Available</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#7c3aed' }} />
            <Typography variant="caption" sx={{ color: '#4b5563', fontSize: '0.75rem' }}>Management Only</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
            <Typography variant="caption" sx={{ color: '#4b5563', fontSize: '0.75rem' }}>Booked</Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Floor Plan */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <FloorPlanMap
            desks={filteredDesks}
            onDeskClick={handleDeskClick}
            onMapClick={handleMapClick}
            isAdminMode={isAdminMode}
            onDeskMove={handleDeskMove}
            floorPlanImage="/MC_Etaj 4_Plan Compartimentare_11.09.2025-1.png"
          />
        </Box>

        {/* Right Sidebar - Admin Panel (only visible in admin mode) */}
        {isAdminMode && (
          <Box sx={{ 
            width: { xs: '100%', md: 320 },
            borderLeft: 1,
            borderColor: 'divider',
            overflowY: 'auto'
          }}>
            <AdminPanel
              isAdminMode={isAdminMode}
              onToggleAdminMode={handleToggleAdminMode}
              onAddDesk={handleAddDesk}
              onDeleteDesk={handleDeleteDesk}
              onExportDesks={handleExportDesks}
              onImportDesks={handleImportDesks}
              selectedDesk={selectedDesk}
              hideToggleButton={true}
            />
          </Box>
        )}
      </Box>

      {/* Booking Modal */}
      {selectedDeskForModal && (
        <BookingModal
          desk={selectedDeskForModal}
          onClose={() => setSelectedDeskForModal(null)}
          onBook={handleBookDesk}
          defaultDate={selectedDate}
        />
      )}

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          icon={
            snackbar.severity === 'info' ? (
              <PendingActionsIcon />
            ) : snackbar.severity === 'success' ? (
              <CheckCircleIcon />
            ) : (
              <ErrorIcon />
            )
          }
          sx={{
            width: '100%',
            bgcolor:
              snackbar.severity === 'info'
                ? '#3b82f6'
                : snackbar.severity === 'success'
                ? '#10b981'
                : '#ef4444',
            color: '#FFFFFF',
            '& .MuiAlert-icon': {
              color: '#FFFFFF',
            },
            '& .MuiAlert-message': {
              color: '#FFFFFF',
              fontWeight: 500,
            },
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            borderRadius: 2,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Pending Desk Indicator */}
      {pendingDeskToAdd && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
          }}
        >
          <Alert severity="warning" icon={<LocationOnIcon />} sx={{ fontWeight: 600 }}>
            📍 Click on the map to place: {pendingDeskToAdd.name}
          </Alert>
        </Box>
      )}
    </Box>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4 }}>Loading...</Box>}>
      <BookingPageContent />
    </Suspense>
  );
}
