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

// Seeded random number generator for consistent data
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Generate large employee list (250 employees for 216 desks - realistic office scenario)
const generateEmployeeList = (): User[] => {
  const firstNames = [
    'John', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'James', 'Maria', 'Robert', 'Jennifer',
    'Christopher', 'Amanda', 'Daniel', 'Jessica', 'Matthew', 'Ashley', 'Andrew', 'Michelle', 'Joshua', 'Nicole',
    'Ryan', 'Stephanie', 'Kevin', 'Melissa', 'Brian', 'Kimberly', 'Jason', 'Amy', 'Justin', 'Angela',
    'William', 'Rebecca', 'Jonathan', 'Laura', 'Eric', 'Sharon', 'Steven', 'Cynthia', 'Mark', 'Kathleen',
    'Anthony', 'Samantha', 'Thomas', 'Deborah', 'Charles', 'Rachel', 'Joseph', 'Carolyn', 'Daniel', 'Janet',
    'Paul', 'Catherine', 'Kenneth', 'Maria', 'Gregory', 'Frances', 'Ronald', 'Christine', 'Timothy', 'Sandra',
    'Jose', 'Donna', 'Larry', 'Carol', 'Jeffrey', 'Ruth', 'Frank', 'Sharon', 'Scott', 'Michelle',
    'Eric', 'Laura', 'Stephen', 'Sarah', 'Andrew', 'Kimberly', 'Raymond', 'Deborah', 'Gregory', 'Lisa',
    'Samuel', 'Nancy', 'Patrick', 'Karen', 'Alexander', 'Betty', 'Jack', 'Helen', 'Dennis', 'Sandra',
    'Jerry', 'Donna', 'Tyler', 'Carol', 'Aaron', 'Ruth', 'Jose', 'Sharon', 'Adam', 'Michelle',
    'Henry', 'Laura', 'Douglas', 'Sarah', 'Nathan', 'Kimberly', 'Zachary', 'Deborah', 'Peter', 'Lisa',
    'Kyle', 'Nancy', 'Noah', 'Karen', 'Ethan', 'Betty', 'Jeremy', 'Helen', 'Walter', 'Sandra',
    'Alan', 'Donna', 'Juan', 'Carol', 'Wayne', 'Ruth', 'Roy', 'Sharon', 'Ralph', 'Michelle',
    'Eugene', 'Laura', 'Louis', 'Sarah', 'Philip', 'Kimberly', 'Bobby', 'Deborah', 'Johnny', 'Lisa',
    'Terry', 'Nancy', 'Lawrence', 'Karen', 'Sean', 'Betty', 'Christian', 'Helen', 'Jesse', 'Sandra',
    'Austin', 'Donna', 'Gerald', 'Carol', 'Carlos', 'Ruth', 'Roger', 'Sharon', 'Keith', 'Michelle',
    'Arthur', 'Laura', 'Dylan', 'Sarah', 'Harold', 'Kimberly', 'Jordan', 'Deborah', 'Bryan', 'Lisa',
    'Albert', 'Nancy', 'Joe', 'Karen', 'Willie', 'Betty', 'Gabriel', 'Helen', 'Logan', 'Sandra',
    'Randy', 'Donna', 'Howard', 'Carol', 'Ethan', 'Ruth', 'Vincent', 'Sharon', 'Bruce', 'Michelle',
    'Elijah', 'Laura', 'Dylan', 'Sarah', 'Alan', 'Kimberly', 'Juan', 'Deborah', 'Wayne', 'Lisa',
    'Roy', 'Nancy', 'Ralph', 'Karen', 'Eugene', 'Betty', 'Louis', 'Helen', 'Philip', 'Sandra',
    'Bobby', 'Donna', 'Johnny', 'Carol', 'Terry', 'Ruth', 'Lawrence', 'Sharon', 'Sean', 'Michelle',
    'Christian', 'Laura', 'Jesse', 'Sarah', 'Austin', 'Kimberly', 'Gerald', 'Deborah', 'Carlos', 'Lisa',
    'Roger', 'Nancy', 'Keith', 'Karen', 'Arthur', 'Betty', 'Dylan', 'Helen', 'Harold', 'Sandra',
    'Jordan', 'Donna', 'Bryan', 'Carol', 'Albert', 'Ruth', 'Joe', 'Sharon', 'Willie', 'Michelle',
    'Gabriel', 'Laura', 'Logan', 'Sarah', 'Randy', 'Kimberly', 'Howard', 'Deborah', 'Ethan', 'Lisa',
    'Vincent', 'Nancy', 'Bruce', 'Karen', 'Elijah', 'Betty', 'Dylan', 'Helen', 'Alan', 'Sandra',
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
    'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
    'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
    'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips',
    'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris',
    'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson',
    'Cox', 'Howard', 'Ward', 'Torres', 'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks',
    'Kelly', 'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins',
    'Perry', 'Powell', 'Long', 'Patterson', 'Hughes', 'Flores', 'Washington', 'Butler', 'Simmons', 'Foster',
    'Gonzales', 'Bryant', 'Alexander', 'Russell', 'Griffin', 'Diaz', 'Hayes', 'Myers', 'Ford', 'Hamilton',
    'Graham', 'Sullivan', 'Wallace', 'Woods', 'Cole', 'West', 'Jordan', 'Owens', 'Reynolds', 'Fisher',
    'Ellis', 'Harrison', 'Gibson', 'Mcdonald', 'Cruz', 'Marshall', 'Ortiz', 'Gomez', 'Murray', 'Freeman',
    'Wells', 'Webb', 'Simpson', 'Stevens', 'Tucker', 'Porter', 'Hunter', 'Hicks', 'Crawford', 'Henry',
    'Boyd', 'Mason', 'Morales', 'Kennedy', 'Warren', 'Dixon', 'Ramos', 'Reyes', 'Burns', 'Gordon',
    'Shaw', 'Holmes', 'Rice', 'Robertson', 'Hunt', 'Black', 'Daniels', 'Palmer', 'Mills', 'Nichols',
    'Grant', 'Knight', 'Ferguson', 'Rose', 'Stone', 'Hawkins', 'Dunn', 'Perkins', 'Hudson', 'Spencer',
    'Gardner', 'Stephens', 'Payne', 'Pierce', 'Berry', 'Matthews', 'Arnold', 'Wagner', 'Willis', 'Ray',
    'Watkins', 'Olson', 'Carroll', 'Duncan', 'Snyder', 'Hart', 'Cunningham', 'Bradley', 'Lane', 'Andrews',
  ];

  const users: User[] = [];
  const totalEmployees = 250;
  const managerCount = 15;
  const adminCount = 5;

  for (let i = 1; i <= totalEmployees; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[Math.floor((i - 1) / firstNames.length) % lastNames.length];
    
    let type: string;
    if (i <= adminCount) {
      type = 'ADMIN';
    } else if (i <= adminCount + managerCount) {
      type = 'MANAGER';
    } else {
      type = 'EMPLOYEE';
    }

    users.push({
      id: i,
      name: `${firstName} ${lastName}`,
      avatar: '',
      type: type,
    });
  }

  return users;
};

