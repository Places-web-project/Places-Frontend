'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
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
import { apiService, BookingChatMessageApiModel } from '@/services/api';

interface ChatUser {
  id: number;
  name: string;
  avatar: string;
  mood: string;
}

interface Message {
  id: number;
  bookingId: number;
  userId: number;
  content: string;
  timestamp: string;
  user?: ChatUser;
}

interface Chat {
  id: number;
  bookingId: number;
}

interface RecreationalChatProps {
  bookingId?: number;
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
  bookingId,
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
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsConnectTimeoutRef = useRef<number | null>(null);
  const usersByIdRef = useRef<Map<number, ChatUser>>(new Map());
  const wsExpectedCloseRef = useRef(false);
  const wsConnectedRef = useRef(false);

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
      if (wsConnectTimeoutRef.current !== null) {
        window.clearTimeout(wsConnectTimeoutRef.current);
        wsConnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsExpectedCloseRef.current = true;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [open, bookingId, roomId, date, startTime, endTime]);

  const mapUsers = async () => {
    try {
      const response = await apiService.getUsers();
      usersByIdRef.current = new Map(
        response.users.map((user) => [
          user.id,
          {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            mood: user.mood || 'happy',
          },
        ])
      );
    } catch {
      usersByIdRef.current = new Map();
    }
  };

  const normalizeTimestamp = (value: string | number[]) => {
    if (Array.isArray(value)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = value;
      return new Date(year, month - 1, day, hour, minute, second).toISOString();
    }
    return value;
  };

  const toMessage = (message: BookingChatMessageApiModel): Message => ({
    id: message.id,
    bookingId: message.bookingId,
    userId: message.senderUserId,
    content: message.content,
    timestamp: normalizeTimestamp(message.createdAt),
    user: usersByIdRef.current.get(message.senderUserId),
  });

  const initializeChat = async () => {
    try {
      setLoading(true);
      setChatError(null);

      if (!bookingId) {
        setChat(null);
        setMessages([]);
        setChatError('Chat is available only for an existing booking for this room and time slot.');
        return;
      }

      await mapUsers();
      const bookingMessages = await apiService.getBookingMessages(bookingId);

      setChat({ id: bookingId, bookingId });
      setMessages(bookingMessages.map(toMessage));
      setupWebSocket(bookingId);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setChat(null);
      setMessages([]);
      setChatError(error instanceof Error ? error.message : 'Failed to load chat messages.');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = (resolvedBookingId: number) => {
    if (wsConnectTimeoutRef.current !== null) {
      window.clearTimeout(wsConnectTimeoutRef.current);
      wsConnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsExpectedCloseRef.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsUrl = apiService.getChatWebSocketUrl(resolvedBookingId);
    if (!wsUrl) {
      return;
    }

    wsExpectedCloseRef.current = false;
    wsConnectedRef.current = false;
    wsConnectTimeoutRef.current = window.setTimeout(() => {
      wsConnectTimeoutRef.current = null;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        wsConnectedRef.current = true;
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as BookingChatMessageApiModel;
          if (message.id && message.content) {
            const hydrated = toMessage(message);
            setMessages((prev) => {
              if (prev.some((m) => m.id === hydrated.id)) {
                return prev;
              }
              return [...prev, hydrated];
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        if (!wsExpectedCloseRef.current) {
          console.error('WebSocket error:', error);
        }
      };

      ws.onclose = () => {
        if (!wsExpectedCloseRef.current && wsConnectedRef.current) {
          console.log('WebSocket disconnected');
        }
        wsConnectedRef.current = false;
      };

      wsRef.current = ws;
    }, 150);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chat || sending) return;

    try {
      setSending(true);
      const message = await apiService.sendBookingMessage(chat.bookingId, newMessage.trim());
      const hydrated = toMessage(message);

      setMessages((prev) => {
        if (prev.some((m) => m.id === hydrated.id)) {
          return prev;
        }
        return [...prev, hydrated];
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
          ) : chatError ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Alert severity="info" sx={{ maxWidth: 420 }}>
                {chatError}
              </Alert>
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
              disabled={sending || loading || !chat}
              multiline
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || loading || !chat}
            >
              {sending ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
