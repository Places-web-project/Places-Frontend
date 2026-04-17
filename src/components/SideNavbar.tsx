'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ViewListIcon from '@mui/icons-material/ViewList';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FeedbackIcon from '@mui/icons-material/Feedback';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import BarChartIcon from '@mui/icons-material/BarChart';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

const DRAWER_WIDTH = 290;

interface SideNavbarProps {
  children: React.ReactNode;
}

export default function SideNavbar({ children }: SideNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [personalSpacesOpen, setPersonalSpacesOpen] = useState(
    pathname?.includes('/home/bookings') || 
    pathname === '/home' || 
    pathname === '/booking' ||
    pathname?.includes('/home/booking-grid')
  );
  const [userSettingsOpen, setUserSettingsOpen] = useState(
    pathname === '/avatar-builder' || pathname === '/home/settings' || pathname === '/home/points' || pathname === '/home/feedback'
  );
  const [managementOpen, setManagementOpen] = useState(
    pathname?.includes('/home/management')
  );
  const [adminOpen, setAdminOpen] = useState(
    pathname?.includes('/home/admin')
  );
  const [userType, setUserType] = useState<string | null>(null);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  useEffect(() => {
    setMounted(true);
    
    // Load user data from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userTypeValue = user.type || null;
        setUserType(userTypeValue);
        
        // Load avatar from user object first (from login/backend)
        if (user.avatar && user.avatar.trim()) {
          setAvatarUrl(user.avatar);
        } else {
          // Fall back to userAvatarSvg if user object doesn't have avatar
          const savedAvatar = localStorage.getItem('userAvatarSvg');
          if (savedAvatar) {
            setAvatarUrl(savedAvatar);
          }
        }
        
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    } else {
      // If no user object, try userAvatarSvg as fallback
      const savedAvatar = localStorage.getItem('userAvatarSvg');
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      }
    }
    
    // Listen for storage changes to update avatar when saved
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userAvatarSvg' && e.newValue) {
        setAvatarUrl(e.newValue);
      }
      if (e.key === 'user' && e.newValue) {
        try {
          const user = JSON.parse(e.newValue);
          setUserType(user.type || null);
          // Update avatar from user object
          if (user.avatar && user.avatar.trim()) {
            setAvatarUrl(user.avatar);
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event from avatar builder page
    const handleAvatarUpdate = () => {
      // Check user object first, then fallback to userAvatarSvg
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserType(user.type || null);
          if (user.avatar && user.avatar.trim()) {
            setAvatarUrl(user.avatar);
          } else {
            const savedAvatar = localStorage.getItem('userAvatarSvg');
            if (savedAvatar) {
              setAvatarUrl(savedAvatar);
            }
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      } else {
        const savedAvatar = localStorage.getItem('userAvatarSvg');
        if (savedAvatar) {
          setAvatarUrl(savedAvatar);
        }
      }
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    
    // Listen for user data updates (e.g., after login or settings update)
    const handleUserUpdate = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserType(user.type || null);
          // Update avatar from user object when user data is updated (e.g., after login)
          if (user.avatar && user.avatar.trim()) {
            setAvatarUrl(user.avatar);
          } else {
            // Fallback to userAvatarSvg if user object doesn't have avatar
            const savedAvatar = localStorage.getItem('userAvatarSvg');
            if (savedAvatar) {
              setAvatarUrl(savedAvatar);
            }
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      }
    };
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Update personal spaces open state based on pathname
    setPersonalSpacesOpen(
      pathname?.includes('/home/bookings') || 
      pathname === '/home' || 
      pathname === '/booking' ||
      pathname?.includes('/home/booking-grid')
    );
    // Update user settings open state based on pathname
    setUserSettingsOpen(
      pathname === '/avatar-builder' || pathname === '/home/settings' || pathname === '/home/points' || pathname === '/home/feedback'
    );
    // Update management open state based on pathname
    setManagementOpen(pathname?.includes('/home/management'));
    // Update admin open state based on pathname
    setAdminOpen(pathname?.includes('/home/admin'));
    
    // Reload user type when pathname changes (in case user just logged in)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userTypeValue = user.type || null;
        setUserType(userTypeValue);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, [pathname]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const personalSpacesSubmenu = [
    { id: 'Book a Place', label: 'Book a Place', path: '/booking', icon: <MapIcon /> },
    { id: 'Manage bookings', label: 'Manage bookings', path: '/home/bookings', icon: <ViewListIcon /> },
    { id: 'Upcoming Bookings', label: 'Upcoming Bookings', path: '/home', icon: <CalendarTodayIcon /> },
    { id: 'Booking grid', label: 'Team Bookings', path: '/home/booking-grid', icon: <ViewListIcon /> },
  ];

  const userSettingsSubmenu = [
    { id: 'General Settings', label: 'General Settings', path: '/home/settings', icon: <SettingsIcon /> },
    { id: 'Feedback', label: 'Feedback', path: '/home/feedback', icon: <FeedbackIcon /> },
    { id: 'Edit avatar', label: 'Edit avatar', path: '/avatar-builder', icon: <EditIcon /> },
  ];

  const managementSubmenu: Array<{ id: string; label: string; path: string | null; icon: React.ReactNode }> = [
    { id: 'Planning Team Day', label: 'Planning Team Day', path: '/home/management/planning', icon: <GroupsIcon /> },
    { id: 'Team Management', label: 'Team Management', path: '/home/management/teams', icon: <GroupsIcon /> },
    { id: 'Approvals', label: 'Approvals', path: '/home/management/approvals', icon: <PendingActionsIcon /> },
    { id: 'Office Statistics', label: 'Office Statistics', path: '/home/management/statistics', icon: <BarChartIcon /> },
  ];

  const adminSubmenu: Array<{ id: string; label: string; path: string | null; icon: React.ReactNode }> = [
    { id: 'Map Editor', label: 'Map Editor', path: '/home/admin/map-editor', icon: <MapIcon /> },
  ];

  const isSubItemSelected = (subItemPath: string) => {
    return pathname === subItemPath;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#FFFFFF' }}>
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: '#FFFFFF',
          color: '#1e40af',
          boxShadow: '0 1px 3px rgba(30, 64, 175, 0.08)',
          borderBottom: '1px solid rgba(30, 64, 175, 0.1)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: '#1e40af',
                letterSpacing: '-0.02em',
                fontSize: '2rem',
                marginLeft: '15px',
              }}
            >
              place.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontSize: '13px', color: '#1e40af', fontWeight: 500 }}>
                {mounted ? formatTime(currentTime) : '--:--'}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '11px', color: 'rgba(30, 64, 175, 0.6)' }}>
                {mounted ? formatDate(currentTime) : 'Loading...'}
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleAvatarClick}
              sx={{ 
                color: '#1e40af',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(191, 219, 254, 0.08)',
                  transform: 'scale(1.05)',
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: avatarUrl ? 'transparent' : '#1e40af', 
                  border: '2px solid #bfdbfe',
                  '& img': {
                    width: '100%',
                    height: '100%',
                  },
                }}
                src={avatarUrl || undefined}
              >
                {!avatarUrl && (
                  <PersonIcon fontSize="small" sx={{ color: '#FFFFFF' }} />
                )}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                  border: '1px solid #bfdbfe',
                  boxShadow: '0 4px 12px rgba(30, 64, 175, 0.15)',
                },
              }}
            >
              <MenuItem
                onClick={handleMenuClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    bgcolor: 'rgba(191, 219, 254, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#1e40af' }}>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2" sx={{ color: '#000000', fontWeight: 500 }}>
                  General Settings
                </Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  router.push('/avatar-builder');
                }}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    bgcolor: 'rgba(191, 219, 254, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#1e40af' }}>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2" sx={{ color: '#000000', fontWeight: 500 }}>
                  Edit avatar
                </Typography>
              </MenuItem>
              <Divider sx={{ my: 0.5, borderColor: '#bfdbfe' }} />
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  // Clear user data and authentication
                  localStorage.removeItem('user');
                  localStorage.removeItem('isAuthenticated');
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('token');
                  localStorage.removeItem('userAvatar');
                  localStorage.removeItem('userAvatarSvg');
                  // Redirect to login
                  router.push('/login');
                }}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    bgcolor: 'rgba(191, 219, 254, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#1e40af' }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2" sx={{ color: '#000000', fontWeight: 500 }}>
                  Logout
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#FFFFFF',
            borderRight: '1px solid rgba(30, 64, 175, 0.1)',
            mt: '64px',
            boxShadow: '2px 0 8px rgba(30, 64, 175, 0.04)',
          },
        }}
      >
        <List sx={{ pt: 3 }}>
          {/* Personal Spaces Main Item */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => setPersonalSpacesOpen(!personalSpacesOpen)}
              sx={{
                py: 1.5,
                px: 3,
                mb: 1,
                mx: 2,
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(191, 219, 254, 0.06)',
                  '& .MuiListItemIcon-root': {
                    color: '#1e40af',
                  },
                  '& .MuiTypography-root': {
                    color: '#1e40af',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: personalSpacesOpen ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                  transition: 'color 0.2s ease',
                }}
              >
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary="Bookings"
                primaryTypographyProps={{
                  fontSize: '15px',
                  fontWeight: personalSpacesOpen ? 600 : 500,
                  color: personalSpacesOpen ? '#1e40af' : '#000000',
                }}
              />
              <ExpandMoreIcon
                sx={{
                  fontSize: '20px',
                  color: personalSpacesOpen ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                  transform: personalSpacesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'all 0.2s ease',
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* Personal Spaces Submenu */}
          {personalSpacesOpen && (
            <List sx={{ pl: 1, pr: 2 }}>
              {personalSpacesSubmenu.map((subItem) => (
                <ListItem key={subItem.id} disablePadding>
                  <ListItemButton
                    selected={isSubItemSelected(subItem.path)}
                    onClick={() => {
                      router.push(subItem.path);
                    }}
                    sx={{
                      py: 1.25,
                      px: 3,
                      ml: 3,
                      mr: 2,
                      borderRadius: '8px',
                      mb: 0.5,
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        bgcolor: '#eff6ff',
                        borderLeft: '3px solid #1e40af',
                        '&:hover': {
                          bgcolor: '#eff6ff',
                          transform: 'translateX(2px)',
                        },
                        '& .MuiListItemIcon-root': {
                          color: '#1e40af',
                        },
                        '& .MuiTypography-root': {
                          color: '#1e40af',
                          fontWeight: 600,
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(191, 219, 254, 0.08)',
                        transform: 'translateX(4px)',
                        '& .MuiListItemIcon-root': {
                          color: '#1e40af',
                        },
                        '& .MuiTypography-root': {
                          color: '#1e40af',
                          fontWeight: 500,
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isSubItemSelected(subItem.path) ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {subItem.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={subItem.label}
                      primaryTypographyProps={{
                        fontSize: '14px',
                        fontWeight: isSubItemSelected(subItem.path) ? 600 : 400,
                        color: isSubItemSelected(subItem.path) ? '#1e40af' : '#000000',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}

          {/* Manage Points - Direct Button */}
          <ListItem disablePadding>
            <ListItemButton
              selected={pathname === '/home/points'}
              onClick={() => router.push('/home/points')}
              sx={{
                py: 1.5,
                px: 3,
                mb: 1,
                mx: 2,
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: '#eff6ff',
                  borderLeft: '3px solid #1e40af',
                  '&:hover': {
                    bgcolor: '#eff6ff',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#1e40af',
                  },
                  '& .MuiTypography-root': {
                    color: '#1e40af',
                    fontWeight: 600,
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(191, 219, 254, 0.06)',
                  '& .MuiListItemIcon-root': {
                    color: '#1e40af',
                  },
                  '& .MuiTypography-root': {
                    color: '#1e40af',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: pathname === '/home/points' ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                  transition: 'color 0.2s ease',
                }}
              >
                <EmojiEventsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Manage Points"
                primaryTypographyProps={{
                  fontSize: '15px',
                  fontWeight: pathname === '/home/points' ? 600 : 500,
                  color: pathname === '/home/points' ? '#1e40af' : '#000000',
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* User Settings Main Item */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => setUserSettingsOpen(!userSettingsOpen)}
              sx={{
                py: 1.5,
                px: 3,
                mb: 1,
                mx: 2,
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(191, 219, 254, 0.06)',
                  '& .MuiListItemIcon-root': {
                    color: '#1e40af',
                  },
                  '& .MuiTypography-root': {
                    color: '#1e40af',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: userSettingsOpen ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                  transition: 'color 0.2s ease',
                }}
              >
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText
                primary="User Settings"
                primaryTypographyProps={{
                  fontSize: '15px',
                  fontWeight: userSettingsOpen ? 600 : 500,
                  color: userSettingsOpen ? '#1e40af' : '#000000',
                }}
              />
              <ExpandMoreIcon
                sx={{
                  fontSize: '20px',
                  color: userSettingsOpen ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                  transform: userSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'all 0.2s ease',
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* User Settings Submenu */}
          {userSettingsOpen && (
            <List sx={{ pl: 1, pr: 2 }}>
              {userSettingsSubmenu.map((subItem) => (
                <ListItem key={subItem.id} disablePadding>
                  <ListItemButton
                    selected={subItem.path ? isSubItemSelected(subItem.path) : false}
                    onClick={() => {
                      if (subItem.path) {
                        router.push(subItem.path);
                      }
                    }}
                    sx={{
                      py: 1.25,
                      px: 3,
                      ml: 3,
                      mr: 2,
                      borderRadius: '8px',
                      mb: 0.5,
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        bgcolor: '#eff6ff',
                        borderLeft: '3px solid #1e40af',
                        '&:hover': {
                          bgcolor: '#eff6ff',
                          transform: 'translateX(2px)',
                        },
                        '& .MuiListItemIcon-root': {
                          color: '#1e40af',
                        },
                        '& .MuiTypography-root': {
                          color: '#1e40af',
                          fontWeight: 600,
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(191, 219, 254, 0.08)',
                        transform: 'translateX(4px)',
                        '& .MuiListItemIcon-root': {
                          color: '#1e40af',
                        },
                        '& .MuiTypography-root': {
                          color: '#1e40af',
                          fontWeight: 500,
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: subItem.path && isSubItemSelected(subItem.path) ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {subItem.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={subItem.label}
                      primaryTypographyProps={{
                        fontSize: '14px',
                        fontWeight: subItem.path && isSubItemSelected(subItem.path) ? 600 : 400,
                        color: subItem.path && isSubItemSelected(subItem.path) ? '#1e40af' : '#000000',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}

          {/* Management Main Item - Only show for MANAGER (not ADMIN) */}
          {userType === 'MANAGER' && (
            <>
              <ListItem disablePadding>
                <ListItemButton
              onClick={() => setManagementOpen(!managementOpen)}
              sx={{
                py: 1.5,
                px: 3,
                mb: 1,
                mx: 2,
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(191, 219, 254, 0.06)',
                  '& .MuiListItemIcon-root': {
                    color: '#1e40af',
                  },
                  '& .MuiTypography-root': {
                    color: '#1e40af',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: managementOpen ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                  transition: 'color 0.2s ease',
                }}
              >
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText
                primary="Management"
                primaryTypographyProps={{
                  fontSize: '15px',
                  fontWeight: managementOpen ? 600 : 500,
                  color: managementOpen ? '#1e40af' : '#000000',
                }}
              />
              <ExpandMoreIcon
                sx={{
                  fontSize: '20px',
                  color: managementOpen ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                  transform: managementOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'all 0.2s ease',
                }}
              />
                </ListItemButton>
              </ListItem>

              {/* Management Submenu */}
              {managementOpen && (
            <List sx={{ pl: 1, pr: 2 }}>
              {managementSubmenu.length > 0 ? (
                managementSubmenu.map((subItem) => (
                  <ListItem key={subItem.id} disablePadding>
                    <ListItemButton
                      selected={subItem.path ? isSubItemSelected(subItem.path) : false}
                      onClick={() => {
                        if (subItem.path) {
                          router.push(subItem.path);
                        }
                      }}
                      sx={{
                        py: 1.25,
                        px: 3,
                        ml: 3,
                        mr: 2,
                        borderRadius: '8px',
                        mb: 0.5,
                        transition: 'all 0.2s ease',
                        '&.Mui-selected': {
                          bgcolor: '#eff6ff',
                          borderLeft: '3px solid #1e40af',
                          '&:hover': {
                            bgcolor: '#eff6ff',
                            transform: 'translateX(2px)',
                          },
                          '& .MuiListItemIcon-root': {
                            color: '#1e40af',
                          },
                          '& .MuiTypography-root': {
                            color: '#1e40af',
                            fontWeight: 600,
                          },
                        },
                        '&:hover': {
                          bgcolor: 'rgba(191, 219, 254, 0.08)',
                          transform: 'translateX(4px)',
                          '& .MuiListItemIcon-root': {
                            color: '#1e40af',
                          },
                          '& .MuiTypography-root': {
                            color: '#1e40af',
                            fontWeight: 500,
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: subItem.path && isSubItemSelected(subItem.path) ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={subItem.label}
                        primaryTypographyProps={{
                          fontSize: '14px',
                          fontWeight: subItem.path && isSubItemSelected(subItem.path) ? 600 : 400,
                          color: subItem.path && isSubItemSelected(subItem.path) ? '#1e40af' : '#000000',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              ) : (
                <ListItem disablePadding>
                  <Box sx={{ px: 3, py: 1.5, ml: 3, mr: 2 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.5)', fontStyle: 'italic' }}>
                      No items yet
                    </Typography>
                  </Box>
                </ListItem>
              )}
              </List>
              )}
            </>
          )}

          {/* Admin Main Item - Only show for ADMIN */}
          {userType === 'ADMIN' && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setAdminOpen(!adminOpen)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    mb: 1,
                    mx: 2,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(191, 219, 254, 0.06)',
                      '& .MuiListItemIcon-root': {
                        color: '#1e40af',
                      },
                      '& .MuiTypography-root': {
                        color: '#1e40af',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: adminOpen ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <AdminPanelSettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Admin"
                    primaryTypographyProps={{
                      fontSize: '15px',
                      fontWeight: adminOpen ? 600 : 500,
                      color: adminOpen ? '#1e40af' : '#000000',
                    }}
                  />
                  <ExpandMoreIcon
                    sx={{
                      fontSize: '20px',
                      color: adminOpen ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                      transform: adminOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Admin Submenu */}
              {adminOpen && (
                <List sx={{ pl: 1, pr: 2 }}>
                  {adminSubmenu.map((subItem) => (
                    <ListItem key={subItem.id} disablePadding>
                      <ListItemButton
                        selected={subItem.path ? isSubItemSelected(subItem.path) : false}
                        onClick={() => {
                          if (subItem.path) {
                            router.push(subItem.path);
                          }
                        }}
                        sx={{
                          py: 1.25,
                          px: 3,
                          ml: 3,
                          mr: 2,
                          borderRadius: '8px',
                          mb: 0.5,
                          transition: 'all 0.2s ease',
                          '&.Mui-selected': {
                            bgcolor: '#eff6ff',
                            borderLeft: '3px solid #1e40af',
                            '&:hover': {
                              bgcolor: '#eff6ff',
                              transform: 'translateX(2px)',
                            },
                            '& .MuiListItemIcon-root': {
                              color: '#1e40af',
                            },
                            '& .MuiTypography-root': {
                              color: '#1e40af',
                              fontWeight: 600,
                            },
                          },
                          '&:hover': {
                            bgcolor: 'rgba(191, 219, 254, 0.08)',
                            transform: 'translateX(4px)',
                            '& .MuiListItemIcon-root': {
                              color: '#1e40af',
                            },
                            '& .MuiTypography-root': {
                              color: '#1e40af',
                              fontWeight: 500,
                            },
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: subItem.path && isSubItemSelected(subItem.path) ? '#1e40af' : 'rgba(0, 0, 0, 0.6)',
                            transition: 'color 0.2s ease',
                          }}
                        >
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={subItem.label}
                          primaryTypographyProps={{
                            fontSize: '14px',
                            fontWeight: subItem.path && isSubItemSelected(subItem.path) ? 600 : 400,
                            color: subItem.path && isSubItemSelected(subItem.path) ? '#1e40af' : '#000000',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px',
          bgcolor: '#FFFFFF',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

