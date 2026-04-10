'use client';

import { useState, useEffect } from 'react';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  IconButton,
  Snackbar,
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiService } from '@/services/api';

// Avataaars options - verified working values from DiceBear Avataaars
const avataaarsOptions = {
  skinColor: ['ffdbb4', 'edb98a', 'd08b5b', 'ae5d29', '614335'],
  hairColor: ['000000', '4a312c', '8d5524', 'b58143', 'c93305', 'e16381', 'f59797', 'ecdcbf'],
  eyes: ['closed', 'cry', 'default', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink', 'winkWacky', 'xDizzy'],
  eyebrows: ['angry', 'angryNatural', 'default', 'defaultNatural', 'flatNatural', 'raisedExcited', 'raisedExcitedNatural', 'sadConcerned', 'sadConcernedNatural', 'unibrowNatural', 'upDown', 'upDownNatural'],
  mouth: ['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'serious', 'smile', 'tongue', 'twinkle', 'vomit'],
  // Verified working hair/top values
  top: ['bigHair', 'bob', 'bun', 'curly', 'curvy', 'dreads', 'dreads01', 'dreads02', 'frida', 'frizzle', 'fro', 'froBand', 'hat', 'hijab', 'longButNotTooLong', 'miaWallace', 'shaggy', 'shaggyMullet', 'shavedSides', 'shortCurly', 'shortFlat', 'shortRound', 'shortWaved', 'sides', 'straight01', 'straight02', 'straightAndStrand', 'theCaesar', 'theCaesarAndSidePart', 'turban', 'winterHat1', 'winterHat02', 'winterHat03', 'winterHat04'],
  // Verified working accessories
  accessories: ['none', 'eyepatch', 'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers'],
  accessoriesColor: ['3c4f5c', '65c9ff', '262e33', '5199e4', '25557c', '929598', 'a7ffc4', 'b1e2ff', 'e6e6e6', 'ff5c5c', 'ff488e', 'ffafb9', 'ffdeb5', 'ffffb1', 'ffffff'],
  // Verified working facial hair
  facialHair: ['none', 'beardLight', 'beardMajestic', 'beardMedium', 'moustacheFancy', 'moustacheMagnum'],
  facialHairColor: ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'c93305', 'd6b370', 'e8e1e1', 'ecdcbf', 'f59797'],
  // Verified working clothing types
  clothing: ['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'],
  // Verified working clothing colors
  clothesColor: ['3c4f5c', '65c9ff', '262e33', '5199e4', '25557c', '929598', 'a7ffc4', 'b1e2ff', 'e6e6e6', 'ff5c5c', 'ff488e', 'ffafb9', 'ffffb1', 'ffffff'],
};

interface AvatarConfig {
  skinColor: string;
  hairColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  top: string;
  accessories: string;
  accessoriesColor: string;
  facialHair: string;
  facialHairColor: string;
  clothing: string;
  clothesColor: string;
}

export default function AvatarBuilder() {
  const [avatarSvg, setAvatarSvg] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Avatar configuration
  const [skinColor, setSkinColor] = useState<string>('ffdbb4');
  const [hairColor, setHairColor] = useState<string>('4a312c');
  const [eyes, setEyes] = useState<string>('default');
  const [eyebrows, setEyebrows] = useState<string>('default');
  const [mouth, setMouth] = useState<string>('smile');
  const [top, setTop] = useState<string>('shortFlat');
  const [accessories, setAccessories] = useState<string>('prescription02');
  const [accessoriesColor, setAccessoriesColor] = useState<string>('262e33');
  const [facialHair, setFacialHair] = useState<string>('beardMajestic');
  const [facialHairColor, setFacialHairColor] = useState<string>('4a312c');
  const [clothing, setClothing] = useState<string>('blazerAndSweater');
  const [clothesColor, setClothesColor] = useState<string>('ff5c5c');

  useEffect(() => {
    generateAvatar();
  }, [skinColor, hairColor, eyes, eyebrows, mouth, top, accessories, accessoriesColor, facialHair, facialHairColor, clothing, clothesColor]);

  const generateAvatar = () => {
    const options: any = {
      skinColor: [skinColor],
      hairColor: [hairColor],
      eyes: [eyes],
      eyebrows: [eyebrows],
      mouth: [mouth],
      top: [top],
      accessories: [accessories],
      accessoriesColor: [accessoriesColor],
      accessoriesProbability: 100,
      facialHair: [facialHair],
      facialHairColor: [facialHairColor],
      facialHairProbability: 100,
      clothing: [clothing],
      clothesColor: [clothesColor],
	  radius: 50
    };

    const avatar = createAvatar(avataaars, options);
    setAvatarSvg(avatar.toString());
  };

  const randomizeAvatar = () => {
    setSkinColor(avataaarsOptions.skinColor[Math.floor(Math.random() * avataaarsOptions.skinColor.length)]);
    setHairColor(avataaarsOptions.hairColor[Math.floor(Math.random() * avataaarsOptions.hairColor.length)]);
    setEyes(avataaarsOptions.eyes[Math.floor(Math.random() * avataaarsOptions.eyes.length)]);
    setEyebrows(avataaarsOptions.eyebrows[Math.floor(Math.random() * avataaarsOptions.eyebrows.length)]);
    setMouth(avataaarsOptions.mouth[Math.floor(Math.random() * avataaarsOptions.mouth.length)]);
    setTop(avataaarsOptions.top[Math.floor(Math.random() * avataaarsOptions.top.length)]);
    setAccessories(avataaarsOptions.accessories[Math.floor(Math.random() * avataaarsOptions.accessories.length)]);
    setAccessoriesColor(avataaarsOptions.accessoriesColor[Math.floor(Math.random() * avataaarsOptions.accessoriesColor.length)]);
    setFacialHair(avataaarsOptions.facialHair[Math.floor(Math.random() * avataaarsOptions.facialHair.length)]);
    setFacialHairColor(avataaarsOptions.facialHairColor[Math.floor(Math.random() * avataaarsOptions.facialHairColor.length)]);
    setClothing(avataaarsOptions.clothing[Math.floor(Math.random() * avataaarsOptions.clothing.length)]);
    setClothesColor(avataaarsOptions.clothesColor[Math.floor(Math.random() * avataaarsOptions.clothesColor.length)]);
  };

  const saveAvatar = async () => {
    setSaving(true);
    setSaveError(null);
    
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found. Please log in again.');
      }
      
      const user = JSON.parse(userStr);
      if (!user || !user.id) {
        throw new Error('Invalid user data. Please log in again.');
      }

      const avatarConfig: AvatarConfig = {
        skinColor,
        hairColor,
        eyes,
        eyebrows,
        mouth,
        top,
        accessories,
        accessoriesColor,
        facialHair,
        facialHairColor,
        clothing,
        clothesColor,
      };

      // Save avatar SVG to backend
      const response = await apiService.updateAvatar(user.id, avatarSvg);
      
      if (response.success && response.user) {
        // Update user data in localStorage with new avatar
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Also save config and SVG to localStorage for immediate use
        localStorage.setItem('userAvatar', JSON.stringify(avatarConfig));
        localStorage.setItem('userAvatarSvg', avatarSvg);
        
        // Dispatch custom event to notify other components (like navbar) that avatar was updated
        window.dispatchEvent(new Event('avatarUpdated'));
        
        setSaveSuccess(true);
      } else {
        throw new Error('Failed to save avatar');
      }
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save avatar. Please try again.');
      console.error('Error saving avatar:', error);
    } finally {
      setSaving(false);
    }
  };

  const loadSavedAvatar = () => {
    // First, try to load config from localStorage
    const savedConfig = localStorage.getItem('userAvatar');
    if (savedConfig) {
      try {
      const config: AvatarConfig = JSON.parse(savedConfig);
      setSkinColor(config.skinColor);
      setHairColor(config.hairColor);
      setEyes(config.eyes);
      setEyebrows(config.eyebrows);
      setMouth(config.mouth);
      setTop(config.top);
      setAccessories(config.accessories);
      setAccessoriesColor(config.accessoriesColor);
      setFacialHair(config.facialHair);
      setFacialHairColor(config.facialHairColor);
      setClothing(config.clothing);
      setClothesColor(config.clothesColor);
        return; // Config loaded, avatar will be generated by useEffect
      } catch (error) {
        console.error('Failed to parse saved avatar config:', error);
      }
    }
    
    // If no config, try to load SVG from user object or userAvatarSvg
    const userStr = localStorage.getItem('user');
    let avatarSvgToLoad = null;
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.avatar && user.avatar.trim()) {
          avatarSvgToLoad = user.avatar;
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
    
    // Fallback to userAvatarSvg if user object doesn't have avatar
    if (!avatarSvgToLoad) {
      const savedSvg = localStorage.getItem('userAvatarSvg');
      if (savedSvg) {
        avatarSvgToLoad = savedSvg;
      }
    }
    
    // If we have an SVG but no config, display the SVG directly
    if (avatarSvgToLoad) {
      setAvatarSvg(avatarSvgToLoad);
    }
  };

  useEffect(() => {
    // Load saved avatar on mount
    loadSavedAvatar();
  }, []);

  const formatLabel = (text: string) => {
    return text.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', bgcolor: '#FFFFFF', p: 4 }}>
      {/* Left Sidebar */}
      <Box sx={{ width: 320, bgcolor: '#FFFFFF', borderRight: '1px solid #bfdbfe', p: 3, overflowY: 'auto', borderRadius: 2, mr: 3, maxHeight: '100%' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1e40af' }}>
            Avatar Builder
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Customize your personal avatar
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<ShuffleIcon />}
            onClick={randomizeAvatar}
            fullWidth
            size="large"
            sx={{
              bgcolor: '#1e40af',
              color: '#FFFFFF',
              '&:hover': {
                bgcolor: '#1e3a8a',
              },
            }}
          >
            Randomize
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveAvatar}
            disabled={saving}
            fullWidth
            size="large"
            sx={{
              bgcolor: '#1e40af',
              color: '#FFFFFF',
              '&:hover': {
                bgcolor: '#1e3a8a',
              },
              '&:disabled': {
                bgcolor: 'rgba(30, 64, 175, 0.5)',
              },
            }}
          >
            {saving ? 'Saving...' : 'Save Avatar'}
          </Button>
          
          {saveError && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 1,
                bgcolor: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                '& .MuiAlert-icon': {
                  color: '#dc2626',
                },
              }}
              onClose={() => setSaveError(null)}
            >
              {saveError}
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 3, borderColor: '#bfdbfe' }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#1e40af' }}>
          Quick Info
        </Typography>
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2,
            bgcolor: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#000000',
            '& .MuiAlert-icon': {
              color: '#1e40af',
            },
          }}
        >
          Your avatar is automatically saved when you click Save. You can customize it anytime!
        </Alert>
      </Box>

      {/* Main Content - Avatar Preview */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card 
          elevation={0}
          sx={{ 
            maxWidth: 500, 
            width: '100%',
            bgcolor: '#FFFFFF',
            border: '1px solid #bfdbfe',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, textAlign: 'center', color: '#1e40af' }}>
              Preview
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: '#eff6ff',
                borderRadius: 2,
                p: 4,
                minHeight: 300,
                border: '1px solid #bfdbfe',
              }}
            >
              <Box
                dangerouslySetInnerHTML={{ __html: avatarSvg }}
                sx={{ width: 256, height: 256 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Right Sidebar - Custom Features */}
      <Box sx={{ width: 320, bgcolor: '#FFFFFF', borderLeft: '1px solid #bfdbfe', p: 3, overflowY: 'auto', borderRadius: 2, ml: 3, maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3, flexShrink: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1e40af' }}>
            Customize Features
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Control individual avatar elements
          </Typography>
        </Box>
        
        <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>

        {/* Skin Color */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#000000' }}>
            Skin Tone
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {avataaarsOptions.skinColor.map((color) => (
                  <IconButton
                    key={color}
                    onClick={() => setSkinColor(color)}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: `#${color}`,
                      border: skinColor === color ? 3 : 1,
                      borderColor: skinColor === color ? '#1e40af' : '#bfdbfe',
                      '&:hover': { 
                        bgcolor: `#${color}`, 
                        transform: 'scale(1.1)',
                        borderColor: '#1e40af',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Hair Style */}
            <FormControl fullWidth sx={{ mb: 3 }} size="small">
              <InputLabel sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>Hair Style</InputLabel>
              <Select 
                value={top} 
                label="Hair Style" 
                onChange={(e) => setTop(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#bfdbfe',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                }}
              >
                {avataaarsOptions.top.map((option) => (
                  <MenuItem key={option} value={option}>
                    {formatLabel(option)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Hair Color */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#000000' }}>
                Hair Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {avataaarsOptions.hairColor.map((color) => (
                  <IconButton
                    key={color}
                    onClick={() => setHairColor(color)}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: `#${color}`,
                      border: hairColor === color ? 3 : 1,
                      borderColor: hairColor === color ? '#1e40af' : '#bfdbfe',
                      '&:hover': { 
                        bgcolor: `#${color}`, 
                        transform: 'scale(1.1)',
                        borderColor: '#1e40af',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Eyes */}
            <FormControl fullWidth sx={{ mb: 3 }} size="small">
              <InputLabel sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>Eyes</InputLabel>
              <Select 
                value={eyes} 
                label="Eyes" 
                onChange={(e) => setEyes(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#bfdbfe',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                }}
              >
                {avataaarsOptions.eyes.map((option) => (
                  <MenuItem key={option} value={option}>
                    {formatLabel(option)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Eyebrows */}
            <FormControl fullWidth sx={{ mb: 3 }} size="small">
              <InputLabel sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>Eyebrows</InputLabel>
              <Select 
                value={eyebrows} 
                label="Eyebrows" 
                onChange={(e) => setEyebrows(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#bfdbfe',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                }}
              >
                {avataaarsOptions.eyebrows.map((option) => (
                  <MenuItem key={option} value={option}>
                    {formatLabel(option)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Mouth */}
            <FormControl fullWidth sx={{ mb: 3 }} size="small">
              <InputLabel sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>Mouth</InputLabel>
              <Select 
                value={mouth} 
                label="Mouth" 
                onChange={(e) => setMouth(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#bfdbfe',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                }}
              >
                {avataaarsOptions.mouth.map((option) => (
                  <MenuItem key={option} value={option}>
                    {formatLabel(option)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Accessories */}
            <FormControl fullWidth sx={{ mb: 3 }} size="small">
              <InputLabel sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>Accessories</InputLabel>
              <Select 
                value={accessories} 
                label="Accessories" 
                onChange={(e) => setAccessories(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#bfdbfe',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                }}
              >
                {avataaarsOptions.accessories.map((option) => (
                  <MenuItem key={option} value={option}>
                    {formatLabel(option)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Accessories Color */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#000000' }}>
                Accessories Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {avataaarsOptions.accessoriesColor.map((color) => (
                  <IconButton
                    key={color}
                    onClick={() => setAccessoriesColor(color)}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: `#${color}`,
                      border: accessoriesColor === color ? 3 : 1,
                      borderColor: accessoriesColor === color ? '#1e40af' : '#bfdbfe',
                      '&:hover': { 
                        bgcolor: `#${color}`, 
                        transform: 'scale(1.1)',
                        borderColor: '#1e40af',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Facial Hair */}
            <FormControl fullWidth sx={{ mb: 3 }} size="small">
              <InputLabel sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>Facial Hair</InputLabel>
              <Select 
                value={facialHair} 
                label="Facial Hair" 
                onChange={(e) => setFacialHair(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#bfdbfe',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                }}
              >
                {avataaarsOptions.facialHair.map((option) => (
                  <MenuItem key={option} value={option}>
                    {formatLabel(option)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Facial Hair Color */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#000000' }}>
                Facial Hair Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {avataaarsOptions.facialHairColor.map((color) => (
                  <IconButton
                    key={color}
                    onClick={() => setFacialHairColor(color)}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: `#${color}`,
                      border: facialHairColor === color ? 3 : 1,
                      borderColor: facialHairColor === color ? '#1e40af' : '#bfdbfe',
                      '&:hover': { 
                        bgcolor: `#${color}`, 
                        transform: 'scale(1.1)',
                        borderColor: '#1e40af',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Clothing */}
            <FormControl fullWidth sx={{ mb: 3 }} size="small">
              <InputLabel sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>Clothing</InputLabel>
              <Select 
                value={clothing} 
                label="Clothing" 
                onChange={(e) => setClothing(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#bfdbfe',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e40af',
                  },
                }}
              >
                {avataaarsOptions.clothing.map((option) => (
                  <MenuItem key={option} value={option}>
                    {formatLabel(option)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Clothing Color */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#000000' }}>
                Clothing Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {avataaarsOptions.clothesColor.map((color) => (
                  <IconButton
                    key={color}
                    onClick={() => setClothesColor(color)}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: `#${color}`,
                      border: clothesColor === color ? 3 : 1,
                      borderColor: clothesColor === color ? '#1e40af' : '#bfdbfe',
                      '&:hover': { 
                        bgcolor: `#${color}`, 
                        transform: 'scale(1.1)',
                        borderColor: '#1e40af',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
        </Box>
      </Box>

      {/* Save Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSaveSuccess(false)} 
          severity="success" 
          variant="filled"
          icon={<CheckCircleIcon />}
          sx={{
            bgcolor: '#1e40af',
            color: '#FFFFFF',
            '& .MuiAlert-icon': {
              color: '#FFFFFF',
            },
            '& .MuiAlert-message': {
              color: '#FFFFFF',
            },
          }}
        >
          Avatar saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
