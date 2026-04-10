'use client';

import { Desk, DeskStatus, SpaceType } from '@/types/desk';
import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';

interface AdminPanelProps {
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  onAddDesk: (desk: Omit<Desk, 'id'>) => void;
  onDeleteDesk: (deskId: number) => void;
  onExportDesks: () => void;
  onImportDesks: (desks: Desk[]) => void;
  selectedDesk: Desk | null;
  hideToggleButton?: boolean;
}

export default function AdminPanel({
  isAdminMode,
  onToggleAdminMode,
  onAddDesk,
  onDeleteDesk,
  onExportDesks,
  onImportDesks,
  selectedDesk,
  hideToggleButton = false,
}: AdminPanelProps) {
  const [newDeskName, setNewDeskName] = useState('');
  const [newDeskFloor, setNewDeskFloor] = useState('4');
  const [newDeskType, setNewDeskType] = useState<SpaceType>('desk');
  const [newDeskCapacity, setNewDeskCapacity] = useState<number | undefined>(undefined);
  const [newDeskManagementOnly, setNewDeskManagementOnly] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const handleAddDesk = () => {
    if (!newDeskName.trim()) return;

    onAddDesk({
      name: newDeskName,
      position: { x: 50, y: 50 },
      status: 'available',
      floor: newDeskFloor,
      type: newDeskType,
      capacity: newDeskCapacity,
      managementOnly: newDeskManagementOnly,
    });

    setNewDeskName('');
    setNewDeskCapacity(undefined);
    setNewDeskManagementOnly(false);
  };

  const handleImport = () => {
    try {
      const desks = JSON.parse(importText);
      onImportDesks(desks);
      setShowImportModal(false);
      setImportText('');
    } catch (error) {
      alert('Invalid JSON format');
    }
  };


  return (
    <Box sx={{ borderLeft: 1, borderColor: 'divider', p: 2, overflowY: 'auto', height: '100%' }}>
      {/* Admin Mode Toggle */}
      {!hideToggleButton && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={onToggleAdminMode}
            color={isAdminMode ? 'error' : 'success'}
            startIcon={isAdminMode ? <LockIcon /> : <LockOpenIcon />}
            sx={{ py: 1.5 }}
          >
            {isAdminMode ? 'Exit Admin Mode' : 'Enter Admin Mode'}
          </Button>
        </Box>
      )}

      {isAdminMode && (
        <>
          {/* Add New Place Form */}
          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Add New Place
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Place Name"
                value={newDeskName}
                onChange={(e) => setNewDeskName(e.target.value)}
                placeholder="e.g., 04.069"
                size="small"
                fullWidth
              />

              <TextField
                label="Floor"
                value={newDeskFloor}
                onChange={(e) => setNewDeskFloor(e.target.value)}
                placeholder="e.g., 4"
                size="small"
                fullWidth
              />

              <FormControl size="small" fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newDeskType}
                  label="Type"
                  onChange={(e) => {
                    setNewDeskType(e.target.value as SpaceType);
                    // Clear capacity when switching to desk type
                    if (e.target.value === 'desk') {
                      setNewDeskCapacity(undefined);
                    }
                  }}
                >
                  <MenuItem value="desk">Desk</MenuItem>
                  <MenuItem value="meeting-room">Meeting Room</MenuItem>
                  <MenuItem value="recreational">Recreational</MenuItem>
                </Select>
              </FormControl>

              {newDeskType !== 'desk' && (
                <TextField
                  label="Capacity"
                  type="number"
                  value={newDeskCapacity || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewDeskCapacity(value === '' ? undefined : parseInt(value, 10));
                  }}
                  placeholder="e.g., 10"
                  size="small"
                  fullWidth
                  inputProps={{ min: 1 }}
                  helperText="Number of people (optional)"
                />
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={newDeskManagementOnly}
                    onChange={(e) => setNewDeskManagementOnly(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    Management Only
                  </Typography>
                }
              />

              <Button
                variant="contained"
                onClick={handleAddDesk}
                startIcon={<AddIcon />}
                disabled={!newDeskName.trim()}
              >
                Add Place
              </Button>
            </Box>
          </Paper>

          {/* Selected Place Info */}
          {selectedDesk && (
            <Card sx={{ mb: 3, bgcolor: 'warning.light', borderColor: 'warning.main', border: 1 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Selected Place
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedDesk.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Position:</strong> X: {selectedDesk.position.x.toFixed(1)}%, Y: {selectedDesk.position.y.toFixed(1)}%
                  </Typography>
                  {selectedDesk.capacity && (
                    <Typography variant="body2">
                      <strong>Capacity:</strong> {selectedDesk.capacity}
                    </Typography>
                  )}
                  {selectedDesk.managementOnly && (
                    <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 600 }}>
                      <strong>Management Only:</strong> Yes
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  onClick={() => onDeleteDesk(selectedDesk.id)}
                  startIcon={<DeleteIcon />}
                >
                  Delete Place
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Import/Export */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
            <Button
              variant="outlined"
              onClick={onExportDesks}
              startIcon={<DownloadIcon />}
              fullWidth
            >
              Export Desks (JSON)
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowImportModal(true)}
              startIcon={<UploadIcon />}
              fullWidth
            >
              Import Desks (JSON)
            </Button>
          </Box>

          {/* Instructions */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.lighter', border: 1, borderColor: 'info.light' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              📝 Instructions:
            </Typography>
            <List dense>
              <ListItem sx={{ py: 0 }}>
                <ListItemText primary="Fill the form above and click 'Add Place', then click on map to place it" primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemText primary="Click existing place to select and delete it" primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemText primary="Drag places to reposition them" primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemText primary="Click 'Save Changes' button in header to save to database" primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemText primary="Export/Import for backup and restore" primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
            </List>
          </Paper>
        </>
      )}

      {/* Import Modal */}
      <Dialog open={showImportModal} onClose={() => setShowImportModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Desks</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={12}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste JSON array of desks here..."
            fullWidth
            sx={{ mt: 1, fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportModal(false)}>Cancel</Button>
          <Button onClick={handleImport} variant="contained">
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
