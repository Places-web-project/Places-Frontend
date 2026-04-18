'use client';

import { Desk, BookingDuration } from '@/types/desk';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatIcon from '@mui/icons-material/Chat';
import { generateTimeSlots, getAvailableSlotsForDuration, formatDuration, isWeekday } from '@/utils/timeUtils';
import RecreationalChat from './RecreationalChat';

interface BookingModalProps {
  desk: Desk | null;
  onClose: () => void;
  onBook: (deskId: number, date: string, startTime?: string, endTime?: string, duration?: number, userName?: string, participants?: string[]) => void;
  defaultDate?: string;
}

const DURATION_OPTIONS: BookingDuration[] = [30, 60, 90, 120, 150, 180, 210, 240];

export default function BookingModal({ desk, onClose, onBook, defaultDate }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (defaultDate) return defaultDate;
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [participants, setParticipants] = useState(''); // Comma-separated list
  const [selectedDuration, setSelectedDuration] = useState<BookingDuration>(60);
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [chatOpen, setChatOpen] = useState(false);

  // Get user ID from localStorage
  const getCurrentUserId = (): number | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || null;
      } catch {
        return null;
      }
    }
    return null;
  };

  // Get user name from localStorage
  const getUserName = (): string => {
    if (typeof window === 'undefined') return 'You';
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.name || 'You';
      } catch {
        return 'You';
      }
    }
    return 'You';
  };

  if (!desk) return null;

  const isMeetingRoom = desk.type === 'meeting-room';
  const isRecreational = desk.type === 'recreational';
  const isEventSpace = isMeetingRoom || isRecreational;
  const isDesk = desk.type === 'desk' || !desk.type;

  // Get existing bookings for the selected date
  const existingBookings = desk.bookings?.filter(b => b.date === selectedDate) || [];
  if (desk.bookedDate === selectedDate && desk.bookedStartTime && desk.bookedEndTime) {
    existingBookings.push({
      deskId: desk.id,
      userName: desk.bookedBy || '',
      date: selectedDate,
      startTime: desk.bookedStartTime,
      endTime: desk.bookedEndTime,
    });
  }

  // Chat is always available for recreational spaces
  const currentUserId = getCurrentUserId();
  const selectedChatBooking = existingBookings.find((booking) => booking.userId === currentUserId);

  // Generate time slots for the selected date
  const dateObj = new Date(selectedDate);
  const allTimeSlots = useMemo(() => {
    return generateTimeSlots(dateObj, existingBookings.map(b => ({
      startTime: b.startTime,
      endTime: b.endTime,
    })));
  }, [selectedDate, existingBookings]);

  // Get available slots for selected duration (meeting rooms only)
  const availableSlots = useMemo(() => {
    if (isDesk) return [];
    return getAvailableSlotsForDuration(allTimeSlots, selectedDuration);
  }, [allTimeSlots, selectedDuration, isDesk]);

  const handleBook = async () => {
    if (!desk.status || desk.status === 'available') {
      const userName = getUserName();
      // Parse participants (comma-separated list, trimmed)
      const participantsList = participants
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);
      
      try {
        if (isDesk) {
          // Desk: book for whole day (9:00 - 18:00)
          await onBook(desk.id, selectedDate, '09:00', '18:00', 540, userName);
        } else if (isEventSpace) {
          // Meeting room or Recreational: book for selected duration with participants
          if (!selectedStartTime) return;
          const startMinutes = parseInt(selectedStartTime.split(':')[0]) * 60 + parseInt(selectedStartTime.split(':')[1]);
          const endMinutes = startMinutes + selectedDuration;
          const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
          await onBook(desk.id, selectedDate, selectedStartTime, endTime, selectedDuration, userName, participantsList);
        }
        onClose();
      } catch (error) {
        // Error is already handled in handleBookDesk, don't close modal
        console.error('Booking failed:', error);
      }
    }
  };

  const isDateValid = isWeekday(dateObj);
  
  // Validate date is within 2 weeks from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
  
  const isDateInRange = dateObj >= today && dateObj <= twoWeeksLater;
  const dateError = !isDateInRange;
  const dateHelperText = dateError 
    ? dateObj < today 
      ? 'Date cannot be in the past' 
      : 'Date cannot exceed 2 weeks from today'
    : !isDateValid 
      ? 'Only weekdays (Mon-Fri) are available' 
      : '';

  return (
    <Dialog open={!!desk} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {desk.bookedBy && desk.bookedByAvatar && (
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'transparent',
                border: '2px solid #bfdbfe',
                '& img': {
                  width: '100%',
                  height: '100%',
                },
                '& svg': {
                  width: '100%',
                  height: '100%',
                },
              }}
              src={desk.bookedByAvatar || undefined}
            >
              {!desk.bookedByAvatar && desk.bookedBy?.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Typography variant="h5" fontWeight="bold">
            {desk.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Space Details */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Type:
              </Typography>
              <Chip
                label={isMeetingRoom ? 'Meeting Room' : isRecreational ? 'Recreational' : 'Desk'}
                size="small"
                color={isMeetingRoom || isRecreational ? 'primary' : 'default'}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Floor:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {desk.floor}
              </Typography>
            </Box>

            {desk.status && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label={desk.status.replace('-', ' ')}
                  size="small"
                  color={desk.status === 'available' ? 'success' : 'error'}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>
            )}

            {desk.attributes && desk.attributes.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Amenities:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {desk.attributes.map((attr, idx) => (
                    <Chip
                      key={idx}
                      label={attr}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {desk.bookedBy && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Booked by:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {desk.bookedBy}
                </Typography>
              </Box>
            )}

            {/* Show chat availability indicator for recreational spaces */}
            {isRecreational && (
              <Box sx={{ mt: 1, p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1, border: 1, borderColor: '#90caf9' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ChatIcon color="primary" fontSize="small" />
                  <Typography variant="body2" color="primary.main" fontWeight="medium">
                    💬 Community Chat Available!
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Join the conversation! This recreational space has a group chat.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Booking Form (only if available) */}
          {(!desk.status || desk.status === 'available') && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {isEventSpace && (
                <TextField
                  label="Participants (comma-separated)"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="e.g., John Doe, Jane Smith, Bob Johnson"
                  helperText="Enter names of participants separated by commas"
                  fullWidth
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              )}
              
              <TextField
                label="Select Date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedStartTime('');
                }}
                inputProps={{ 
                  min: today.toISOString().split('T')[0],
                  max: twoWeeksLater.toISOString().split('T')[0]
                }}
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                error={!isDateValid || dateError}
                helperText={dateHelperText}
              />

              {isEventSpace && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Duration</InputLabel>
                    <Select
                      value={selectedDuration}
                      label="Duration"
                      onChange={(e) => {
                        setSelectedDuration(e.target.value as BookingDuration);
                        setSelectedStartTime('');
                      }}
                    >
                      {DURATION_OPTIONS.map(duration => (
                        <MenuItem key={duration} value={duration}>
                          {formatDuration(duration)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {availableSlots.length > 0 ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" />
                        Available Time Slots:
                      </Typography>
                      <Box sx={{ mt: 1, maxHeight: 200, overflowY: 'auto', display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
                        {availableSlots.map((slot, idx) => (
                          <Button
                            key={idx}
                            variant={selectedStartTime === slot.start ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => setSelectedStartTime(slot.start)}
                            fullWidth
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {slot.start} - {slot.end}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.lighter', border: 1, borderColor: 'warning.light' }}>
                      <Typography variant="body2" color="text.secondary">
                        No available time slots for {formatDuration(selectedDuration)} on this date.
                      </Typography>
                    </Paper>
                  )}
                </>
              )}

              {isDesk && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.lighter', border: 1, borderColor: 'info.light' }}>
                  <Typography variant="body2" color="text.secondary">
                    Desks are booked for the entire day (9:00 - 18:00).
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {/* Show chat button for recreational spaces (always available) */}
        {isRecreational && (
          <Button
            onClick={() => setChatOpen(true)}
            variant="outlined"
            startIcon={<ChatIcon />}
            color="primary"
            sx={{ mr: 'auto' }}
          >
            Open Chat
          </Button>
        )}
        
        {(!desk.status || desk.status === 'available') ? (
          <>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleBook}
              variant="contained"
              disabled={!isDateValid || dateError || (isEventSpace && !selectedStartTime)}
            >
              {isEventSpace ? (isMeetingRoom ? 'Book Room' : 'Book Space') : 'Book Desk'}
            </Button>
          </>
        ) : (
          <>
          <Button onClick={onClose} variant="contained" color="inherit">
            Close
          </Button>
          </>
        )}
      </DialogActions>

      {/* Recreational Chat Modal */}
      {isRecreational && chatOpen && currentUserId && (
        <RecreationalChat
          bookingId={selectedChatBooking?.bookingId}
          roomId={desk.id}
          roomName={desk.name}
          date={selectedDate}
          startTime={selectedChatBooking?.startTime || '09:00'}
          endTime={selectedChatBooking?.endTime || '18:00'}
          currentUserId={currentUserId}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </Dialog>
  );
}
