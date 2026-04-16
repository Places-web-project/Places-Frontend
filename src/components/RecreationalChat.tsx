'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import { API_BASE_URL, API_WS_URL } from '@/services/api';

interface Message {
  id: number;
  chatId: number;
  userId: number;
  content: string;
  timestamp: string;
  user?: {
    id: number;
    name: string;
    avatar: string;
    mood: string;
  };
}

interface Chat {
  id: number;
  roomId: number;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface RecreationalChatProps {
  roomId: number;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  currentUserId: number;
  open: boolean;
  onClose: () => void;
}

export default function RecreationalChat({
  roomId,
  roomName,
  date,
  startTime,
  endTime,
  currentUserId,
  open,
  onClose,
}: RecreationalChatProps) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open) {
      initializeChat();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [open, roomId, date, startTime, endTime]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Create or get chat
      const response = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          date,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) throw new Error('Failed to create/get chat');

      const data = await response.json();
      console.log('💬 Chat initialized:', data.chat);
      console.log('📧 Initial messages loaded:', data.messages?.length || 0);
      data.messages?.forEach((msg: any, idx: number) => {
        console.log(`  Message ${idx + 1}:`, {
          id: msg.id,
          user: msg.user?.name,
          hasAvatar: !!(msg.user?.avatar && msg.user.avatar.trim()),
          avatarLength: msg.user?.avatar?.length || 0,
        });
      });
      
      setChat(data.chat);
      setMessages(data.messages || []);

      // Setup WebSocket connection
      if (data.chat?.id) {
        setupWebSocket(data.chat.id);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = (chatId: number) => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Create new WebSocket connection
    const ws = new WebSocket(`${API_WS_URL}/chats/ws/${chatId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', message);
        console.log('  - User data:', message.user);
        console.log('  - Avatar:', message.user?.avatar ? 'Present' : 'Missing');
        
        // Add new message to the list if it's a valid message object
        if (message.id && message.content) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === message.id)) {
              return prev;
            }
            console.log('✅ Adding message to state with user:', message.user?.name);
            return [...prev, message];
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chat || sending) return;

    try {
      setSending(true);
      const response = await fetch(`${API_BASE_URL}/chats/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chat.id,
          userId: currentUserId,
          content: newMessage.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      // Message will be added via WebSocket, but add it optimistically
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) {
          return prev;
        }
        return [...prev, data.message];
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: '600px',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatIcon color="primary" />
          <Box>
            <Typography variant="h6">{roomName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {date} • {startTime} - {endTime}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          height: 'calc(100% - 80px)',
        }}
      >
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                gap: 1,
              }}
            >
              <ChatIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography color="text.secondary">
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.userId === currentUserId;
              console.log(`Rendering message ${message.id}:`, {
                userId: message.userId,
                isCurrentUser,
                hasUser: !!message.user,
                userName: message.user?.name,
                hasAvatar: !!(message.user?.avatar && message.user.avatar.trim()),
              });
              
              return (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                    gap: 1,
                    alignItems: 'flex-start',
                  }}
                >
                  {message.user && (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem',
                        bgcolor: message.user.avatar && message.user.avatar.trim() ? 'transparent' : '#90caf9',
                        border: '1px solid #e0e0e0',
                        color: '#fff',
                      }}
                      src={
                        message.user.avatar &&
                        message.user.avatar.trim() &&
                        !message.user.avatar.trim().startsWith('<svg')
                          ? message.user.avatar
                          : undefined
                      }
                    >
                      {message.user.avatar && message.user.avatar.trim().startsWith('<svg') ? (
                        <Box
                          dangerouslySetInnerHTML={{
                            __html: message.user.avatar,
                          }}
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '& svg': {
                              width: '100%',
                              height: '100%',
                            },
                          }}
                        />
                      ) : !message.user.avatar || !message.user.avatar.trim() ? (
                        // Fallback to initials if no avatar
                        message.user.name.charAt(0).toUpperCase()
                      ) : null}
                    </Avatar>
                  )}
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      maxWidth: '70%',
                      backgroundColor: isCurrentUser
                        ? 'primary.main'
                        : 'background.paper',
                      color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    {!isCurrentUser && message.user && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {message.user.name}
                      </Typography>
                    )}
                    <Typography variant="body2">{message.content}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.7,
                        fontSize: '0.65rem',
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Paper>
                </Box>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending || loading}
              multiline
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || loading}
            >
              {sending ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

