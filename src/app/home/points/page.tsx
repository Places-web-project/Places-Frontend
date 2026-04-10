'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PoolIcon from '@mui/icons-material/Pool';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SchoolIcon from '@mui/icons-material/School';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StarIcon from '@mui/icons-material/Star';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import SportsPoolIcon from '@mui/icons-material/SportsEsports';
import SpaIcon from '@mui/icons-material/Spa';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

interface RewardItem {
  id: number;
  name: string;
  description: string;
  points: number;
  category: 'goodies' | 'training' | 'wellness' | 'food';
  icon: React.ReactNode;
  available: number;
  image?: string;
}

export default function ManagePointsPage() {
  const [userPoints, setUserPoints] = useState(300);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  // Mock data - în realitate ar veni de la backend
  const userHistoricalRank = 2; // Poziția user-ului în topul prezențelor (1-3 = top 3)
  const totalUsers = 45; // Total users pentru context

  const rewards: RewardItem[] = [
    {
      id: 1,
      name: 'Premium Goodies Bag',
      description: 'Company branded hoodie, water bottle, and notebook set',
      points: 500,
      category: 'goodies',
      icon: <CardGiftcardIcon />,
      available: 15,
    },
    {
      id: 2,
      name: 'Starter Goodies Pack',
      description: 'T-shirt, pen set, and stickers',
      points: 200,
      category: 'goodies',
      icon: <CardGiftcardIcon />,
      available: 30,
    },
    {
      id: 3,
      name: 'Tech Workshop',
      description: 'Full-day workshop on latest technologies',
      points: 800,
      category: 'training',
      icon: <SchoolIcon />,
      available: 5,
    },
    {
      id: 4,
      name: 'Online Course Credit',
      description: '$100 credit for Udemy, Coursera, or similar platforms',
      points: 600,
      category: 'training',
      icon: <SchoolIcon />,
      available: 20,
    },
    {
      id: 5,
      name: 'Gym Membership (1 Month)',
      description: 'Access to World Class gym facilities',
      points: 400,
      category: 'wellness',
      icon: <FitnessCenterIcon />,
      available: 10,
    },
    {
      id: 6,
      name: 'Swimming Pool Pass',
      description: '10 entries to premium swimming pool',
      points: 300,
      category: 'wellness',
      icon: <PoolIcon />,
      available: 12,
    },
    {
      id: 7,
      name: 'Go-Karting Experience',
      description: '2-hour karting session for up to 4 people',
      points: 700,
      category: 'wellness',
      icon: <DirectionsCarIcon />,
      available: 8,
    },
    {
      id: 8,
      name: 'Coffee Shop Voucher',
      description: '$50 voucher for Starbucks or local coffee shops',
      points: 250,
      category: 'food',
      icon: <LocalCafeIcon />,
      available: 25,
    },
    {
      id: 9,
      name: 'Restaurant Voucher',
      description: '$100 voucher for selected restaurants',
      points: 500,
      category: 'food',
      icon: <RestaurantIcon />,
      available: 15,
    },
  ];

  const handleClaimReward = (reward: RewardItem) => {
    setSelectedReward(reward);
  };

  const confirmClaim = () => {
    if (selectedReward) {
      // Deduct points from user
      setUserPoints(prevPoints => prevPoints - selectedReward.points);
    }
    setSelectedReward(null);
    setShowSuccessDialog(true);
  };

  const nextMilestone = 1000;
  const progress = (userPoints / nextMilestone) * 100;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', p: 4 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            fontWeight="700"
            sx={{
              letterSpacing: '-0.03em',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              color: '#1a1a1a',
            }}
          >
            Manage Points
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem', mt: 0.5 }}>
            Earn points through bookings and redeem them for exciting rewards
          </Typography>
        </Box>

        {/* Points Overview Card - Simplified */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            bgcolor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: '#eff6ff',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EmojiEventsIcon sx={{ fontSize: 28, color: '#1e40af' }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="700" sx={{ color: '#1e40af' }}>
                    {userPoints}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Available Points
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1, width: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Progress to next milestone
                  </Typography>
                  <Typography variant="body2" fontWeight="600" sx={{ color: '#1e40af' }}>
                    {nextMilestone} pts
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#1e40af',
                      borderRadius: 4,
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: '#6b7280', mt: 0.5, display: 'block', fontSize: '0.75rem' }}
                >
                  {nextMilestone - userPoints} points until bonus reward
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* VIP Status - Top Attendee Benefit */}
        {userHistoricalRank <= 3 && (
          <Card
            elevation={0}
            sx={{
              mb: 3,
              bgcolor: 'white',
              border: '2px solid #1e40af',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(30, 64, 175, 0.1) 0%, transparent 70%)',
              }}
            />
            <CardContent sx={{ p: 3, position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: '#eff6ff',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MilitaryTechIcon sx={{ fontSize: 32, color: '#1e40af' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={`#${userHistoricalRank} Top Attendee`}
                      size="small"
                      sx={{
                        bgcolor: '#1e40af',
                        color: '#fff',
                        fontWeight: 700,
                        border: 'none',
                      }}
                    />
                    <Chip
                      label="VIP Access"
                      size="small"
                      icon={<StarIcon sx={{ fontSize: 14, color: '#1e40af !important' }} />}
                      sx={{
                        bgcolor: '#eff6ff',
                        color: '#1e40af',
                        fontWeight: 600,
                        border: '1px solid #1e40af',
                        '& .MuiChip-icon': { color: '#1e40af' },
                      }}
                    />
                  </Box>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#1e40af', mb: 1 }}>
                    🎉 Congratulations! You're in the Top {userHistoricalRank}!
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', mb: 2, lineHeight: 1.6 }}>
                    Based on your exceptional office attendance record, you've earned a spot in the top {userHistoricalRank} out of {totalUsers} employees! 
                    This achievement comes with exclusive benefits.
                  </Typography>
                  
                  <Box
                    sx={{
                      bgcolor: '#eff6ff',
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <EventAvailableIcon sx={{ fontSize: 20, color: '#1e40af' }} />
                      <Typography variant="body2" fontWeight="700" sx={{ color: '#1e40af' }}>
                        Exclusive VIP Perks Unlocked:
                      </Typography>
                    </Box>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            bgcolor: '#1e40af',
                            borderRadius: '50%',
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SportsPoolIcon sx={{ fontSize: 18, color: '#1e40af' }} />
                          <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                            <strong>Priority Booking</strong> for Billiard/Pool Table - Book up to 3 weeks in advance
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            bgcolor: '#1e40af',
                            borderRadius: '50%',
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SpaIcon sx={{ fontSize: 18, color: '#1e40af' }} />
                          <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                            <strong>Extended Access</strong> to Wellness Room - Book 3 weeks ahead (vs 2 weeks for others)
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            bgcolor: '#1e40af',
                            borderRadius: '50%',
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmojiEventsIcon sx={{ fontSize: 18, color: '#1e40af' }} />
                          <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                            <strong>VIP Status</strong> in all recreational spaces - Your bookings get priority confirmation
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                  
                  <Button
                    variant="contained"
                    sx={{
                      mt: 2,
                      bgcolor: '#1e40af',
                      color: '#fff',
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#1e3a8a',
                      },
                    }}
                    onClick={() => window.location.href = '/booking?filter=recreational'}
                  >
                    Book Recreational Spaces Now
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* How to Earn Points - Simplified */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            bgcolor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              <StarIcon sx={{ fontSize: 20, color: '#1e40af' }} />
              <Typography variant="h6" fontWeight="600" sx={{ color: '#1a1a1a' }}>
                How to Earn Points
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="700" sx={{ color: '#1e40af' }}>
                  +10
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.813rem' }}>
                  Per desk booking
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="700" sx={{ color: '#1e40af' }}>
                  +50
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.813rem' }}>
                  Weekly check-in bonus
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="700" sx={{ color: '#1e40af' }}>
                  +500
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.813rem' }}>
                  Monthly attendance
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Rewards Grid */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2.5, color: '#1a1a1a' }}>
          Available Rewards
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {rewards.map((reward) => (
            <Card
              key={reward.id}
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#1e40af',
                  boxShadow: '0 4px 12px rgba(30, 64, 175, 0.1)',
                },
              }}
            >
              <CardContent sx={{ flex: 1, p: 2.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: '#eff6ff',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1e40af',
                    }}
                  >
                    {reward.icon}
                  </Box>
                  <Chip
                    label={`${reward.points} pts`}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      bgcolor: userPoints >= reward.points ? '#eff6ff' : '#f9fafb',
                      color: userPoints >= reward.points ? '#1e40af' : '#6b7280',
                      border: '1px solid',
                      borderColor: userPoints >= reward.points ? '#bfdbfe' : '#e5e7eb',
                    }}
                  />
                </Box>

                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1, color: '#1a1a1a' }}>
                  {reward.name}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mb: 2, color: '#6b7280', fontSize: '0.813rem', lineHeight: 1.5 }}
                >
                  {reward.description}
                </Typography>

                <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                  {reward.available} available
                </Typography>
              </CardContent>

              <Box sx={{ p: 2.5, pt: 0 }}>
                <Button
                  fullWidth
                  variant={userPoints >= reward.points ? 'contained' : 'outlined'}
                  disabled={userPoints < reward.points}
                  onClick={() => handleClaimReward(reward)}
                  sx={{
                    bgcolor: userPoints >= reward.points ? '#1e40af' : undefined,
                    color: userPoints >= reward.points ? 'white' : '#6b7280',
                    borderColor: '#e5e7eb',
                    fontWeight: 600,
                    fontSize: '0.813rem',
                    py: 1,
                    '&:hover': {
                      bgcolor: userPoints >= reward.points ? '#1e3a8a' : undefined,
                      borderColor: '#1e40af',
                    },
                    '&:disabled': {
                      bgcolor: '#f9fafb',
                      color: '#9ca3af',
                      borderColor: '#e5e7eb',
                    },
                  }}
                >
                  {userPoints >= reward.points
                    ? 'Claim Reward'
                    : `Need ${reward.points - userPoints} more`}
                </Button>
              </Box>
            </Card>
          ))}
        </Box>

        {/* Claim Confirmation Dialog */}
        <Dialog
          open={selectedReward !== null}
          onClose={() => setSelectedReward(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              border: '1px solid #e5e7eb',
            }
          }}
        >
          {selectedReward && (
            <>
              <DialogTitle sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: '#eff6ff',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1e40af',
                    }}
                  >
                    {selectedReward.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ color: '#1a1a1a' }}>
                      {selectedReward.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.813rem' }}>
                      {selectedReward.points} points
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Alert 
                  severity="info"
                  sx={{ 
                    mb: 2,
                    bgcolor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    '& .MuiAlert-icon': {
                      color: '#1e40af',
                    },
                  }}
                >
                  You will have {userPoints - selectedReward.points} points remaining
                </Alert>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  {selectedReward.description}
                </Typography>
              </DialogContent>
              <DialogActions sx={{ p: 2.5, pt: 0 }}>
                <Button 
                  onClick={() => setSelectedReward(null)}
                  sx={{ color: '#6b7280' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={confirmClaim}
                  sx={{
                    bgcolor: '#1e40af',
                    '&:hover': {
                      bgcolor: '#1e3a8a',
                    },
                  }}
                >
                  Confirm
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Success Dialog */}
        <Dialog
          open={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          maxWidth="xs"
          PaperProps={{
            sx: {
              borderRadius: 2,
              border: '1px solid #e5e7eb',
            }
          }}
        >
          <DialogContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#eff6ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: 32, color: '#1e40af' }} />
            </Box>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 1, color: '#1a1a1a' }}>
              Reward Claimed!
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Check your email for redemption instructions.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              onClick={() => setShowSuccessDialog(false)}
              sx={{
                bgcolor: '#1e40af',
                px: 4,
                '&:hover': {
                  bgcolor: '#1e3a8a',
                },
              }}
            >
              Got it
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
