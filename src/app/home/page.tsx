'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Stack,
  Chip,
  IconButton,
  Card,
  CardContent,
  Divider,
  Alert,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';

interface Booking {
  id: number;
  id_room: number;
  start: string;
  end: string;
  roomName?: string;
  roomType?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    loadBookings();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadBookings = async () => {
    try {
      // Get logged-in user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error('User not found in localStorage');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      if (!user || !user.id) {
        console.error('Invalid user data');
        setLoading(false);
        return;
      }

      // Store user type for alert display
      setUserType(user.type || null);

      // Get user bookings from backend (next 2 weeks)
      const userBookingsResponse = await apiService.getUserBookings(user.id);
      const roomsResponse = await apiService.getRooms();
      
      // Transform bookings to include room info and convert date/time format
      const bookingsWithRoomInfo = userBookingsResponse.bookings.map((booking: any) => {
        const room = roomsResponse.rooms.find((r: any) => r.id === booking.id_room);
        const roomData = room ? JSON.parse(room.data) : null;
        
        // Backend returns: date (YYYY-MM-DD), start (HH:MM), end (HH:MM)
        // Convert to ISO string for Date parsing
        const startDateTime = `${booking.date}T${booking.start}:00`;
        const endDateTime = `${booking.date}T${booking.end}:00`;
        
        return {
          id: booking.id,
          id_room: booking.id_room,
          start: startDateTime,
          end: endDateTime,
          roomName: roomData?.name || `Room ${booking.id_room}`,
          roomType: roomData?.type || 'desk',
        };
      });

      // Filter only upcoming bookings (in case any are in the past)
      const now = new Date();
      const upcoming = bookingsWithRoomInfo.filter((booking: Booking) => {
        const bookingDate = new Date(booking.start);
        return bookingDate >= now;
      });

      // Sort by date
      upcoming.sort((a: Booking, b: Booking) => 
        new Date(a.start).getTime() - new Date(b.start).getTime()
      );

      setBookings(upcoming);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTimeDate = (date: Date) => {
    const time = date.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `${time}, ${dateStr}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const handleSearch = () => {
    router.push('/booking');
  };

  const handleFloorPlan = () => {
    router.push('/booking');
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getBookingsForDate = (day: number | null) => {
    if (day === null) return [];
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.start);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (day: number | null) => {
    if (day === null) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number | null) => {
    if (day === null || !selectedDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDayClick = (day: number | null) => {
    if (day === null) return;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(date);
  };

  const getSelectedDateBookings = () => {
    if (!selectedDate) return bookings;
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.start);
      return (
        bookingDate.getDate() === selectedDate.getDate() &&
        bookingDate.getMonth() === selectedDate.getMonth() &&
        bookingDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentMonth);

  return (
    <Box sx={{ p: 4, bgcolor: '#FFFFFF' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#000000' }}>
          Upcoming Bookings
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
          {mounted ? formatTimeDate(currentTime) : 'Loading...'}
        </Typography>
      </Box>

      {/* Alert for b_employee type */}
      {userType === 'b_employee' && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            bgcolor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#dc2626',
            },
            '& .MuiAlert-message': {
              color: '#991b1b',
              fontWeight: 600,
            },
          }}
        >
          In the last 30 days, you booked 10 times and attended only 1 time
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3 }}>
        {/* Calendar Section */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: '#FFFFFF',
              borderRadius: 3,
              border: '1px solid #bfdbfe',
            }}
          >
            {/* Calendar Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <IconButton
                onClick={() => navigateMonth('prev')}
                sx={{
                  color: '#1e40af',
                  '&:hover': { bgcolor: 'rgba(191, 219, 254, 0.1)' },
                }}
              >
                <ArrowBackIosIcon fontSize="small" />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af' }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Typography>
              <IconButton
                onClick={() => navigateMonth('next')}
                sx={{
                  color: '#1e40af',
                  '&:hover': { bgcolor: 'rgba(191, 219, 254, 0.1)' },
                }}
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Week Days Header */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
              {weekDays.map((day) => (
                <Box key={day} sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: 'rgba(0, 0, 0, 0.5)',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                    }}
                  >
                    {day}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Calendar Days */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {days.map((day, index) => {
                const dayBookings = getBookingsForDate(day);
                const isCurrentDay = isToday(day);
                const isSelectedDay = isSelected(day);
                const hasBookings = dayBookings.length > 0;

                return (
                  <Box
                    key={index}
                    sx={{
                      aspectRatio: '1',
                      minHeight: 60,
                    }}
                  >
                    <Box
                      onClick={() => handleDayClick(day)}
                      sx={{
                        height: '100%',
                        p: 0.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        borderRadius: 2,
                        bgcolor: isSelectedDay
                          ? '#eff6ff'
                          : isCurrentDay
                          ? 'rgba(239, 246, 255, 0.3)'
                          : hasBookings
                          ? 'rgba(239, 246, 255, 0.5)'
                          : 'transparent',
                        border: isSelectedDay ? '2px solid #1e40af' : isCurrentDay ? '1px solid #bfdbfe' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: '#eff6ff',
                          transform: 'scale(1.05)',
                          border: '2px solid #1e40af',
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isSelectedDay ? 700 : isCurrentDay ? 600 : hasBookings ? 600 : 400,
                          color: isSelectedDay ? '#1e40af' : isCurrentDay ? '#1e40af' : hasBookings ? '#1e40af' : '#000000',
                          mb: 0.5,
                        }}
                      >
                        {day}
                      </Typography>
                      {hasBookings && (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: '#1e40af',
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>

        {/* Upcoming Bookings List */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: '#FFFFFF',
              borderRadius: 3,
              border: '1px solid #bfdbfe',
              height: '100%',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e40af' }}>
              {selectedDate
                ? `Bookings for ${selectedDate.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}`
                : 'Next Bookings'}
            </Typography>

            {loading ? (
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                Loading...
              </Typography>
            ) : (() => {
              const displayBookings = selectedDate ? getSelectedDateBookings() : bookings;
              return displayBookings.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 6,
                  }}
                >
                  <CalendarMonthIcon
                    sx={{
                      fontSize: 64,
                      color: '#d1d5db',
                      mb: 2,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    {selectedDate ? 'No bookings for this date' : 'No upcoming bookings'}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {displayBookings.slice(0, 5).map((booking) => (
                  <Card
                    key={booking.id}
                    elevation={0}
                    sx={{
                      bgcolor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(30, 64, 175, 0.15)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              color: '#1e40af',
                              fontSize: '1rem',
                              mb: 0.5,
                            }}
                          >
                            {booking.roomName}
                          </Typography>
                          <Chip
                            label={booking.roomType || 'Desk'}
                            size="small"
                            sx={{
                              bgcolor: '#bfdbfe',
                              color: '#1e40af',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1.5, borderColor: '#bfdbfe' }} />
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarTodayIcon sx={{ fontSize: 16, color: '#1e40af' }} />
                          <Typography variant="body2" sx={{ color: '#000000', fontSize: '0.875rem' }}>
                            {formatDate(booking.start)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTimeIcon sx={{ fontSize: 16, color: '#1e40af' }} />
                          <Typography variant="body2" sx={{ color: '#000000', fontSize: '0.875rem' }}>
                            {formatTime(booking.start)} - {formatTime(booking.end)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOnIcon sx={{ fontSize: 16, color: '#1e40af' }} />
                          <Typography variant="body2" sx={{ color: '#000000', fontSize: '0.875rem' }}>
                            The Bridge 2, Str. Ghercu Constantin 1A
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                  ))}
                  {displayBookings.length > 5 && (
                    <Button
                      variant="text"
                      onClick={() => router.push('/home/bookings')}
                      sx={{
                        color: '#1e40af',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          bgcolor: 'rgba(191, 219, 254, 0.1)',
                        },
                      }}
                    >
                      View all bookings ({displayBookings.length})
                    </Button>
                  )}
                </Stack>
              );
            })()}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}