// Mock data generator with realistic patterns for 216 desks and 250+ employees
const generateMockData = (dateRange: 'week' | 'month' | 'all') => {
  const mockUsers = generateEmployeeList();
  
  // Use seeded random for consistent data (fixed seed: 12345)
  const rng = new SeededRandom(12345);

  // User booking frequency - realistic office patterns
  // With 250 employees and 216 desks, not everyone can book every day
  const userFrequency = new Map<number, number>();
  mockUsers.forEach((user) => {
    // Managers and admins come to office more (60-80% of days)
    // Regular employees come less (20-50% of days) - hybrid work model
    if (user.type === 'ADMIN') {
      userFrequency.set(user.id, 0.75 + rng.next() * 0.1); // 75-85%
    } else if (user.type === 'MANAGER') {
      userFrequency.set(user.id, 0.60 + rng.next() * 0.15); // 60-75%
    } else {
      userFrequency.set(user.id, 0.20 + rng.next() * 0.30); // 20-50%
    }
  });

  const today = new Date();
  const mockBookings: any[] = [];
  const TOTAL_DESKS = 216;
  let daysBack = 0;
  
  if (dateRange === 'week') {
    daysBack = 7;
  } else if (dateRange === 'month') {
    daysBack = 30;
  } else {
    daysBack = 90; // 3 months for "all time"
  }

  // Popular desk zones (windows, corners, etc.) - desks 1-50, 100-150, 200-216
  const popularDeskZones = [
    ...Array.from({ length: 50 }, (_, i) => i + 1),   // First 50 desks
    ...Array.from({ length: 51 }, (_, i) => i + 100), // Desks 100-150
    ...Array.from({ length: 17 }, (_, i) => i + 200), // Desks 200-216
  ];

  // Generate bookings for each day
  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    // Fewer bookings in the past, more recent (simulate growth trend)
    const recencyFactor = 1 - (i / daysBack) * 0.2; // 80-100% of max
    
    // Monday/Friday fewer bookings (remote work days)
    const dayOfWeek = date.getDay();
    const dayFactor = (dayOfWeek === 1 || dayOfWeek === 5) ? 0.65 : 1.0; // Mon/Fri 65% capacity
    
    // Target: 60-85% desk utilization on weekdays, 40-55% on Mon/Fri
    const targetUtilization = dayFactor === 0.65 ? 0.45 + rng.next() * 0.1 : 0.70 + rng.next() * 0.15;
    const targetBookings = Math.floor(TOTAL_DESKS * targetUtilization * recencyFactor);
    
    // Track which desks are booked today to avoid double-booking
    const bookedDesks = new Set<number>();
    let bookingsToday = 0;
    
    // Shuffle users deterministically using seeded random
    const shuffledUsers = [...mockUsers].sort(() => rng.next() - 0.5);
    
    // Generate bookings until we reach target or run out of desks
    for (const user of shuffledUsers) {
      if (bookingsToday >= targetBookings) break;
      
      const frequency = userFrequency.get(user.id) || 0.35;
      if (rng.next() < frequency * dayFactor) {
        // Try to find an available desk
        let deskId: number;
        let attempts = 0;
        
        // 70% chance to prefer popular zones, 30% random
        if (rng.next() < 0.7 && popularDeskZones.length > 0) {
          const availablePopular = popularDeskZones.filter(d => !bookedDesks.has(d));
          if (availablePopular.length > 0) {
            deskId = availablePopular[Math.floor(rng.next() * availablePopular.length)];
          } else {
            // All popular desks taken, use any available
            deskId = Math.floor(rng.next() * TOTAL_DESKS) + 1;
            while (bookedDesks.has(deskId) && attempts < 10) {
              deskId = Math.floor(rng.next() * TOTAL_DESKS) + 1;
              attempts++;
            }
          }
        } else {
          deskId = Math.floor(rng.next() * TOTAL_DESKS) + 1;
          while (bookedDesks.has(deskId) && attempts < 10) {
            deskId = Math.floor(rng.next() * TOTAL_DESKS) + 1;
            attempts++;
          }
        }
        
        // Only add if desk is available
        if (!bookedDesks.has(deskId)) {
          bookedDesks.add(deskId);
          bookingsToday++;
          
          mockBookings.push({
            id: mockBookings.length + 1,
            id_room: deskId,
            id_user: user.id,
            date: dateStr,
            start: '09:00',
            end: '18:00',
          });
        }
      }
    }
  }

  // Add future bookings for "upcoming" stats (next 7 days)
  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    
    // Skip weekends
    if (futureDate.getDay() === 0 || futureDate.getDay() === 6) continue;
    
    const dateStr = futureDate.toISOString().split('T')[0];
    const dayOfWeek = futureDate.getDay();
    const dayFactor = (dayOfWeek === 1 || dayOfWeek === 5) ? 0.65 : 1.0;
    const targetBookings = Math.floor(TOTAL_DESKS * (0.60 + rng.next() * 0.20) * dayFactor);
    
    const bookedDesks = new Set<number>();
    const shuffledUsers = [...mockUsers].sort(() => rng.next() - 0.5);
    
    for (const user of shuffledUsers) {
      if (bookedDesks.size >= targetBookings) break;
      
      const frequency = userFrequency.get(user.id) || 0.35;
      if (rng.next() < frequency * dayFactor) {
        let deskId = Math.floor(rng.next() * TOTAL_DESKS) + 1;
        let attempts = 0;
        while (bookedDesks.has(deskId) && attempts < 10) {
          deskId = Math.floor(rng.next() * TOTAL_DESKS) + 1;
          attempts++;
        }
        
        if (!bookedDesks.has(deskId)) {
          bookedDesks.add(deskId);
          mockBookings.push({
            id: mockBookings.length + 1,
            id_room: deskId,
            id_user: user.id,
            date: dateStr,
            start: '09:00',
            end: '18:00',
          });
        }
      }
    }
  }

  return { mockUsers, mockBookings };
};

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
      // Always use mock data for realistic office scenario (250 employees, 216 desks)
      const { mockUsers, mockBookings } = generateMockData(dateRange);
      const allUsers = mockUsers;
      const allBookings = mockBookings;
      setUsers(allUsers);

      // Calculate date range
      const today = new Date();
      let filterStartDate = new Date();
      
      if (dateRange === 'week') {
        filterStartDate.setDate(today.getDate() - 7);
      } else if (dateRange === 'month') {
        filterStartDate.setDate(today.getDate() - 30);
      } else {
        // For 'all', set to a very old date
        filterStartDate = new Date(2000, 0, 1);
      }

      // Filter bookings by date range
      const filteredBookings = allBookings.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= filterStartDate && bookingDate <= today;
      });

      // Calculate total bookings
      setTotalBookings(filteredBookings.length);

      // Calculate active users (users with at least one booking)
      const uniqueUserIds = new Set(filteredBookings.map((b) => b.id_user));
      setActiveUsers(uniqueUserIds.size);

      // Calculate user statistics
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

      filteredBookings.forEach((booking) => {
        const stats = userStatsMap.get(booking.id_user);
        if (stats) {
          stats.totalBookings++;
          
          // Check if booking is upcoming
          const bookingDate = new Date(booking.date);
          if (bookingDate >= new Date()) {
            stats.upcomingBookings++;
          }

          // Track unique days
          if (!userDaysMap.has(booking.id_user)) {
            userDaysMap.set(booking.id_user, new Set());
          }
          userDaysMap.get(booking.id_user)?.add(booking.date);
        }
      });

      // Update days in office
      userDaysMap.forEach((dates, userId) => {
        const stats = userStatsMap.get(userId);
        if (stats) {
          stats.daysInOffice = dates.size;
        }
      });

      const sortedUserStats = Array.from(userStatsMap.values())
        .sort((a, b) => b.totalBookings - a.totalBookings);
      setUserStats(sortedUserStats);

      // Calculate date statistics
      const dateStatsMap = new Map<string, { bookings: number; users: Set<number> }>();
      
      filteredBookings.forEach((booking) => {
        if (!dateStatsMap.has(booking.date)) {
          dateStatsMap.set(booking.date, { bookings: 0, users: new Set() });
        }
        const stats = dateStatsMap.get(booking.date)!;
        stats.bookings++;
        stats.users.add(booking.id_user);
      });

      const sortedDateStats = Array.from(dateStatsMap.entries())
        .map(([date, stats]) => ({
          date,
          totalBookings: stats.bookings,
          uniqueUsers: stats.users.size,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10); // Show last 10 days

      setDateStats(sortedDateStats);

      // Calculate average bookings per day
      if (dateStatsMap.size > 0) {
        const avg = filteredBookings.length / dateStatsMap.size;
        setAverageBookingsPerDay(Math.round(avg * 10) / 10);
      } else {
        setAverageBookingsPerDay(0);
      }

      // Calculate desk utilization
      const deskBookingMap = new Map<number, number>();
      filteredBookings.forEach((booking) => {
        const count = deskBookingMap.get(booking.id_room) || 0;
        deskBookingMap.set(booking.id_room, count + 1);
      });

      if (deskBookingMap.size > 0) {
        const maxBookings = Math.max(...Array.from(deskBookingMap.values()));
        const mostPopularDeskId = Array.from(deskBookingMap.entries())
          .find(([_, count]) => count === maxBookings)?.[0];

        if (mostPopularDeskId) {
          const totalDays = dateStatsMap.size || 1;
          setMostPopularDesk({
            deskId: mostPopularDeskId,
            deskName: `Desk ${mostPopularDeskId}`,
            bookingCount: maxBookings,
            utilizationRate: Math.round((maxBookings / totalDays) * 100),
          });
        }
      }

    } catch (error) {
      console.error('Failed to load statistics:', error);
      setErrorMessage('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRangeName = () => {
    if (dateRange === 'week') return 'Last 7 Days';
    if (dateRange === 'month') return 'Last 30 Days';
    return 'All Time';
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
            Track employee attendance and office utilization (250 employees, 216 desks)
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
            <MenuItem value="week">Last 7 Days</MenuItem>
            <MenuItem value="month">Last 30 Days</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={stat.upcomingBookings}
                                size="small"
                                sx={{
                                  bgcolor: stat.upcomingBookings > 0 ? '#dcfce7' : '#f1f5f9',
                                  color: stat.upcomingBookings > 0 ? '#16a34a' : '#64748b',
                                  fontWeight: 600,
                                }}
                              />
                              {stat.userName === 'Rebeca' && (
                                <Alert
                                  severity="warning"
                                  sx={{
                                    mt: 1,
                                    fontSize: '0.75rem',
                                    py: 0.5,
                                    '& .MuiAlert-message': {
                                      fontSize: '0.75rem',
                                      padding: 0,
                                    },
                                  }}
                                >
                                  You booked 10 days and attended only 1 in last 30 days
                                </Alert>
                              )}
                            </Box>
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

