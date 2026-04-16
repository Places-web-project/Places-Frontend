'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Link,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { apiService } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.login(username, password);
      
      if (response.success && response.user) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('isAuthenticated', 'true');
        
        // Also store avatar in userAvatarSvg for backward compatibility
        if (
          response.user.avatar &&
          response.user.avatar.trim() &&
          response.user.avatar.startsWith('data:image/svg+xml')
        ) {
          localStorage.setItem('userAvatarSvg', response.user.avatar);
        }
        
        // Dispatch event to notify other components (like navbar) that user data was updated
        window.dispatchEvent(new Event('userUpdated'));
        
        // Redirect to home
        router.push('/home');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#FFFFFF',
        backgroundImage: 'linear-gradient(135deg, rgba(239, 246, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)',
        px: 2,
      }}
    >
      <Card
        elevation={0}
        sx={{
          maxWidth: 450,
          width: '100%',
          bgcolor: '#FFFFFF',
          border: '1px solid #bfdbfe',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(30, 64, 175, 0.08)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo/Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1e40af',
                letterSpacing: '-0.01em',
                fontSize: '2rem',
                mb: 1,
              }}
            >
              place.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(0, 0, 0, 0.6)',
                fontSize: '14px',
              }}
            >
              Sign in to your account
            </Typography>
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 1,
                  bgcolor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  '& .MuiAlert-icon': {
                    color: '#dc2626',
                  },
                }}
              >
                {error}
              </Alert>
            )}
            
            {/* Username Field */}
            <TextField
              fullWidth
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'rgba(0, 0, 0, 0.4)', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
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
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-focused': {
                    color: '#1e40af',
                  },
                },
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(0, 0, 0, 0.4)', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{
                        color: 'rgba(0, 0, 0, 0.4)',
                        '&:hover': {
                          color: '#1e40af',
                        },
                      }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
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
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-focused': {
                    color: '#1e40af',
                  },
                },
              }}
            />

            {/* Forgot Password Link */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Link
                href="#"
                sx={{
                  fontSize: '13px',
                  color: '#1e40af',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Forgot password?
              </Link>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                bgcolor: '#1e40af',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '15px',
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(30, 64, 175, 0.2)',
                '&:hover': {
                  bgcolor: '#1e3a8a',
                  boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
                },
                '&:disabled': {
                  bgcolor: 'rgba(30, 64, 175, 0.5)',
                },
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Box>

          {/* Sign Up Link */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(0, 0, 0, 0.6)',
                fontSize: '13px',
              }}
            >
              Don't have an account?{' '}
              <Link
                href="/register"
                sx={{
                  color: '#1e40af',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

