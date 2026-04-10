import { TimeSlot, BookingDuration } from '@/types/desk';

/**
 * Business hours: 9:00 - 18:00, Monday to Friday
 */
export const BUSINESS_HOURS = {
  start: 9,
  end: 18,
};

/**
 * Check if a date is a weekday (Monday-Friday)
 */
export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

/**
 * Check if a time is within business hours
 */
export function isWithinBusinessHours(hour: number): boolean {
  return hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end;
}

/**
 * Generate time slots for a day (9:00 - 18:00, 30-minute intervals)
 */
export function generateTimeSlots(date: Date, existingBookings: { startTime: string; endTime: string }[] = []): TimeSlot[] {
  if (!isWeekday(date)) {
    return []; // No slots for weekends
  }

  const slots: TimeSlot[] = [];
  const startHour = BUSINESS_HOURS.start;
  const endHour = BUSINESS_HOURS.end;

  // Generate 30-minute slots
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const nextHour = minute === 30 ? hour + 1 : hour;
      const nextMinute = minute === 30 ? 0 : 30;
      const endTimeStr = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;

      // Check if this slot conflicts with existing bookings
      const isAvailable = !existingBookings.some(booking => {
        const slotStart = timeToMinutes(timeStr);
        const slotEnd = timeToMinutes(endTimeStr);
        const bookingStart = timeToMinutes(booking.startTime);
        const bookingEnd = timeToMinutes(booking.endTime);
        return (slotStart < bookingEnd && slotEnd > bookingStart);
      });

      slots.push({
        start: timeStr,
        end: endTimeStr,
        isAvailable,
      });
    }
  }

  return slots;
}

/**
 * Convert time string (HH:mm) to minutes
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes to time string (HH:mm)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Get available time slots for a specific duration
 */
export function getAvailableSlotsForDuration(
  slots: TimeSlot[],
  duration: BookingDuration
): TimeSlot[] {
  const durationMinutes = duration;
  const availableSlots: TimeSlot[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!slot.isAvailable) continue;

    // Check if we have enough consecutive available slots
    let consecutiveSlots = 1;
    let currentSlot = slot;
    let totalMinutes = 30; // Each slot is 30 minutes

    while (totalMinutes < durationMinutes && i + consecutiveSlots < slots.length) {
      const nextSlot = slots[i + consecutiveSlots];
      if (!nextSlot.isAvailable || nextSlot.start !== currentSlot.end) {
        break;
      }
      currentSlot = nextSlot;
      consecutiveSlots++;
      totalMinutes += 30;
    }

    if (totalMinutes >= durationMinutes) {
      availableSlots.push({
        start: slot.start,
        end: currentSlot.end,
        isAvailable: true,
      });
    }
  }

  return availableSlots;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

