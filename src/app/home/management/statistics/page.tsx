'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import { apiService } from '@/services/api';

interface User {
  id: number;
  name: string;
  avatar: string;
  type: string;
}

interface UserStatistics {
  userId: number;
  userName: string;
  userAvatar: string;
  totalBookings: number;
  upcomingBookings: number;
  daysInOffice: number;
}

interface DateStatistics {
  date: string;
  totalBookings: number;
  uniqueUsers: number;
}

interface DeskUtilization {
  deskId: number;
  deskName: string;
  bookingCount: number;
  utilizationRate: number;
}

interface LegacyBookingRow {
  id: number;
  id_room: number;
  id_user: number;
  date: string;
  start: string;
  end: string;
  status?: string;
  room_name?: string;
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function spaceNameFromRoomData(data: string, id: number): string {
  try {
    const parsed = JSON.parse(data) as { name?: string };
    const n = parsed.name?.trim();
    return n || `Space ${id}`;
  } catch {
    return `Space ${id}`;
  }
}

/** Bookings are often seeded with future dates only; cap must include upcoming reservations. */
const UPCOMING_HORIZON_DAYS = 120;

function addCalendarDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export default function OfficeStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStatistics[]>([]);
  const [dateStats, setDateStats] = useState<DateStatistics[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [averageBookingsPerDay, setAverageBookingsPerDay] = useState(0);
  const [mostPopularDesk, setMostPopularDesk] = useState<DeskUtilization | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userTablePage, setUserTablePage] = useState(0);
  const [userTableRowsPerPage, setUserTableRowsPerPage] = useState(10);
  const [spaceCount, setSpaceCount] = useState(0);

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    if (dateRange) {
      loadStatistics();
    }
  }, [dateRange]);

  useEffect(() => {
    setUserTablePage(0);
  }, [searchQuery, dateRange]);

  const loadStatistics = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const [bookingsRes, usersRes, roomsRes] = await Promise.all([
        apiService.getAllBookings(),
        apiService.getUsers(),
        apiService.getAllRooms(),
      ]);

      const allBookings = bookingsRes.bookings as LegacyBookingRow[];
      const allUsers = usersRes.users as User[];
      setUsers(allUsers);
      setSpaceCount(roomsRes.rooms.length);

      const roomIdToName = new Map<number, string>();
      for (const room of roomsRes.rooms) {
        roomIdToName.set(room.id, spaceNameFromRoomData(room.data, room.id));
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = toYmd(today);

      let periodStartStr: string;
      let periodEndStr: string;

      if (dateRange === 'week') {
        const start = addCalendarDays(today, -7);
        periodStartStr = toYmd(start);
        periodEndStr = toYmd(addCalendarDays(today, UPCOMING_HORIZON_DAYS));
      } else if (dateRange === 'month') {
        const start = addCalendarDays(today, -30);
        periodStartStr = toYmd(start);
        periodEndStr = toYmd(addCalendarDays(today, UPCOMING_HORIZON_DAYS));
      } else {
        periodStartStr = '2000-01-01';
        periodEndStr = '2099-12-31';
      }

      const periodBookings = allBookings.filter(
        (b) => b.date >= periodStartStr && b.date <= periodEndStr
      );

      const isRejected = (b: LegacyBookingRow) => (b.status || '').toLowerCase() === 'rejected';

      setTotalBookings(periodBookings.length);

      const uniqueUserIds = new Set(periodBookings.map((b) => b.id_user));
      setActiveUsers(uniqueUserIds.size);

      const userStatsMap = new Map<number, UserStatistics>();

      allUsers.forEach((user: User) => {
        userStatsMap.set(user.id, {
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          totalBookings: 0,
          upcomingBookings: 0,
          daysInOffice: 0,
        });
      });

      const userDaysMap = new Map<number, Set<string>>();

      periodBookings.forEach((booking) => {
        const stats = userStatsMap.get(booking.id_user);
        if (stats) {
          stats.totalBookings++;
          if (booking.date >= todayStr && !isRejected(booking)) {
            stats.upcomingBookings++;
          }
          if (!userDaysMap.has(booking.id_user)) {
            userDaysMap.set(booking.id_user, new Set());
          }
          userDaysMap.get(booking.id_user)?.add(booking.date);
        }
      });

      userDaysMap.forEach((dates, userId) => {
        const stats = userStatsMap.get(userId);
        if (stats) {
          stats.daysInOffice = dates.size;
        }
      });

      const sortedUserStats = Array.from(userStatsMap.values()).sort(
        (a, b) => b.totalBookings - a.totalBookings
      );
      setUserStats(sortedUserStats);

      const dateStatsMap = new Map<string, { bookings: number; users: Set<number> }>();

      periodBookings.forEach((booking) => {
        if (!dateStatsMap.has(booking.date)) {
          dateStatsMap.set(booking.date, { bookings: 0, users: new Set() });
        }
        const row = dateStatsMap.get(booking.date)!;
        row.bookings++;
        row.users.add(booking.id_user);
      });

      const sortedDateStats = Array.from(dateStatsMap.entries())
        .map(([date, row]) => ({
          date,
          totalBookings: row.bookings,
          uniqueUsers: row.users.size,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      setDateStats(sortedDateStats);

      if (dateStatsMap.size > 0) {
        const avg = periodBookings.length / dateStatsMap.size;
        setAverageBookingsPerDay(Math.round(avg * 10) / 10);
      } else {
        setAverageBookingsPerDay(0);
      }

      const deskBookingMap = new Map<number, number>();
      periodBookings.forEach((booking) => {
        const count = deskBookingMap.get(booking.id_room) || 0;
        deskBookingMap.set(booking.id_room, count + 1);
      });

      if (deskBookingMap.size > 0) {
        const maxBookings = Math.max(...Array.from(deskBookingMap.values()));
        const mostPopularDeskId = Array.from(deskBookingMap.entries()).find(
          ([, count]) => count === maxBookings
        )?.[0];

        if (mostPopularDeskId != null) {
          const sample = periodBookings.find((b) => b.id_room === mostPopularDeskId);
          const label =
            roomIdToName.get(mostPopularDeskId) ||
            sample?.room_name?.trim() ||
            `Space ${mostPopularDeskId}`;
          const totalDays = dateStatsMap.size || 1;
          setMostPopularDesk({
            deskId: mostPopularDeskId,
            deskName: label,
            bookingCount: maxBookings,
            utilizationRate: Math.round((maxBookings / totalDays) * 100),
          });
        }
      } else {
        setMostPopularDesk(null);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
      setErrorMessage('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRangeName = () => {
    if (dateRange === 'week') {
      return 'Past 7 days + next 120 days (scheduled)';
    }
    if (dateRange === 'month') {
      return 'Past 30 days + next 120 days (scheduled)';
    }
    return 'All time';
  };

  // Filter user stats based on search query
  const filteredUserStats = userStats.filter((stat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return stat.userName.toLowerCase().includes(query);
  });
  const paginatedUserStats = filteredUserStats.slice(
    userTablePage * userTableRowsPerPage,
    userTablePage * userTableRowsPerPage + userTableRowsPerPage
  );

  // Export to CSV function
  const exportToCSV = () => {
    // Prepare CSV data
    const headers = ['User Name', 'Role', 'Total Bookings', 'Days in Office', 'Upcoming Bookings'];
    const rows = filteredUserStats.map((stat) => {
      const user = users.find((u) => u.id === stat.userId);
      return [
        stat.userName,
        user?.type || 'N/A',
        stat.totalBookings.toString(),
        stat.daysInOffice.toString(),
        stat.upcomingBookings.toString(),
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `office-statistics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e40af', mb: 1 }}>
            Office Statistics
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Track employee attendance and space utilization ({users.length} users, {spaceCount} bookable spaces)
          </Typography>
        </Box>

        {/* Date Range Filter */}
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'all')}
            label="Time Period"
          >
            <MenuItem value="week">Past week + upcoming (120d)</MenuItem>
            <MenuItem value="month">Past month + upcoming (120d)</MenuItem>
            <MenuItem value="all">All time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #bfdbfe', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    bgcolor: '#eff6ff',
                    p: 1,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EventIcon sx={{ color: '#1e40af', fontSize: 28 }} />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Total Bookings
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e40af' }}>
                {totalBookings}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getRangeName()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #bfdbfe', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    bgcolor: '#f0fdf4',
                    p: 1,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PeopleIcon sx={{ color: '#16a34a', fontSize: 28 }} />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Active Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#16a34a' }}>
                {activeUsers}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                of {users.length} total users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #bfdbfe', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    bgcolor: '#fef3c7',
                    p: 1,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUpIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Avg Bookings/Day
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                {averageBookingsPerDay}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getRangeName()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #bfdbfe', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    bgcolor: '#fce7f3',
                    p: 1,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MeetingRoomIcon sx={{ color: '#ec4899', fontSize: 28 }} />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Most Popular Desk
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ec4899' }}>
                {mostPopularDesk ? mostPopularDesk.deskName : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {mostPopularDesk ? `${mostPopularDesk.bookingCount} bookings` : 'No data'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* User Statistics Table */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #bfdbfe' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ color: '#1e40af', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af' }}>
                  User Activity
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Search users..."
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    minWidth: 250,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#bfdbfe',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1e40af',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1e40af',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#64748b', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={exportToCSV}
                  sx={{
                    borderColor: '#1e40af',
                    color: '#1e40af',
                    '&:hover': {
                      borderColor: '#1e3a8a',
                      bgcolor: '#eff6ff',
                    },
                  }}
                >
                  Export CSV
                </Button>
              </Box>
            </Box>

            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>User</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>
                      Role
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>
                      Total Bookings
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>
                      Days in Office
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>
                      Upcoming
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUserStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {searchQuery ? `No users found matching "${searchQuery}"` : 'No activity data available'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUserStats.map((stat) => {
                      const user = users.find((u) => u.id === stat.userId);
                      return (
                        <TableRow key={stat.userId} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                sx={{ width: 32, height: 32, bgcolor: '#1e40af' }}
                                src={stat.userAvatar}
                              >
                                {stat.userName.charAt(0)}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {stat.userName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={user?.type || 'N/A'}
                              size="small"
                              sx={{
                                bgcolor:
                                  user?.type === 'ADMIN'
                                    ? '#fef3c7'
                                    : user?.type === 'MANAGER'
                                    ? '#dbeafe'
                                    : '#f1f5f9',
                                color:
                                  user?.type === 'ADMIN'
                                    ? '#f59e0b'
                                    : user?.type === 'MANAGER'
                                    ? '#1e40af'
                                    : '#64748b',
                                fontWeight: 600,
                                fontSize: '11px',
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {stat.totalBookings}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{stat.daysInOffice}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={stat.upcomingBookings}
                              size="small"
                              sx={{
                                bgcolor: stat.upcomingBookings > 0 ? '#dcfce7' : '#f1f5f9',
                                color: stat.upcomingBookings > 0 ? '#16a34a' : '#64748b',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredUserStats.length}
              page={userTablePage}
              onPageChange={(_, nextPage) => setUserTablePage(nextPage)}
              rowsPerPage={userTableRowsPerPage}
              onRowsPerPageChange={(event) => {
                setUserTableRowsPerPage(parseInt(event.target.value, 10));
                setUserTablePage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Paper>
        </Grid>

        {/* Daily Statistics */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #bfdbfe' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <BarChartIcon sx={{ color: '#1e40af', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af' }}>
                Daily Breakdown
              </Typography>
            </Box>

            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>
                      Bookings
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>
                      Users
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dateStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No data available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dateStats.map((stat) => (
                      <TableRow key={stat.date} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {new Date(stat.date).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={stat.totalBookings}
                            size="small"
                            sx={{
                              bgcolor: '#eff6ff',
                              color: '#1e40af',
                              fontWeight: 600,
                              minWidth: 40,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{stat.uniqueUsers}</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

