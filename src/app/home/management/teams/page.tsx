'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import { apiService } from '@/services/api';

interface Team {
  id: number;
  name: string;
  description?: string;
  members: TeamMember[];
}

interface TeamMember {
  id: number;
  userId: number;
  teamId: number;
  user: {
    id: number;
    name: string;
    avatar: string;
    type: string;
  };
}

interface User {
  id: number;
  name: string;
  avatar: string;
  type: string;
}

export default function TeamManagementPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamsData, usersData] = await Promise.all([
        apiService.getTeams(),
        apiService.getUsers(),
      ]);
      setTeams(teamsData);
      setUsers(usersData.users || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      await apiService.createTeam({
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      });
      setSuccess('Team created successfully');
      setCreateDialogOpen(false);
      setTeamName('');
      setTeamDescription('');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditTeam = async () => {
    if (!selectedTeam || !teamName.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      await apiService.updateTeam(selectedTeam.id, {
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      });
      setSuccess('Team updated successfully');
      setEditDialogOpen(false);
      setSelectedTeam(null);
      setTeamName('');
      setTeamDescription('');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update team');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!confirm('Are you sure you want to delete this team? All team members will be removed.')) {
      return;
    }

    try {
      await apiService.deleteTeam(teamId);
      setSuccess('Team deleted successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete team');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedUserId) {
      setError('Please select a user');
      return;
    }

    try {
      await apiService.addTeamMember(selectedUserId as number, selectedTeam.id);
      setSuccess('Member added successfully');
      setAddMemberDialogOpen(false);
      setSelectedUserId('');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      await apiService.removeTeamMember(memberId);
      setSuccess('Member removed successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
      setTimeout(() => setError(null), 3000);
    }
  };

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description || '');
    setEditDialogOpen(true);
  };

  const openAddMemberDialog = (team: Team) => {
    setSelectedTeam(team);
    setSelectedUserId('');
    setAddMemberDialogOpen(true);
  };

  const getAvailableUsers = (team: Team) => {
    const memberUserIds = team.members.map(m => m.userId);
    return users.filter(u => !memberUserIds.includes(u.id) && (u.type === 'EMPLOYEE' || u.type === 'MANAGER'));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e40af', mb: 1 }}>
            Team Management
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Create and manage teams, assign employees and managers to teams
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setTeamName('');
            setTeamDescription('');
            setCreateDialogOpen(true);
          }}
          sx={{ fontWeight: 600 }}
        >
          Create Team
        </Button>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Teams List */}
      {teams.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <GroupsIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 1 }}>
            No teams yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.5)', mb: 2 }}>
            Create your first team to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Team
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {teams.map((team) => (
            <Paper key={team.id} sx={{ p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                    {team.name}
                  </Typography>
                  {team.description && (
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 2 }}>
                      {team.description}
                    </Typography>
                  )}
                  <Chip
                    label={`${team.members.length} member${team.members.length !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => openAddMemberDialog(team)}
                    sx={{ color: '#1e40af' }}
                  >
                    <PersonAddIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => openEditDialog(team)}
                    sx={{ color: '#1e40af' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteTeam(team.id)}
                    sx={{ color: '#ef4444' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Team Members */}
              {team.members.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.5)', fontStyle: 'italic' }}>
                  No members yet. Click the + icon to add members.
                </Typography>
              ) : (
                <List>
                  {team.members.map((member) => (
                    <ListItem
                      key={member.id}
                      sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: '#fafafa',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          mr: 2,
                          bgcolor: member.user.avatar ? 'transparent' : '#1e40af',
                        }}
                      >
                        {member.user.avatar ? (
                          <Box
                            dangerouslySetInnerHTML={{ __html: member.user.avatar }}
                            sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          />
                        ) : (
                          <PersonIcon sx={{ fontSize: 20, color: '#FFFFFF' }} />
                        )}
                      </Avatar>
                      <ListItemText
                        primary={member.user.name}
                        secondary={member.user.type}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveMember(member.id)}
                          sx={{ color: '#ef4444' }}
                        >
                          <PersonRemoveIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          ))}
        </Box>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            variant="outlined"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={teamDescription}
            onChange={(e) => setTeamDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTeam} variant="contained" disabled={!teamName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            variant="outlined"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={teamDescription}
            onChange={(e) => setTeamDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditTeam} variant="contained" disabled={!teamName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onClose={() => setAddMemberDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member to {selectedTeam?.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Employee or Manager</InputLabel>
            <Select
              value={selectedUserId}
              label="Select Employee or Manager"
              onChange={(e) => setSelectedUserId(e.target.value as number)}
            >
              {selectedTeam && getAvailableUsers(selectedTeam).map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name} ({user.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedTeam && getAvailableUsers(selectedTeam).length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              All available employees and managers are already in this team.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddMember}
            variant="contained"
            disabled={!selectedUserId || (selectedTeam && getAvailableUsers(selectedTeam).length === 0)}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

