'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { apiService } from '@/services/api';

type FeedbackEntry = {
  id: number;
  category: string;
  experience: string;
  recommend: boolean;
  message: string;
};

export default function FeedbackPage() {
  const [category, setCategory] = useState('BOOKING');
  const [experience, setExperience] = useState('GOOD');
  const [recommend, setRecommend] = useState(false);
  const [message, setMessage] = useState('');
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadEntries = async () => {
    try {
      const result = await apiService.getFeedbackEntries();
      setEntries(result);
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load feedback history.');
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      setError('Please write a short feedback message.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.submitFeedback({
        category,
        experience,
        recommend,
        message: message.trim(),
      });
      setMessage('');
      setRecommend(false);
      setSuccess('Feedback submitted successfully.');
      await loadEntries();
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#ffffff', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        User Feedback
      </Typography>
      <Typography variant="body1" sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 3 }}>
        Help us improve the workspace booking experience.
      </Typography>

      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e5e7eb' }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <FormControl fullWidth>
              <FormLabel sx={{ mb: 1 }}>Feedback category (select)</FormLabel>
              <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                <MenuItem value="BOOKING">Booking flow</MenuItem>
                <MenuItem value="OFFICE_MAP">Office map</MenuItem>
                <MenuItem value="TEAMS">Team management</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>How was your experience? (radio)</FormLabel>
              <RadioGroup value={experience} onChange={(event) => setExperience(event.target.value)} row>
                <FormControlLabel value="EXCELLENT" control={<Radio />} label="Excellent" />
                <FormControlLabel value="GOOD" control={<Radio />} label="Good" />
                <FormControlLabel value="AVERAGE" control={<Radio />} label="Average" />
                <FormControlLabel value="POOR" control={<Radio />} label="Poor" />
              </RadioGroup>
            </FormControl>

            <FormControlLabel
              control={<Checkbox checked={recommend} onChange={(event) => setRecommend(event.target.checked)} />}
              label="Would you recommend this app to your colleagues? (checkbox)"
            />

            <TextField
              label="Your detailed feedback (text)"
              multiline
              minRows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />

            <Box>
              <Button type="submit" variant="contained" disabled={loading} sx={{ textTransform: 'none' }}>
                {loading ? 'Submitting...' : 'Submit feedback'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Paper sx={{ border: '1px solid #e5e7eb' }}>
        <Typography variant="h6" sx={{ p: 2.5, pb: 1 }}>
          Recent feedback
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell>Category</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Recommend</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No feedback submitted yet.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell>{entry.experience}</TableCell>
                    <TableCell>{entry.recommend ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{entry.message}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
