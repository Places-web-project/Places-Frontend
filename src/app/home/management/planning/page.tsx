'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  OutlinedInput,
  ListItemButton,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import EventIcon from '@mui/icons-material/Event';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { apiService } from '@/services/api';
import FloorPlanMap from '@/components/FloorPlanMap';
import { Desk } from '@/types/desk';

interface User {
  id: number;
  name: string;
  avatar: string;
  type: string;
}

interface PendingBooking {
  userId: number;
  userName: string;
  deskId: number;
  deskName: string;
  date: string;
  startTime: string;
  endTime: string;
}

type BookingMode = 'single' | 'bulk';

export default function PlanningTeamDayPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store all users
  const [userTeams, setUserTeams] = useState<number[]>([]); // Store team IDs the current user belongs to
  const [teamsLoaded, setTeamsLoaded] = useState(false); // Track if teams have been loaded
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Auto-select current date (using local timezone to avoid UTC issues)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadingDesks, setLoadingDesks] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Bulk booking states
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedDesks, setSelectedDesks] = useState<number[]>([]);

  // Ensure selectedDate is properly formatted on mount (fix any timezone issues)
  useEffect(() => {
    if (selectedDate) {
      // Check if the date format is correct (YYYY-MM-DD)
      const dateMatch = selectedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateMatch) {
        // Date is already in correct format, but ensure it's using local timezone
        const date = new Date(selectedDate + 'T12:00:00'); // Use noon to avoid timezone edge cases
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const normalizedDate = `${year}-${month}-${day}`;
        // Only update if different to avoid unnecessary re-renders
        if (normalizedDate !== selectedDate) {
          setSelectedDate(normalizedDate);
        }
      }
    }
  }, []); // Only run once on mount

  // Load user teams first, then users
  useEffect(() => {
    const initialize = async () => {
      await loadUserTeams();
      setTeamsLoaded(true);
    };
    initialize();
  }, []);

  // Reload users when userTeams change (for employees) or when teams are loaded
  useEffect(() => {
    if (teamsLoaded) {
      loadUsers();
    }
  }, [userTeams, teamsLoaded]);

  // Load available desks when date/time changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailableDesks();
    }
  }, [selectedDate, startTime, endTime, pendingBookings]);

  const loadUsers = async () => {
    try {
      const response = await apiService.getUsers();
      const allUsersData = response.users || [];
      setAllUsers(allUsersData);
      
      // Always exclude admins
      const usersWithoutAdmins = allUsersData.filter(u => u.type !== 'ADMIN');
      
      // Filter users based on team membership if user is an employee
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const currentUser = JSON.parse(userStr);
          if (currentUser.type === 'EMPLOYEE') {
            if (userTeams.length > 0) {
              // For employees: only show users from the same teams (employees and managers)
              const filteredUsers = await filterUsersByTeam(usersWithoutAdmins, userTeams);
              setUsers(filteredUsers);
            } else {
              // Employee has no teams, show no employees
              setUsers([]);
            }
          } else {
            // For managers/admins: show all employees and managers (but exclude admins)
            setUsers(usersWithoutAdmins.filter(u => u.type === 'EMPLOYEE' || u.type === 'MANAGER'));
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
          setUsers(usersWithoutAdmins.filter(u => u.type === 'EMPLOYEE' || u.type === 'MANAGER'));
        }
      } else {
        setUsers(usersWithoutAdmins.filter(u => u.type === 'EMPLOYEE' || u.type === 'MANAGER'));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setErrorMessage('Failed to load users');
    }
  };

  const loadUserTeams = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setUserTeams([]);
        return;
      }
      
      const currentUser = JSON.parse(userStr);
      if (!currentUser.id) {
        setUserTeams([]);
        return;
      }
      
      // Only load teams for employees (managers see all employees)
      if (currentUser.type === 'EMPLOYEE') {
        const response = await apiService.getUserTeams(currentUser.id);
        const teamIds = (response.teams || []).map((team: any) => team.id);
        setUserTeams(teamIds);
      } else {
        // Managers/admins don't need team filtering
        setUserTeams([]);
      }
    } catch (error) {
      console.error('Failed to load user teams:', error);
      setUserTeams([]);
    }
  };

  const filterUsersByTeam = async (usersList: User[], teamIds: number[]): Promise<User[]> => {
    if (teamIds.length === 0) {
      // If user has no teams, show no employees
      return [];
    }
    
    try {
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
      
      // Filter users to only include teammates (employees and managers in the same teams)
      // This includes the current user since they are part of their own teams
      return usersList.filter(u => 
        (u.type === 'EMPLOYEE' || u.type === 'MANAGER') && 
        teammateUserIds.has(u.id) // Only teammates from the same teams (includes current user)
      );
    } catch (error) {
      console.error('Failed to filter users by team:', error);
      return usersList.filter(u => u.type === 'EMPLOYEE' || u.type === 'MANAGER');
    }
  };

  const loadAvailableDesks = async () => {
    if (!selectedDate) return;
    
    setLoadingDesks(true);
    try {
      // Fetch rooms and bookings from backend API
      const [roomsResponse, bookingsResponse] = await Promise.all([
        apiService.getRooms(),
        apiService.getBookings(),
      ]);

      // Transform backend data to frontend Desk format, filtering by selected date
      let transformedDesks = await apiService.transformRoomsToDesks(
        roomsResponse.rooms,
        bookingsResponse.bookings,
        selectedDate
      );

      // Mark desks in pending bookings as booked with special status
      const pendingDeskIds = new Set(
        pendingBookings
          .filter((pb) => pb.date === selectedDate)
          .map((pb) => pb.deskId)
      );

      transformedDesks = transformedDesks.map((desk) => {
        if (pendingDeskIds.has(desk.id)) {
          return {
            ...desk,
            status: 'booked' as const,
            bookedBy: 'Pending',
          };
        }
        return desk;
      });

      setDesks(transformedDesks);
    } catch (error) {
      console.error('Failed to load desks:', error);
      setErrorMessage('Failed to load available desks');
    } finally {
      setLoadingDesks(false);
    }
  };

  const handleUserToggle = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleDeskClick = (desk: Desk) => {
    // Don't allow selection of booked desks
    if (desk.status === 'booked') return;

    setSelectedDesks((prev) =>
      prev.includes(desk.id) ? prev.filter((id) => id !== desk.id) : [...prev, desk.id]
    );
  };

  const handleAutoAssignDesks = () => {
    if (selectedUsers.length === 0) {
      setErrorMessage('Please select at least one team member');
      return;
    }

    if (!selectedDate) {
      setErrorMessage('Please select a date');
      return;
    }

    // Get consecutive available desks
    const availableDeskIds = desks
      .filter((d) => d.status === 'available')
      .sort((a, b) => a.id - b.id)
      .map((d) => d.id);

    if (availableDeskIds.length < selectedUsers.length) {
      setErrorMessage('Not enough available desks for all selected users');
      return;
    }

    // Find the first set of consecutive desks
    const consecutiveDesks: number[] = [];
    for (let i = 0; i < availableDeskIds.length && consecutiveDesks.length < selectedUsers.length; i++) {
      if (consecutiveDesks.length === 0) {
        consecutiveDesks.push(availableDeskIds[i]);
      } else {
        const lastDesk = consecutiveDesks[consecutiveDesks.length - 1];
        if (availableDeskIds[i] === lastDesk + 1) {
          consecutiveDesks.push(availableDeskIds[i]);
        } else {
          // Reset and start new sequence
          consecutiveDesks.length = 0;
          consecutiveDesks.push(availableDeskIds[i]);
        }
      }
    }

    if (consecutiveDesks.length < selectedUsers.length) {
      // If we can't find enough consecutive desks, just use any available desks
      setSelectedDesks(availableDeskIds.slice(0, selectedUsers.length));
    } else {
      setSelectedDesks(consecutiveDesks);
    }

    setSuccessMessage(`Auto-assigned ${selectedUsers.length} consecutive desk(s)`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleBulkAddToPending = () => {
    setSuccessMessage('');
    setErrorMessage('');

    if (selectedUsers.length === 0) {
      setErrorMessage('Please select at least one team member');
      return;
    }

    if (selectedDesks.length === 0) {
      setErrorMessage('Please select at least one desk');
      return;
    }

    if (!selectedDate) {
      setErrorMessage('Please select a date');
      return;
    }

    if (selectedUsers.length !== selectedDesks.length) {
      setErrorMessage('Number of selected users must match number of selected desks');
      return;
    }

    // Validate time
    if (startTime >= endTime) {
      setErrorMessage('End time must be after start time');
      return;
    }

    const newBookings: PendingBooking[] = [];

    selectedUsers.forEach((userId, index) => {
      const user = users.find((u) => u.id === userId);
      const deskId = selectedDesks[index];
      const desk = desks.find((d) => d.id === deskId);

      if (user && desk) {
        newBookings.push({
          userId: user.id,
          userName: user.name,
          deskId: desk.id,
          deskName: desk.name,
          date: selectedDate,
          startTime,
          endTime,
        });
      }
    });

    setPendingBookings([...pendingBookings, ...newBookings]);
    setSuccessMessage(`Added ${newBookings.length} booking(s) to pending list`);
    
    // Reset selections
    setSelectedUsers([]);
    setSelectedDesks([]);
    
    // Reload desks to reflect the new pending bookings
    loadAvailableDesks();
  };

  const handleRemoveFromPending = (index: number) => {
    const updated = pendingBookings.filter((_, i) => i !== index);
    setPendingBookings(updated);
    
    // Reload available desks to reflect the removed booking
    if (selectedDate) {
      loadAvailableDesks();
    }
  };

  const handleConfirmAllBookings = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      let successCount = 0;
      let failCount = 0;

      for (const booking of pendingBookings) {
        try {
          await apiService.createBooking({
            id_room: booking.deskId,
            id_user: booking.userId,
            date: booking.date,
            start: booking.startTime,
            end: booking.endTime,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to create booking for ${booking.userName}:`, error);
          failCount++;
        }
      }

      if (failCount === 0) {
        setSuccessMessage(`Successfully created ${successCount} booking(s) for the team!`);
        setPendingBookings([]);
      } else {
        setErrorMessage(
          `Created ${successCount} booking(s), but ${failCount} failed. Please try again.`
        );
      }
    } catch (error) {
      console.error('Failed to create bookings:', error);
      setErrorMessage('Failed to create bookings. Please try again.');
    } finally {
      setLoading(false);
      if (selectedDate) {
        loadAvailableDesks();
      }
    }
  };

  const getTodayDate = () => {
    // Get today's date in local timezone (not UTC)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMaxDate = () => {
    // Get max date in local timezone (not UTC)
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    const year = twoWeeksLater.getFullYear();
    const month = String(twoWeeksLater.getMonth() + 1).padStart(2, '0');
    const day = String(twoWeeksLater.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Modify desks to show selection visually
  const desksWithSelection = desks.map((desk) => {
    if (selectedDesks.includes(desk.id) && desk.status === 'available') {
      return {
        ...desk,
        status: 'selected' as const,
        bookedBy: 'Selected',
      };
    }
    return desk;
  });

  return (
    <Box sx={{ p: 4, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e40af', mb: 1 }}>
          Planning Team Day
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
          Book multiple desks for your team members in advance - select team members and consecutive desks
        </Typography>
      </Box>

      {/* Date & Time Configuration */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #bfdbfe' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EventIcon sx={{ color: '#1e40af', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af' }}>
            Date & Time
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              key={`date-${selectedDate}`}
              fullWidth
              label="Date"
              type="date"
              value={selectedDate || ''}
              onChange={(e) => {
                const newDate = e.target.value;
                setSelectedDate(newDate);
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 
                min: getTodayDate(),
                max: getMaxDate()
              }}
              helperText="Select a date within the next 2 weeks"
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Team Members Selection - Full Width */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #bfdbfe' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonAddIcon sx={{ color: '#1e40af', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af' }}>
              Select Team Members
            </Typography>
          </Box>
          <Chip
            label={`${selectedUsers.length} selected`}
            size="small"
            sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600 }}
          />
        </Box>

        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 2 }}>
          Click to select team members who need desks
        </Typography>

        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {users.map((user) => {
            const isSelected = selectedUsers.includes(user.id);
            return (
              <ListItemButton
                key={user.id}
                onClick={() => handleUserToggle(user.id)}
                selected={isSelected}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: isSelected ? '#1e40af' : '#e2e8f0',
                  bgcolor: isSelected ? '#eff6ff' : '#ffffff',
                  '&.Mui-selected': {
                    bgcolor: '#eff6ff',
                    '&:hover': {
                      bgcolor: '#dbeafe',
                    },
                  },
                }}
              >
                <Checkbox
                  checked={isSelected}
                  sx={{
                    color: '#bfdbfe',
                    '&.Mui-checked': {
                      color: '#1e40af',
                    },
                  }}
                />
                <ListItemText
                  primary={user.name}
                  secondary={user.type}
                  primaryTypographyProps={{
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#1e40af' : '#000000',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Paper>

      {/* Desk Selection Grid - Full Width */}
      <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #bfdbfe' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupsIcon sx={{ color: '#1e40af', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af' }}>
              Select Desks
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={`${selectedDesks.length} desk(s) selected`}
              size="small"
              sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600 }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<AutoFixHighIcon />}
              onClick={handleAutoAssignDesks}
              disabled={selectedUsers.length === 0 || !selectedDate || loadingDesks}
              sx={{
                borderColor: '#1e40af',
                color: '#1e40af',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#1e3a8a',
                  bgcolor: '#eff6ff',
                },
              }}
            >
              Auto-Assign
            </Button>
          </Box>
        </Box>

        {!selectedDate ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'rgba(0, 0, 0, 0.4)' }}>
            <EventIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="body1">Please select a date first</Typography>
          </Box>
        ) : loadingDesks ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 2 }}>
              Click desks on the map to select them (select {selectedUsers.length} desk(s) for {selectedUsers.length} team member(s))
            </Typography>

            <Box sx={{ height: '500px', borderRadius: 1, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <FloorPlanMap
                desks={desksWithSelection}
                onDeskClick={handleDeskClick}
                floorPlanImage="/MC_Etaj 4_Plan Compartimentare_11.09.2025-1.png"
              />
            </Box>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Total Desks
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e40af' }}>
                  {desks.length}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Available
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#16a34a' }}>
                  {desks.filter((d) => d.status === 'available').length}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Selected
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e40af' }}>
                  {selectedDesks.length}
                </Typography>
              </Grid>
            </Grid>

            {/* Add to Pending Button */}
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              onClick={handleBulkAddToPending}
              disabled={selectedUsers.length === 0 || selectedDesks.length === 0}
              sx={{
                mt: 3,
                bgcolor: '#1e40af',
                '&:hover': { bgcolor: '#1e3a8a' },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
              }}
            >
              Add {selectedUsers.length > 0 && selectedDesks.length > 0 ? `${Math.min(selectedUsers.length, selectedDesks.length)} Booking(s)` : 'Bookings'} to Pending
            </Button>
          </>
        )}

        {/* Messages */}
        {successMessage && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
      </Paper>

      {/* Pending Bookings */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: 2, border: '1px solid #bfdbfe' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupsIcon sx={{ color: '#1e40af', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af' }}>
              Pending Bookings
            </Typography>
          </Box>
          <Chip
            label={`${pendingBookings.length} booking(s)`}
            sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600 }}
          />
        </Box>

        {pendingBookings.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              color: 'rgba(0, 0, 0, 0.4)',
            }}
          >
            <GroupsIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="body1">No pending bookings yet</Typography>
            <Typography variant="body2">Select team members and desks to get started</Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {pendingBookings.map((booking, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card sx={{ border: '1px solid #e2e8f0', position: 'relative' }}>
                    <CardContent sx={{ pb: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveFromPending(index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          color: 'error.main',
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, pr: 4, mb: 1 }}>
                        {booking.userName}
                      </Typography>
                      <Chip
                        label={booking.deskName}
                        size="small"
                        sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600, mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                        {new Date(booking.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                        {booking.startTime} - {booking.endTime}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Button
              variant="contained"
              fullWidth
              disabled={loading}
              onClick={() => setConfirmDialogOpen(true)}
              sx={{
                bgcolor: '#16a34a',
                '&:hover': { bgcolor: '#15803d' },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                `Confirm All ${pendingBookings.length} Booking(s)`
              )}
            </Button>
          </>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Team Bookings</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to create {pendingBookings.length} booking(s) for your team?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAllBookings}
            variant="contained"
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            Confirm All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
