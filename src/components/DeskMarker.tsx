'use client';

import { Desk } from '@/types/desk';
import { useState, useMemo, useEffect } from 'react';
import { Box, Paper, Typography, Chip, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { generateTimeSlots, isWeekday } from '@/utils/timeUtils';
import PersonIcon from '@mui/icons-material/Person';

interface DeskMarkerProps {
  desk: Desk;
  onClick: (desk: Desk) => void;
  isAdminMode?: boolean;
  mapScale?: number;
}

const MarkerCircle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'status' && prop !== 'isHovered' && prop !== 'spaceType' && prop !== 'managementOnly',
})<{ status: string; isHovered: boolean; spaceType: string; managementOnly?: boolean }>(({ theme, status, isHovered, spaceType, managementOnly }) => {
  const getStatusColor = () => {
    // If selected, show special purple/blue color
    if (status === 'selected') {
      return '#9333ea'; // Purple for selected desks
    }

    // If booked, always show red
    if (status === 'booked') {
      return theme.palette.error.main; // Red for booked
    }
    
    // Check space type first when available
    if (status === 'available') {
      // Management-only spaces show in purple/violet when available
      if (managementOnly) {
        return '#7c3aed'; // Purple/violet for management-only
      }
      if (spaceType === 'meeting-room') {
        return theme.palette.primary.main; // Blue #2563eb
      }
      if (spaceType === 'recreational') {
        return theme.palette.info.light; // Light blue
      }
      if (spaceType === 'desk' || !spaceType) {
        return theme.palette.success.main; // Green
      }
    }
    
    // Other statuses
    switch (status) {
      case 'colleague':
        return theme.palette.grey[400];
      case 'team-member':
        return theme.palette.warning.main;
      case 'closed':
        return theme.palette.grey[600];
      case 'awaiting-cleaning':
        return theme.palette.secondary.main;
      case 'hidden':
        return theme.palette.grey[300];
      case 'fixed-space':
        return theme.palette.error.main;
      default:
        // Default fallback - should not reach here for available spaces
        return theme.palette.grey[500];
    }
  };

  return {
    width: 12,
    height: 12,
    minWidth: 12,
    minHeight: 12,
    maxWidth: 12,
    maxHeight: 12,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: getStatusColor(),
    color: '#fff',
    fontWeight: 600,
    fontSize: '6px',
    lineHeight: 1,
    padding: 0,
    margin: 0,
    boxShadow: isHovered 
      ? `0 0 0 2px ${theme.palette.common.white}, 0 2px 8px rgba(0, 0, 0, 0.3)`
      : theme.shadows[2],
    border: isHovered 
      ? `2px solid ${theme.palette.common.white}`
      : `1.5px solid rgba(255, 255, 255, 0.5)`,
    transition: 'box-shadow 0.15s ease, border 0.15s ease',
    cursor: 'pointer',
    textAlign: 'center',
    position: 'relative',
    '& > *': {
      lineHeight: 1,
      margin: 0,
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    },
  };
});

const PopupCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'mapScale',
})<{ mapScale?: number }>(({ theme, mapScale = 1 }) => ({
  position: 'absolute',
  left: '50%',
  transform: `translateX(-50%) translateY(calc(-2% - 0px)) scale(${1 / mapScale})`,
  transformOrigin: 'center bottom',
  bottom: '100%',
  width: 140,
  zIndex: 1001,
  '&::after': {
    content: '""',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: -3,
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: `6px solid ${theme.palette.background.paper}`,
  },
}));

