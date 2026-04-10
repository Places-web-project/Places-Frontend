'use client';

import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import NotificationsIcon from '@mui/icons-material/Notifications';

interface UserChat {
  id: number;
  roomId: number;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  messageCount: number;
  lastChecked?: string;
}

interface ChatNotificationsProps {
  userId: number;
  onChatClick?: (chat: UserChat) => void;
}

export default function ChatNotifications({ userId, onChatClick }: ChatNotificationsProps) {
  const [userChats, setUserChats] = useState<UserChat[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [lastCheckedTimes, setLastCheckedTimes] = useState<Record<number, string>>({});
  const open = Boolean(anchorEl);

  useEffect(() => {
    loadUserChats();
    // Load last checked times from localStorage
    const stored = localStorage.getItem(`chat_last_checked_${userId}`);
    if (stored) {
      try {
        setLastCheckedTimes(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse last checked times:', e);
      }
    }

    // Poll for new chats every 30 seconds
    const interval = setInterval(loadUserChats, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadUserChats = async () => {
    try {
      const response = await fetch(`http://localhost:8000/chats/users/${userId}/chats`);
      if (!response.ok) return;

      const data = await response.json();
      setUserChats(data.chats || []);
    } catch (error) {
      console.error('Error loading user chats:', error);
    }
  };

  const getUnreadCount = () => {
    return userChats.reduce((count, chat) => {
      const lastChecked = lastCheckedTimes[chat.id];
      if (!lastChecked) {
        return count + (chat.messageCount > 0 ? 1 : 0);
      }
      // Simple check: if there are messages and we haven't checked recently
      const lastCheckedTime = new Date(lastChecked).getTime();
      const chatCreatedTime = new Date(chat.createdAt).getTime();
      if (chat.messageCount > 0 && chatCreatedTime > lastCheckedTime) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChatClick = (chat: UserChat) => {
    // Mark as checked
    const newLastCheckedTimes = {
      ...lastCheckedTimes,
      [chat.id]: new Date().toISOString(),
    };
    setLastCheckedTimes(newLastCheckedTimes);
    localStorage.setItem(`chat_last_checked_${userId}`, JSON.stringify(newLastCheckedTimes));

    handleClose();
    if (onChatClick) {
      onChatClick(chat);
    }
  };

  const unreadCount = getUnreadCount();

  if (userChats.length === 0) {
    return null; // Don't show if user has no chats
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="large"
        aria-label={`${unreadCount} unread messages`}
        color="inherit"
      >
        <Badge badgeContent={unreadCount} color="error">
          <ChatIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 400,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">
            Your Recreational Chats
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {userChats.length} active chat{userChats.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {userChats.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <ChatIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" variant="body2">
              No active chats yet
            </Typography>
            <Typography color="text.secondary" variant="caption">
              Book a recreational space to start chatting!
            </Typography>
          </Box>
        ) : (
          userChats.map((chat, index) => {
            const isNew = !lastCheckedTimes[chat.id] && chat.messageCount > 0;
            const isPastEvent = new Date(`${chat.date}T${chat.endTime}`) < new Date();

            return (
              <Box key={chat.id}>
                {index > 0 && <Divider />}
                <MenuItem
                  onClick={() => handleChatClick(chat)}
                  sx={{
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={isNew ? 'bold' : 'normal'}>
                          {chat.roomName}
                        </Typography>
                        {isNew && (
                          <Chip
                            label="NEW"
                            size="small"
                            color="error"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                        {isPastEvent && (
                          <Chip
                            label="Past"
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" display="block" color="text.secondary">
                          📅 {chat.date} • {chat.startTime} - {chat.endTime}
                        </Typography>
                        <Typography variant="caption" color="primary">
                          💬 {chat.messageCount} message{chat.messageCount !== 1 ? 's' : ''}
                        </Typography>
                      </>
                    }
                  />
                </MenuItem>
              </Box>
            );
          })
        )}
      </Menu>
    </>
  );
}

