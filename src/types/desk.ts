export type DeskStatus = 
  | 'available' 
  | 'booked' 
  | 'selected'
  | 'colleague' 
  | 'team-member' 
  | 'closed' 
  | 'awaiting-cleaning' 
  | 'hidden' 
  | 'fixed-space';

export type SpaceType = 'desk' | 'meeting-room' | 'recreational';

export type BookingDuration = 30 | 60 | 90 | 120 | 150 | 180 | 210 | 240; // minutes

export interface DeskPosition {
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
  isAvailable: boolean;
}

export interface Desk {
  id: number;
  name: string;
  position: DeskPosition;
  status?: DeskStatus;
  floor: string;
  type?: SpaceType; // Optional, defaults to 'desk'
  attributes?: string[];
  escalation?: boolean; // If true, requires manager approval for bookings
  managementOnly?: boolean; // If true, only managers can book this space
  bookedBy?: string;
  bookedByAvatar?: string; // Avatar SVG of the user who booked this desk
  bookedByMood?: string; // Mood of the user who booked this desk: "happy", "sad", "stressed", "tired", "focused"
  bookedDate?: string;
  bookedStartTime?: string; // HH:mm format
  bookedEndTime?: string; // HH:mm format
  bookings?: Booking[]; // For meeting rooms with multiple time slots
  capacity?: number; // Capacity for meeting rooms (number of people)
}

export interface Booking {
  deskId: number;
  userName: string;
  date: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  duration?: number; // minutes
  participants?: string[]; // List of participant names for meeting rooms and recreational spaces
}