export default function DeskMarker({ desk, onClick, isAdminMode = false, mapScale = 1 }: DeskMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const spaceType = desk.type || 'desk';
  const isMeetingRoom = spaceType === 'meeting-room';
  const isRecreational = spaceType === 'recreational';
  const isBooked = desk.status === 'booked';
  const isEventSpace = isMeetingRoom || isRecreational;
  
  // Reset hover state when desk changes (e.g., after booking)
  useEffect(() => {
    setIsHovered(false);
  }, [desk.id, desk.status, desk.bookedBy, desk.bookedDate, desk.bookedStartTime, desk.bookedEndTime, desk.bookings?.length]);
  
  // Get available time slots for meeting rooms and recreational spaces
  const availableSlots = useMemo(() => {
    if (!isEventSpace || desk.status !== 'available') return [];
    
    const today = new Date();
    if (!isWeekday(today)) return [];
    
    const existingBookings = desk.bookings?.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate.toDateString() === today.toDateString();
    }) || [];
    
    if (desk.bookedDate && desk.bookedStartTime && desk.bookedEndTime) {
      const bookedDate = new Date(desk.bookedDate);
      if (bookedDate.toDateString() === today.toDateString()) {
        existingBookings.push({
          deskId: desk.id,
          userName: desk.bookedBy || '',
          date: desk.bookedDate,
          startTime: desk.bookedStartTime,
          endTime: desk.bookedEndTime,
        });
      }
    }
    
    const slots = generateTimeSlots(today, existingBookings.map(b => ({
      startTime: b.startTime,
      endTime: b.endTime,
    })));
    
    return slots.filter(s => s.isAvailable).slice(0, 3); // Show first 3 available slots
  }, [desk]);

  const getStatusIcon = () => {
    if (!desk.status) return 'dot';
    switch (desk.status) {
      case 'available':
        return 'dot';
      case 'selected':
        return '✓';
      case 'booked':
        return 'dot';
      case 'colleague':
        return '😊';
      case 'team-member':
        return '👥';
      case 'closed':
        return '⊘';
      case 'awaiting-cleaning':
        return '🧹';
      case 'fixed-space':
        return '📌';
      default:
        return 'dot';
    }
  };

  const getMoodEmoji = (mood: string): string => {
    switch (mood) {
      case 'happy':
        return '😊';
      case 'sad':
        return '😢';
      case 'stressed':
        return '😰';
      case 'tired':
        return '😴';
      case 'focused':
        return '🎯';
      default:
        return '😊';
    }
  };

  const getMoodLabel = (mood: string): string => {
    switch (mood) {
      case 'happy':
        return 'Happy';
      case 'sad':
        return 'Sad';
      case 'stressed':
        return 'Stressed';
      case 'tired':
        return 'Tired';
      case 'focused':
        return 'Focused';
      default:
        return 'Happy';
    }
  };

  return (
    <Box
      data-desk-marker
      sx={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: isHovered ? 1000 : (isMeetingRoom ? 5 : 10),
        left: `${desk.position.x}%`,
        top: `${desk.position.y}%`,
        width: '12px',
        height: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(desk);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <MarkerCircle status={desk.status || 'available'} isHovered={isHovered} spaceType={spaceType} managementOnly={desk.managementOnly}>
        {getStatusIcon() === 'dot' ? (
          <Box
            sx={{
              width: '3px',
              height: '3px',
              minWidth: '3px',
              minHeight: '3px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              margin: 0,
              padding: 0,
            }}
          />
        ) : (
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              margin: 0,
              padding: 0,
              width: '100%',
              height: '100%',
              textAlign: 'center',
              verticalAlign: 'middle',
              fontSize: '8px',
              fontWeight: 700,
            }}
          >
            {getStatusIcon()}
          </Box>
        )}
      </MarkerCircle>

      {isHovered && (
        <PopupCard elevation={3} mapScale={mapScale} data-desk-popup>
          <Box sx={{ p: 1, position: 'relative' }}>
            {/* Avatar SVG from database in upper right corner - same as navbar */}
            {desk.bookedBy && (
              <Avatar
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 40,
                  height: 40,
                  bgcolor: desk.bookedByAvatar ? 'transparent' : '#1e40af',
                  border: '2px solid #bfdbfe',
                  '& img': {
                    width: '100%',
                    height: '100%',
                  },
                }}
              >
                {desk.bookedByAvatar ? (
                  <Box
                    dangerouslySetInnerHTML={{ __html: desk.bookedByAvatar }}
                    sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                ) : (
                  <PersonIcon sx={{ fontSize: 20, color: '#FFFFFF' }} />
                )}
              </Avatar>
            )}
            <Typography variant="caption" fontWeight="bold" gutterBottom sx={{ fontSize: '0.7rem', pr: desk.bookedBy ? 5 : 0 }}>
              {desk.name}
            </Typography>
            {desk.managementOnly && (
              <Chip
                label="Management Only"
                size="small"
                sx={{
                  bgcolor: '#7c3aed',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.6rem',
                  height: 18,
                  mb: 0.5,
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                Floor: {desk.floor}
              </Typography>
              {desk.status && (
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', fontSize: '0.6rem' }}>
                  Status: {desk.status.replace('-', ' ')}
                </Typography>
              )}
              {isEventSpace && desk.capacity && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  Capacity: {desk.capacity} people
                </Typography>
              )}
              {desk.bookedBy && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', mt: 0.25 }}>
                    Booked by: {desk.bookedBy}
                  </Typography>
                  {desk.bookedByMood && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Mood: {getMoodEmoji(desk.bookedByMood)} {getMoodLabel(desk.bookedByMood)}
                    </Typography>
                  )}
                </>
              )}
              {desk.attributes && desk.attributes.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mt: 0.5 }}>
                  {desk.attributes.map((attr, idx) => (
                    <Chip
                      key={idx}
                      label={attr}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 16, fontSize: '0.55rem', '& .MuiChip-label': { px: 0.75 } }}
                    />
                  ))}
                </Box>
              )}
              {isEventSpace && availableSlots.length > 0 && (
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', fontWeight: 'bold' }}>
                    Available today:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mt: 0.25 }}>
                    {availableSlots.map((slot, idx) => (
                      <Chip
                        key={idx}
                        label={`${slot.start}-${slot.end}`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 14, fontSize: '0.5rem', '& .MuiChip-label': { px: 0.5 } }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </PopupCard>
      )}
    </Box>
  );
}
