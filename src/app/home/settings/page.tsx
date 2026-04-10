'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import MoodIcon from '@mui/icons-material/Mood';
import { apiService } from '@/services/api';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mood, setMood] = useState<string>('happy');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Load current user data
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setName(user.name || '');
          setUserId(user.id || null);
          setMood(user.mood || 'happy');
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      }
    }
  }, []);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password && password.length < 3) {
      setError('Password must be at least 3 characters long');
      return;
    }

    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }

    setSaving(true);

    try {
      // Update user settings
      const updateData: { name?: string; password?: string; mood?: string } = {};
      if (name.trim()) {
        updateData.name = name.trim();
      }
      if (password) {
        updateData.password = password;
      }
      if (mood) {
        updateData.mood = mood;
      }

      const response = await apiService.updateUserSettings(userId, updateData);

      // Update localStorage with new name and preserve type
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          user.name = name.trim();
          // Preserve type and mood from response if available
          if (response.user && response.user.type) {
            user.type = response.user.type;
          }
          if (response.user && response.user.mood) {
            user.mood = response.user.mood;
          }
          localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          console.error('Failed to update localStorage:', error);
        }
      }

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 600, color: '#1e40af' }}>
        General Settings
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: 'rgba(0, 0, 0, 0.6)' }}>
        Manage your account settings and preferences
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: '1px solid #bfdbfe',
          borderRadius: 2,
          bgcolor: '#ffffff',
        }}
      >
        <Stack spacing={4}>
          {/* Name Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: '#1e40af', fontWeight: 600 }}>
              Profile Information
            </Typography>
            <TextField
              fullWidth
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: '#1e40af' }}>
                    <PersonIcon fontSize="small" />
                  </Box>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#bfdbfe',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1e40af',
                  },
                },
              }}
            />
          </Box>

          <Divider sx={{ borderColor: '#bfdbfe' }} />

          {/* Mood Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MoodIcon sx={{ color: '#1e40af', mr: 1 }} />
              <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 600 }}>
                Current Mood
              </Typography>
            </Box>
            <FormControl fullWidth>
              <InputLabel id="mood-select-label">Mood</InputLabel>
              <Select
                labelId="mood-select-label"
                id="mood-select"
                value={mood}
                label="Mood"
                onChange={(e) => setMood(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#bfdbfe',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1e40af',
                    },
                  },
                }}
              >
                <MenuItem value="happy">😊 Happy</MenuItem>
                <MenuItem value="sad">😢 Sad</MenuItem>
                <MenuItem value="stressed">😰 Stressed</MenuItem>
                <MenuItem value="tired">😴 Tired</MenuItem>
                <MenuItem value="focused">🎯 Focused</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.6)', mt: 1, display: 'block' }}>
              Your mood will be visible to colleagues when they hover over your booked desk
            </Typography>
          </Box>

          <Divider sx={{ borderColor: '#bfdbfe' }} />

          {/* Password Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: '#1e40af', fontWeight: 600 }}>
              Change Password
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: '#1e40af' }}>
                      <LockIcon fontSize="small" />
                    </Box>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#bfdbfe',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1e40af',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: '#1e40af' }}>
                      <LockIcon fontSize="small" />
                    </Box>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#bfdbfe',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1e40af',
                    },
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.6)', mt: -1 }}>
                Leave blank if you don't want to change your password
              </Typography>
            </Stack>
          </Box>

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" onClose={() => setSuccess(false)}>
              Settings updated successfully!
            </Alert>
          )}

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || loading}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{
                bgcolor: '#1e40af',
                color: '#ffffff',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#1e3a8a',
                },
                '&:disabled': {
                  bgcolor: 'rgba(30, 64, 175, 0.5)',
                },
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

