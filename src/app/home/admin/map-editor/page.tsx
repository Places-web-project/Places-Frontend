'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Desk } from '@/types/desk';
import FloorPlanMap from '@/components/FloorPlanMap';
import AdminPanel from '@/components/AdminPanel';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { apiService } from '@/services/api';

export default function MapEditorPage() {
  const router = useRouter();
  const [desks, setDesks] = useState<Desk[]>([]);
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(true); // Admin mode enabled by default on this page
  const [pendingDeskToAdd, setPendingDeskToAdd] = useState<Omit<Desk, 'id' | 'position'> | null>(null);
  const [selectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if user is admin
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.type !== 'ADMIN') {
          // Redirect non-admin users
          router.push('/home');
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        router.push('/home');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Keyboard shortcut for admin mode (Ctrl+Shift+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setIsAdminMode(prev => !prev);
        setSelectedDesk(null);
        setPendingDeskToAdd(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load desks and bookings from backend API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch rooms and bookings from backend API
        const [roomsResponse, bookingsResponse] = await Promise.all([
          apiService.getRooms(),
          apiService.getBookings(),
        ]);

        // Transform backend data to frontend Desk format, filtering by selected date
        const transformedDesks = await apiService.transformRoomsToDesks(
          roomsResponse.rooms,
          bookingsResponse.bookings,
          selectedDate // Filter bookings by selected date
        );

        setDesks(transformedDesks);
      } catch (error) {
        console.error('Failed to load desks from API:', error);
        // Fallback: try localStorage for migration
        const savedDesks = localStorage.getItem('desk-layout');
        if (savedDesks) {
          try {
            const parsed: Desk[] = JSON.parse(savedDesks);
            setDesks(parsed);
          } catch (e) {
            console.error('Failed to load from localStorage:', e);
          }
        }
      }
    };

    loadData();
  }, [selectedDate]); // Reload when selectedDate changes

  const handleDeskClick = (desk: Desk) => {
    if (isAdminMode) {
      setSelectedDesk(desk);
    }
  };

  const handleMapClick = (x: number, y: number) => {
    if (!isAdminMode || !pendingDeskToAdd) return;

    const newDesk: Desk = {
      ...pendingDeskToAdd,
      id: Date.now(),
      position: { x, y },
    };

    setDesks(prev => [...prev, newDesk]);
    setPendingDeskToAdd(null);
  };

  const handleAddDesk = (deskData: Omit<Desk, 'id'>) => {
    setPendingDeskToAdd(deskData);
  };

  const handleDeleteDesk = (deskId: number) => {
    setDesks(prev => prev.filter(d => d.id !== deskId));
    setSelectedDesk(null);
  };

  const handleDeskMove = (deskId: number, x: number, y: number) => {
    setDesks(prev =>
      prev.map(desk =>
        desk.id === deskId
          ? { ...desk, position: { x, y } }
          : desk
      )
    );
  };

  const handleExportDesks = () => {
    const dataStr = JSON.stringify(desks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'desk-layout.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDesks = (importedDesks: Desk[]) => {
    setDesks(importedDesks);
  };

  const handleToggleAdminMode = () => {
    setIsAdminMode(prev => !prev);
    setSelectedDesk(null);
    setPendingDeskToAdd(null);
  };

  const handleSaveDesks = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const result = await apiService.saveRooms(desks);
      setSaveMessage({
        type: 'success',
        text: `Saved successfully! Created: ${result.created}, Updated: ${result.updated}, Deleted: ${result.deleted}`,
      });
      
      // Reload desks to get updated IDs for newly created desks
      const [roomsResponse, bookingsResponse] = await Promise.all([
        apiService.getRooms(),
        apiService.getBookings(),
      ]);
      const transformedDesks = await apiService.transformRoomsToDesks(
        roomsResponse.rooms,
        bookingsResponse.bookings,
        selectedDate
      );
      setDesks(transformedDesks);
      
      // Clear message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error('Failed to save desks:', error);
      setSaveMessage({
        type: 'error',
        text: `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#fafafa' }}>
      {/* Header */}
      <Box sx={{ 
        width: '100%', 
        bgcolor: 'white', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 2.5, md: 3 },
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: saveMessage ? 2 : 0 }}>
          <Typography 
            variant="h4" 
            fontWeight="700" 
            sx={{ 
              letterSpacing: '-0.03em',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              color: '#1a1a1a'
            }}
          >
            Map Editor
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveDesks}
            disabled={isSaving}
            sx={{
              minWidth: 140,
              fontWeight: 600,
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
        {saveMessage && (
          <Alert 
            severity={saveMessage.type} 
            sx={{ mt: 1 }}
            onClose={() => setSaveMessage(null)}
          >
            {saveMessage.text}
          </Alert>
        )}
      </Box>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Map Area */}
        <Box sx={{ flex: 1, position: 'relative', bgcolor: '#f9fafb', overflow: 'hidden' }}>
          <FloorPlanMap
            desks={desks}
            onDeskClick={handleDeskClick}
            onMapClick={handleMapClick}
            isAdminMode={isAdminMode}
            onDeskMove={handleDeskMove}
            floorPlanImage="/MC_Etaj 4_Plan Compartimentare_11.09.2025-1.png"
          />
        </Box>

        {/* Admin Panel Sidebar - Always visible on this page */}
        <Box sx={{ width: 320, borderLeft: 1, borderColor: 'divider', bgcolor: 'white', overflowY: 'auto' }}>
          <AdminPanel
            isAdminMode={isAdminMode}
            onToggleAdminMode={handleToggleAdminMode}
            onAddDesk={handleAddDesk}
            onDeleteDesk={handleDeleteDesk}
            onExportDesks={handleExportDesks}
            onImportDesks={handleImportDesks}
            selectedDesk={selectedDesk}
            hideToggleButton={false}
          />
        </Box>
      </Box>
    </Box>
  );
}

