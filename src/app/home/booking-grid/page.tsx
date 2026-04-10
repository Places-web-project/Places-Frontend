'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Avatar,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import GroupsIcon from '@mui/icons-material/Groups';
import { apiService } from '@/services/api';

interface UserBooking {
  user_id: number;
  user_name: string;
  avatar?: string;
  bookings: Array<{
    id: number;
    id_room: number;
    date: string;
    start: string;
    end: string;
  }>;
}

interface DayData {
  date: string;
  dateObj: Date;
  users: UserBooking[];
}

export default function BookingGridPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [daysData, setDaysData] = useState<DayData[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userTeams, setUserTeams] = useState<number[]>([]); // Store team IDs the current user belongs to
  const [teamsLoaded, setTeamsLoaded] = useState(false); // Track if teams have been loaded
  const [showTeamMembersOnly, setShowTeamMembersOnly] = useState(true); // Filter toggle: true = team members only, false = everyone
  const [userTeamNames, setUserTeamNames] = useState<Record<number, string[]>>({}); // Map of user ID to their team names

  useEffect(() => {
    const initialize = async () => {
      setMounted(true);
      // Wait a bit for localStorage to be available
      await new Promise(resolve => setTimeout(resolve, 100));
      const teamIds = await loadUserTeams();
      setUserTeams(teamIds);
      setTeamsLoaded(true);
      await loadData(teamIds);
    };
    initialize();
  }, []);

  // Reload data when filter changes
  useEffect(() => {
    if (teamsLoaded) {
      loadData(userTeams);
    }
  }, [showTeamMembersOnly, teamsLoaded]);

  const loadUserTeams = async (): Promise<number[]> => {
    try {
      // Ensure we're on the client side
      if (typeof window === 'undefined') {
        return [];
      }
      
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return [];
      }
      
      const currentUser = JSON.parse(userStr);
      if (!currentUser.id) {
        return [];
      }
      
      // Load teams for employees and managers
      if (currentUser.type === 'EMPLOYEE' || currentUser.type === 'MANAGER') {
        const response = await apiService.getUserTeams(currentUser.id);
        const teamIds = (response.teams || []).map((team: any) => team.id);
        return teamIds;
      } else {
        // Admins don't need team filtering
        return [];
      }
    } catch (error) {
      console.error('[BookingGrid] Failed to load user teams:', error);
      return [];
    }
  };

  const loadTeamNamesForUsers = async (usersList: any[]) => {
    try {
      // Get all teams
      const allTeams = await apiService.getTeams();
      
      // Create a map of user ID to their team names
      const userTeamNamesMap: Record<number, string[]> = {};
      
      usersList.forEach((user: any) => {
        const userTeamsList: string[] = [];
        allTeams.forEach((team: any) => {
          const isMember = team.members.some((member: any) => member.userId === user.id);
          if (isMember) {
            userTeamsList.push(team.name);
          }
        });
        userTeamNamesMap[user.id] = userTeamsList;
      });
      
      setUserTeamNames(userTeamNamesMap);
    } catch (error) {
      console.error('[BookingGrid] Failed to load team names for users:', error);
      setUserTeamNames({});
    }
  };

  const filterUsersByTeam = async (usersList: any[], teamIds: number[]): Promise<any[]> => {
    // If filter is inactive, show everyone (including admins)
    if (!showTeamMembersOnly) {
      return usersList;
    }
    
    // Filter is active - exclude admins and filter by team
    const filteredList = usersList.filter(u => u.type !== 'ADMIN');
    
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      return filteredList.filter(u => u.type === 'EMPLOYEE' || u.type === 'MANAGER');
    }
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return filteredList.filter(u => u.type === 'EMPLOYEE' || u.type === 'MANAGER');
    }
    
    try {
      const currentUser = JSON.parse(userStr);
      
      if (currentUser.type === 'EMPLOYEE') {
        if (teamIds.length === 0) {
          // Employee has no teams, show only the current user
          return filteredList.filter(u => u.id === currentUser.id);
        }
        
        // Get all teams with their members
        const allTeams = await apiService.getTeams();
        
        // Get all user IDs that are in the same teams (both employees and managers)
        const teammateUserIds = new Set<number>();
        allTeams.forEach((team: any) => {
          if (teamIds.includes(team.id)) {
            team.members.forEach((member: any) => {
              teammateUserIds.add(member.userId);
            });
          }
        });
        
        // Filter users to include only teammates (employees and managers in the same teams)
        return filteredList.filter(u => 
          (u.type === 'EMPLOYEE' || u.type === 'MANAGER') && 
          teammateUserIds.has(u.id)
        );
      } else if (currentUser.type === 'MANAGER') {
        // For managers: check if they belong to any teams
        const managerTeamsResponse = await apiService.getUserTeams(currentUser.id);
        const managerTeamIds = (managerTeamsResponse.teams || []).map((team: any) => team.id);
        
        if (managerTeamIds.length > 0) {
          // Manager is part of teams - show only teammates
          const allTeams = await apiService.getTeams();
          
          // Get all user IDs that are in the same teams (both employees and managers)
          const teammateUserIds = new Set<number>();
          allTeams.forEach((team: any) => {
            if (managerTeamIds.includes(team.id)) {
              team.members.forEach((member: any) => {
                teammateUserIds.add(member.userId);
              });
            }
          });
          
          // Filter users to include only teammates (employees and managers in the same teams)
          return filteredList.filter(u => 
            (u.type === 'EMPLOYEE' || u.type === 'MANAGER') && 
            teammateUserIds.has(u.id)
          );
        } else {
          // Manager has no teams - show all employees and managers
          return filteredList.filter(u => u.type === 'EMPLOYEE' || u.type === 'MANAGER');
        }
      } else {
        // For admins: show all employees and managers (but still exclude admins)
        return filteredList.filter(u => u.type === 'EMPLOYEE' || u.type === 'MANAGER');
      }
    } catch (error) {
      console.error('[BookingGrid] Failed to filter users by team:', error);
      return filteredList.filter(u => u.type === 'EMPLOYEE' || u.type === 'MANAGER');
    }
  };

  const loadData = async (teamIds?: number[]) => {
    try {
      setLoading(true);
      
      // Use provided teamIds or fall back to state
      const teamsToUse = teamIds !== undefined ? teamIds : userTeams;
      
      // Get all users
      const usersResponse = await apiService.getUsers();
      
      // Filter users based on team membership
      const filteredUsers = await filterUsersByTeam(usersResponse.users, teamsToUse);
      setAllUsers(filteredUsers);

      // Load team names for all filtered users
      await loadTeamNamesForUsers(filteredUsers);

      // Get all rooms to map room IDs to names
      const roomsResponse = await apiService.getRooms();
      setRooms(roomsResponse.rooms);

      // Get next 7 days starting from today
      // Calculate today's date in YYYY-MM-DD format to match backend expectations
      const now = new Date();
      // Get date string in local timezone (YYYY-MM-DD)
      const todayStr = now.toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD format
      const todayDate = new Date(todayStr + 'T12:00:00'); // Use noon to avoid timezone issues
      const next7Days: DayData[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(todayDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        try {
          // Get bookings for this date (only for today and future dates)
          // The backend will reject past dates, so we handle that in the catch block
          const bookingsResponse = await apiService.getBookingsByDate(dateStr);
          
          // Ensure all filtered users are included, even if they don't have bookings
          const usersMap = new Map();
          filteredUsers.forEach((user: any) => {
            usersMap.set(user.id, {
              user_id: user.id,
              user_name: user.name,
              avatar: user.avatar,
              bookings: [],
            });
          });
          
          // Update with bookings data
          bookingsResponse.users.forEach((userBooking: UserBooking) => {
            if (usersMap.has(userBooking.user_id)) {
              const existingUser = usersMap.get(userBooking.user_id) as UserBooking;
              // Merge bookings into existing user data
              usersMap.set(userBooking.user_id, {
                ...existingUser,
                bookings: userBooking.bookings || [],
              });
            } else {
              usersMap.set(userBooking.user_id, userBooking);
            }
          });

          next7Days.push({
            date: dateStr,
            dateObj: date,
            users: Array.from(usersMap.values()),
          });
        } catch (error: any) {
          // If date is in the past or error, add all filtered users with no bookings
          console.warn(`Failed to get bookings for ${dateStr}:`, error.message);
          next7Days.push({
            date: dateStr,
            dateObj: date,
            users: filteredUsers.map((user: any) => ({
              user_id: user.id,
              user_name: user.name,
              avatar: user.avatar,
              bookings: [],
            })),
          });
        }
      }

      setDaysData(next7Days);
    } catch (error) {
      console.error('Failed to load booking grid data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoomName = (roomId: number): string => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return `Room ${roomId}`;
    
    try {
      const roomData = JSON.parse(room.data);
      return roomData.name || `Room ${roomId}`;
    } catch {
      return `Room ${roomId}`;
    }
  };

  const getUserLocationForDay = (user: UserBooking, dayDate: string): string | null => {
    // Find booking for this user on this day
    const booking = user.bookings.find(b => b.date === dayDate);
    if (booking) {
      // Check if the room is a desk (not meeting room or recreational)
      const room = rooms.find(r => r.id === booking.id_room);
      if (room) {
        try {
            const roomData = JSON.parse(room.data);
            // Only show desks, filter out meeting rooms and recreational spaces
            // Check for desk type explicitly, or if type is missing/undefined, assume it's a desk
            if (roomData.type === 'desk' || roomData.type === undefined || roomData.type === null || roomData.type === '') {
              return getRoomName(booking.id_room);
            }
          } catch (error) {
            // If parsing fails, assume it's a desk and show it
            console.warn(`Failed to parse room data for room ${booking.id_room}:`, error);
            return getRoomName(booking.id_room);
          }
      } else {
        // Room not found - this might indicate a data mismatch
        console.warn(`Room with id ${booking.id_room} not found in rooms array. Total rooms: ${rooms.length}`);
      }
    }
    return null;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = () => {
    if (!mounted) return 'Loading...';
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDateHeader = () => {
    if (!mounted) return 'Loading...';
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  // Use only the filtered users (allUsers is already filtered by team)
  // Apply search query filter
  const filteredUsersToShow = allUsers
    .map(u => ({ id: u.id, name: u.name, avatar: u.avatar }))
    .filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Box sx={{ p: 4, bgcolor: '#ffffff', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Team Bookings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showTeamMembersOnly}
                onChange={(e) => setShowTeamMembersOnly(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <GroupsIcon sx={{ fontSize: 18, color: showTeamMembersOnly ? '#2563eb' : '#666' }} />
                <Typography variant="body2" sx={{ fontWeight: showTeamMembersOnly ? 600 : 400, color: showTeamMembersOnly ? '#2563eb' : '#666' }}>
                  Team Members Only
                </Typography>
              </Box>
            }
            sx={{ mr: 2 }}
          />
          <TextField
            placeholder="Type to find a colleague"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#666' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#f5f5f5',
              },
            }}
          />
        </Box>
      </Box>

      {/* Main Content */}
      <Paper elevation={0} sx={{ p: 3, bgcolor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
          Next 7 Days
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, zIndex: 3, bgcolor: '#f5f5f5', minWidth: 140 }}>
                    User
                  </TableCell>
                  {daysData.map((day, index) => {
                    const isToday = day.dateObj.toDateString() === new Date().toDateString();
                    return (
                      <TableCell
                        key={day.date}
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          borderLeft: '1px solid #e0e0e0',
                          borderBottom: isToday ? '2px solid #2563eb' : '1px solid #e0e0e0',
                          minWidth: 120,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {formatDate(day.dateObj)}
                          </Typography>
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsersToShow.map((user) => {
                  // Get current user from localStorage to highlight them
                  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
                  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
                  const isCurrentUser = currentUser && user.id === currentUser.id;

                  return (
                    <TableRow 
                      key={user.id} 
                      sx={{ 
                        '&:hover': { bgcolor: '#f9fafb' },
                        bgcolor: isCurrentUser ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                      }}
                    >
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                          bgcolor: isCurrentUser ? 'rgba(37, 99, 235, 0.05)' : '#ffffff',
                          borderRight: '1px solid #e0e0e0',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: user.avatar ? 'transparent' : '#1e40af',
                              border: '2px solid #bfdbfe',
                              '& svg': {
                                width: '100%',
                                height: '100%',
                              },
                            }}
                          >
                            {user.avatar ? (
                              <Box
                                dangerouslySetInnerHTML={{ __html: user.avatar }}
                                sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                                {user.name
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </Typography>
                            )}
                          </Avatar>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ fontWeight: isCurrentUser ? 600 : 500, color: isCurrentUser ? '#1e40af' : 'inherit' }}>
                            {isCurrentUser ? 'You' : user.name}
                          </Typography>
                            {userTeamNames[user.id] && userTeamNames[user.id].length > 0 && (
                              <Typography variant="caption" sx={{ color: '#666', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                <GroupsIcon sx={{ fontSize: 12 }} />
                                {userTeamNames[user.id].join(', ')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      {daysData.map((day) => {
                        // Find user data for this day
                        const userDayData = day.users.find(u => u.user_id === user.id);
                        const location = userDayData ? getUserLocationForDay(userDayData, day.date) : null;

                        return (
                          <TableCell
                            key={`${user.id}-${day.date}`}
                            align="center"
                            sx={{ borderLeft: '1px solid #e0e0e0' }}
                          >
                            {location ? (
                              <Chip
                                icon={<BusinessIcon sx={{ color: '#fff !important' }} />}
                                label={location}
                                size="small"
                                sx={{
                                  bgcolor: '#2563eb',
                                  color: '#fff',
                                  '& .MuiChip-icon': { color: '#fff' },
                                }}
                              />
                            ) : (
                              <Chip
                                icon={<HomeIcon sx={{ color: '#666 !important' }} />}
                                label="Remote"
                                size="small"
                                sx={{
                                  bgcolor: '#e5e7eb',
                                  color: '#666',
                                  '& .MuiChip-icon': { color: '#666' },
                                }}
                              />
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
