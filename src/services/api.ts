import { Desk } from '@/types/desk';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const AUTH_API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || API_BASE_URL;
export const BOOKING_API_BASE_URL = process.env.NEXT_PUBLIC_BOOKING_API_URL || API_BASE_URL;
export const NOTIFICATION_API_BASE_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || API_BASE_URL;
export const API_WS_URL = process.env.NEXT_PUBLIC_WS_URL || API_BASE_URL.replace(/^http/, 'ws');

interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

interface AuthUserView {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

interface LoginApiResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  user: AuthUserView;
}

interface FeedbackApiRequest {
  category: string;
  experience: string;
  recommend: boolean;
  message: string;
}

interface FeedbackApiResponse extends FeedbackApiRequest {
  id: number;
}

interface BookingApiModel {
  id: number;
  userId: number;
  roomId: number;
  roomName: string;
  teamId: number | null;
  startsAt: string;
  endsAt: string;
  status: string;
}

interface RoomApiModel {
  id: number;
  name: string;
  capacity: number;
  roomType: string;
}

interface DeskApiModel {
  id: number;
  code: string;
  deskType: string;
  roomId: number;
}

interface TeamApiModel {
  id: number;
  name: string;
  description: string;
}

interface TeamMemberApiModel {
  id: number;
  userId: number;
  displayName: string;
  teamId: number;
}

interface LegacyRoom {
  id: number;
  data: string;
}

interface LegacyBooking {
  id: number;
  id_room: number;
  id_user: number;
  date: string;
  start: string;
  end: string;
  status?: string;
  room_name?: string;
}

interface LegacyUser {
  id: number;
  name: string;
  avatar: string;
  type: string;
  email?: string;
}

interface TeamWithMembers {
  id: number;
  name: string;
  description?: string;
  members: Array<{
    id: number;
    userId: number;
    teamId: number;
    user: {
      id: number;
      name: string;
      avatar: string;
      type: string;
    };
  }>;
}

type LoginResponse = {
  success: boolean;
  message: string;
  user: {
    id: number;
    name: string;
    avatar: string;
    type: string;
  } | null;
};

type UpdateAvatarResponse = {
  success: boolean;
  message: string;
  user: {
    id: number;
    name: string;
    avatar: string;
    type: string;
  } | null;
};

type FeedbackFormPayload = {
  category: string;
  experience: string;
  recommend: boolean;
  message: string;
};

class ApiService {
  private usersCache: LegacyUser[] = [];
  private roomsCache: LegacyRoom[] = [];

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('authToken');
  }

  private getStoredUser(): LegacyUser | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const userRaw = localStorage.getItem('user');
    if (!userRaw) {
      return null;
    }
    try {
      return JSON.parse(userRaw) as LegacyUser;
    } catch {
      return null;
    }
  }

  private storeUser(user: LegacyUser): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem('user', JSON.stringify(user));
  }

  private withAuthHeaders(headers?: HeadersInit): HeadersInit {
    const token = this.getStoredToken();
    return {
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private roleToUserType(roles: string[] | undefined): string {
    if (!roles || roles.length === 0) {
      return 'EMPLOYEE';
    }
    if (roles.includes('ADMIN')) {
      return 'ADMIN';
    }
    if (roles.includes('MANAGER')) {
      return 'MANAGER';
    }
    return 'EMPLOYEE';
  }

  private toLegacyUser(user: AuthUserView): LegacyUser {
    return {
      id: user.id,
      name: user.username,
      avatar: '',
      type: this.roleToUserType(user.roles),
      email: user.email,
    };
  }

  private parseDateTime(iso: string): { date: string; time: string } {
    const dateObj = new Date(iso);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
    };
  }

  private toIso(date: string, time: string): string {
    return `${date}T${time}:00`;
  }

  private mapRoomType(roomType: string): 'desk' | 'meeting-room' | 'recreational' {
    const normalized = (roomType || '').toLowerCase();
    if (normalized.includes('meeting')) {
      return 'meeting-room';
    }
    if (normalized.includes('recreational')) {
      return 'recreational';
    }
    return 'desk';
  }

  private roomToLegacyRoom(room: RoomApiModel, index: number): LegacyRoom {
    const colCount = 12;
    const row = Math.floor(index / colCount);
    const col = index % colCount;
    const x = 6 + col * 7.5;
    const y = 8 + row * 8;
    const type = this.mapRoomType(room.roomType);

    const asDesk: Desk = {
      id: room.id,
      name: room.name,
      floor: '4',
      position: { x, y },
      type,
      status: 'available',
      capacity: room.capacity,
    };

    return {
      id: room.id,
      data: JSON.stringify(asDesk),
    };
  }

  private bookingToLegacy(booking: BookingApiModel): LegacyBooking {
    const starts = this.parseDateTime(booking.startsAt);
    const ends = this.parseDateTime(booking.endsAt);

    return {
      id: booking.id,
      id_room: booking.roomId,
      id_user: booking.userId,
      date: starts.date,
      start: starts.time,
      end: ends.time,
      status: (booking.status || '').toLowerCase(),
      room_name: booking.roomName,
    };
  }

  private async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const payload = await response.json();
        message = payload.error || payload.message || payload.details || payload.detail || message;
      } catch {
        // ignore body parsing errors
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  async getRooms(): Promise<{ message: string; rooms: LegacyRoom[] }> {
    const paged = await this.fetchWithErrorHandling<PagedResponse<RoomApiModel>>(
      `${BOOKING_API_BASE_URL}/api/rooms?page=0&size=300&sortBy=name`,
      {
        headers: this.withAuthHeaders(),
      }
    );

    const legacyRooms = paged.content.map((room, idx) => this.roomToLegacyRoom(room, idx));
    this.roomsCache = legacyRooms;

    return {
      message: 'List of rooms',
      rooms: legacyRooms,
    };
  }

  async saveRooms(desks: Desk[]): Promise<{ message: string; created: number; updated: number; deleted: number }> {
    const currentRooms = await this.getRooms();
    const existing = currentRooms.rooms;
    const existingIds = new Set(existing.map((r) => r.id));

    let created = 0;
    let updated = 0;

    for (const desk of desks) {
      const payload = {
        name: desk.name,
        capacity: desk.capacity ?? 1,
        roomType: (desk.type || 'desk').toUpperCase(),
      };

      if (existingIds.has(desk.id)) {
        await this.fetchWithErrorHandling<RoomApiModel>(
          `${BOOKING_API_BASE_URL}/api/rooms/${desk.id}`,
          {
            method: 'PUT',
            headers: this.withAuthHeaders(),
            body: JSON.stringify(payload),
          }
        );
        updated++;
      } else {
        await this.fetchWithErrorHandling<RoomApiModel>(
          `${BOOKING_API_BASE_URL}/api/rooms`,
          {
            method: 'POST',
            headers: this.withAuthHeaders(),
            body: JSON.stringify(payload),
          }
        );
        created++;
      }
    }

    return {
      message: 'Saved via booking rooms API',
      created,
      updated,
      deleted: 0,
    };
  }

  async getBookings(): Promise<{ message: string; bookings: LegacyBooking[] }> {
    const paged = await this.fetchWithErrorHandling<PagedResponse<BookingApiModel>>(
      `${BOOKING_API_BASE_URL}/api/bookings?page=0&size=500`,
      {
        headers: this.withAuthHeaders(),
      }
    );

    return {
      message: 'List of bookings',
      bookings: paged.content.map((b) => this.bookingToLegacy(b)),
    };
  }

  async getUserBookings(userId: number): Promise<{
    user_id: number;
    user_name: string;
    bookings: Array<{ id: number; id_room: number; date: string; start: string; end: string }>;
    bookings_count: number;
    period: { start_date: string; end_date: string };
  }> {
    const paged = await this.fetchWithErrorHandling<PagedResponse<BookingApiModel>>(
      `${BOOKING_API_BASE_URL}/api/bookings?userId=${userId}&page=0&size=200`,
      {
        headers: this.withAuthHeaders(),
      }
    );

    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + 14);

    const user = this.getStoredUser();

    const bookings = paged.content
      .map((b) => this.bookingToLegacy(b))
      .filter((b) => {
        const bookingDate = new Date(`${b.date}T00:00:00`);
        return bookingDate >= today && bookingDate <= end;
      })
      .map((b) => ({
        id: b.id,
        id_room: b.id_room,
        date: b.date,
        start: b.start,
        end: b.end,
      }));

    return {
      user_id: userId,
      user_name: user?.name || `User ${userId}`,
      bookings,
      bookings_count: bookings.length,
      period: {
        start_date: today.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      },
    };
  }

  async getBookingsByDate(date: string): Promise<{
    date: string;
    total_bookings: number;
    users: Array<{
      user_id: number;
      user_name: string;
      bookings_count: number;
      bookings: Array<{ id: number; id_room: number; date: string; start: string; end: string }>;
    }>;
  }> {
    const all = await this.getBookings();
    const forDate = all.bookings.filter((b) => b.date === date);

    let usersMap = new Map<number, LegacyUser>();
    try {
      const users = await this.getUsers();
      usersMap = new Map(users.users.map((u) => [u.id, u]));
    } catch {
      // ignore users lookup errors
    }

    const grouped = new Map<number, Array<{ id: number; id_room: number; date: string; start: string; end: string }>>();
    for (const booking of forDate) {
      const list = grouped.get(booking.id_user) || [];
      list.push({
        id: booking.id,
        id_room: booking.id_room,
        date: booking.date,
        start: booking.start,
        end: booking.end,
      });
      grouped.set(booking.id_user, list);
    }

    return {
      date,
      total_bookings: forDate.length,
      users: Array.from(grouped.entries()).map(([userId, bookings]) => ({
        user_id: userId,
        user_name: usersMap.get(userId)?.name || `User ${userId}`,
        bookings_count: bookings.length,
        bookings,
      })),
    };
  }

  async updateUserSettings(
    userId: number,
    settings: { name?: string; password?: string; mood?: string }
  ): Promise<{ success: boolean; message: string; user: any }> {
    const current = this.getStoredUser();
    if (!current || current.id !== userId) {
      throw new Error('User session not found. Please log in again.');
    }

    if (settings.password) {
      throw new Error('Password change requires current password and is not supported by this screen yet.');
    }

    const updatedUser = {
      ...current,
      name: settings.name ?? current.name,
      mood: settings.mood ?? (current as any).mood,
    };

    this.storeUser(updatedUser as LegacyUser);

    return {
      success: true,
      message: 'Settings updated locally',
      user: updatedUser,
    };
  }

  async getTeams(): Promise<TeamWithMembers[]> {
    const teamsPaged = await this.fetchWithErrorHandling<PagedResponse<TeamApiModel>>(
      `${BOOKING_API_BASE_URL}/api/teams?page=0&size=200`,
      {
        headers: this.withAuthHeaders(),
      }
    );

    let usersMap = new Map<number, LegacyUser>();
    try {
      const usersResponse = await this.getUsers();
      usersMap = new Map(usersResponse.users.map((u) => [u.id, u]));
    } catch {
      // In case /api/users is restricted for this role.
    }

    const teams = await Promise.all(
      teamsPaged.content.map(async (team) => {
        const members = await this.fetchWithErrorHandling<TeamMemberApiModel[]>(
          `${BOOKING_API_BASE_URL}/api/teams/${team.id}/members`,
          {
            headers: this.withAuthHeaders(),
          }
        );

        return {
          id: team.id,
          name: team.name,
          description: team.description,
          members: members.map((member) => {
            const user = usersMap.get(member.userId);
            return {
              id: member.id,
              userId: member.userId,
              teamId: member.teamId,
              user: {
                id: member.userId,
                name: user?.name || member.displayName || `User ${member.userId}`,
                avatar: user?.avatar || '',
                type: user?.type || 'EMPLOYEE',
              },
            };
          }),
        };
      })
    );

    return teams;
  }

  async createTeam(teamData: { name: string; description?: string }): Promise<{ message: string; team: any }> {
    const team = await this.fetchWithErrorHandling<TeamApiModel>(
      `${BOOKING_API_BASE_URL}/api/teams`,
      {
        method: 'POST',
        headers: this.withAuthHeaders(),
        body: JSON.stringify({
          name: teamData.name,
          description: teamData.description || 'N/A',
        }),
      }
    );

    return { message: 'Team created', team };
  }

  async updateTeam(teamId: number, teamData: { name?: string; description?: string }): Promise<{ message: string; team: any }> {
    const existing = await this.fetchWithErrorHandling<TeamApiModel>(
      `${BOOKING_API_BASE_URL}/api/teams/${teamId}`,
      {
        headers: this.withAuthHeaders(),
      }
    );

    const team = await this.fetchWithErrorHandling<TeamApiModel>(
      `${BOOKING_API_BASE_URL}/api/teams/${teamId}`,
      {
        method: 'PUT',
        headers: this.withAuthHeaders(),
        body: JSON.stringify({
          name: teamData.name ?? existing.name,
          description: teamData.description ?? existing.description,
        }),
      }
    );

    return { message: 'Team updated', team };
  }

  async deleteTeam(teamId: number): Promise<{ message: string }> {
    await this.fetchWithErrorHandling<void>(
      `${BOOKING_API_BASE_URL}/api/teams/${teamId}`,
      {
        method: 'DELETE',
        headers: this.withAuthHeaders(),
      }
    );
    return { message: 'Team deleted' };
  }

  async addTeamMember(userId: number, teamId: number): Promise<{ message: string; member: any }> {
    let displayName = `User ${userId}`;
    try {
      const users = await this.getUsers();
      const user = users.users.find((u) => u.id === userId);
      if (user) {
        displayName = user.name;
      }
    } catch {
      // ignore users lookup errors
    }

    const member = await this.fetchWithErrorHandling<TeamMemberApiModel>(
      `${BOOKING_API_BASE_URL}/api/teams/${teamId}/members`,
      {
        method: 'POST',
        headers: this.withAuthHeaders(),
        body: JSON.stringify({ userId, displayName }),
      }
    );

    return { message: 'Member added', member };
  }

  async removeTeamMember(memberId: number): Promise<{ message: string }> {
    const teams = await this.getTeams();
    const ownerTeam = teams.find((team) => team.members.some((m) => m.id === memberId));
    if (!ownerTeam) {
      throw new Error('Team member not found');
    }

    await this.fetchWithErrorHandling<void>(
      `${BOOKING_API_BASE_URL}/api/teams/${ownerTeam.id}/members/${memberId}`,
      {
        method: 'DELETE',
        headers: this.withAuthHeaders(),
      }
    );

    return { message: 'Member removed' };
  }

  async getUserTeams(userId: number): Promise<{ message: string; teams: TeamWithMembers[] }> {
    const teams = await this.getTeams();
    const filtered = teams.filter((team) => team.members.some((member) => member.userId === userId));
    return { message: 'User teams', teams: filtered };
  }

  async createOrGetChat(roomId: number, date: string, startTime: string, endTime: string): Promise<{ chat: any; messages: any[] }> {
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, date, startTime, endTime }),
    });
    if (!response.ok) {
      throw new Error('Failed to create/get chat');
    }
    return response.json();
  }

  async getChat(chatId: number): Promise<{ chat: any; messages: any[] }> {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`);
    if (!response.ok) {
      throw new Error('Failed to get chat');
    }
    return response.json();
  }

  async sendMessage(chatId: number, userId: number, content: string): Promise<{ message: any }> {
    const response = await fetch(`${API_BASE_URL}/chats/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId, userId, content }),
    });
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return response.json();
  }

  async getUserChats(userId: number): Promise<{ chats: any[] }> {
    const response = await fetch(`${API_BASE_URL}/chats/users/${userId}/chats`);
    if (!response.ok) {
      throw new Error('Failed to get user chats');
    }
    return response.json();
  }

  async createBooking(booking: { id_room: number; id_user: number; date: string; start: string; end: string; teamId?: number }): Promise<{ message: string; booking: any; status?: string }> {
    const created = await this.fetchWithErrorHandling<BookingApiModel>(
      `${BOOKING_API_BASE_URL}/api/bookings`,
      {
        method: 'POST',
        headers: this.withAuthHeaders(),
        body: JSON.stringify({
          userId: booking.id_user,
          roomId: booking.id_room,
          teamId: booking.teamId ?? null,
          startsAt: this.toIso(booking.date, booking.start),
          endsAt: this.toIso(booking.date, booking.end),
        }),
      }
    );

    return {
      message: 'Booking created',
      booking: this.bookingToLegacy(created),
      status: (created.status || '').toLowerCase(),
    };
  }

  async updateBooking(bookingId: number, booking: { date: string; start: string; end: string }): Promise<{ message: string; booking: any }> {
    const current = await this.fetchWithErrorHandling<BookingApiModel>(
      `${BOOKING_API_BASE_URL}/api/bookings/${bookingId}`,
      {
        headers: this.withAuthHeaders(),
      }
    );

    await this.fetchWithErrorHandling<void>(
      `${BOOKING_API_BASE_URL}/api/bookings/${bookingId}`,
      {
        method: 'DELETE',
        headers: this.withAuthHeaders(),
      }
    );

    const recreated = await this.fetchWithErrorHandling<BookingApiModel>(
      `${BOOKING_API_BASE_URL}/api/bookings`,
      {
        method: 'POST',
        headers: this.withAuthHeaders(),
        body: JSON.stringify({
          userId: current.userId,
          roomId: current.roomId,
          teamId: current.teamId,
          startsAt: this.toIso(booking.date, booking.start),
          endsAt: this.toIso(booking.date, booking.end),
        }),
      }
    );

    return {
      message: 'Booking updated by recreate flow',
      booking: this.bookingToLegacy(recreated),
    };
  }

  async deleteBooking(bookingId: number): Promise<{ message: string; booking: any }> {
    await this.fetchWithErrorHandling<void>(
      `${BOOKING_API_BASE_URL}/api/bookings/${bookingId}`,
      {
        method: 'DELETE',
        headers: this.withAuthHeaders(),
      }
    );

    return {
      message: 'Booking deleted',
      booking: null,
    };
  }

  async getPendingBookings(): Promise<{ message: string; bookings: any[] }> {
    const paged = await this.fetchWithErrorHandling<PagedResponse<BookingApiModel>>(
      `${BOOKING_API_BASE_URL}/api/bookings?status=PENDING&page=0&size=200`,
      {
        headers: this.withAuthHeaders(),
      }
    );

    let usersMap = new Map<number, LegacyUser>();
    try {
      const users = await this.getUsers();
      usersMap = new Map(users.users.map((u) => [u.id, u]));
    } catch {
      // ignore users lookup errors
    }

    const bookings = paged.content.map((booking) => {
      const legacy = this.bookingToLegacy(booking);
      const user = usersMap.get(booking.userId);
      return {
        ...legacy,
        user: user
          ? { id: user.id, name: user.name, avatar: user.avatar, type: user.type }
          : null,
      };
    });

    return {
      message: 'Pending bookings',
      bookings,
    };
  }

  async approveBooking(bookingId: number): Promise<{ message: string; booking: any }> {
    const updated = await this.fetchWithErrorHandling<BookingApiModel>(
      `${BOOKING_API_BASE_URL}/api/bookings/${bookingId}/approve`,
      {
        method: 'PUT',
        headers: this.withAuthHeaders(),
      }
    );
    return { message: 'Booking approved', booking: this.bookingToLegacy(updated) };
  }

  async rejectBooking(bookingId: number): Promise<{ message: string; booking: any }> {
    const updated = await this.fetchWithErrorHandling<BookingApiModel>(
      `${BOOKING_API_BASE_URL}/api/bookings/${bookingId}/reject`,
      {
        method: 'PUT',
        headers: this.withAuthHeaders(),
      }
    );
    return { message: 'Booking rejected', booking: this.bookingToLegacy(updated) };
  }

  async getUsers(): Promise<{ message: string; users: LegacyUser[] }> {
    try {
      const paged = await this.fetchWithErrorHandling<PagedResponse<AuthUserView>>(
        `${AUTH_API_BASE_URL}/api/users?page=0&size=300`,
        {
          headers: this.withAuthHeaders(),
        }
      );

      const users = paged.content.map((u) => this.toLegacyUser(u));
      this.usersCache = users;

      return {
        message: 'List of users',
        users,
      };
    } catch (error) {
      const current = this.getStoredUser();
      if (current) {
        return { message: 'Fallback current user', users: [current] };
      }
      throw error;
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.fetchWithErrorHandling<LoginApiResponse>(
      `${AUTH_API_BASE_URL}/api/auth/login`,
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );

    const legacyUser = this.toLegacyUser(response.user);

    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(legacyUser));
      localStorage.setItem('isAuthenticated', 'true');
    }

    return {
      success: true,
      message: 'Login successful',
      user: legacyUser,
    };
  }

  async register(username: string, email: string, password: string): Promise<LoginResponse> {
    const response = await this.fetchWithErrorHandling<LoginApiResponse>(
      `${AUTH_API_BASE_URL}/api/auth/register`,
      {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      }
    );

    const legacyUser = this.toLegacyUser(response.user);

    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(legacyUser));
      localStorage.setItem('isAuthenticated', 'true');
    }

    return {
      success: true,
      message: 'Registration successful',
      user: legacyUser,
    };
  }

  async submitFeedback(payload: FeedbackFormPayload): Promise<FeedbackApiResponse> {
    return this.fetchWithErrorHandling<FeedbackApiResponse>(
      `${NOTIFICATION_API_BASE_URL}/api/feedback`,
      {
        method: 'POST',
        headers: this.withAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );
  }

  async getFeedbackEntries(): Promise<FeedbackApiResponse[]> {
    return this.fetchWithErrorHandling<FeedbackApiResponse[]>(
      `${NOTIFICATION_API_BASE_URL}/api/feedback`,
      {
        headers: this.withAuthHeaders(),
      }
    );
  }

  async updateAvatar(userId: number, avatar: string): Promise<UpdateAvatarResponse> {
    const current = this.getStoredUser();
    if (!current || current.id !== userId) {
      throw new Error('User not found in local session');
    }

    const updated = { ...current, avatar };
    this.storeUser(updated);

    return {
      success: true,
      message: 'Avatar updated locally',
      user: updated,
    };
  }

  async transformRoomsToDesks(rooms: LegacyRoom[], bookings: LegacyBooking[], filterDate?: string): Promise<Desk[]> {
    let usersMap = new Map<number, LegacyUser>();
    try {
      const users = await this.getUsers();
      usersMap = new Map(users.users.map((u) => [u.id, u]));
    } catch {
      usersMap = new Map(this.usersCache.map((u) => [u.id, u]));
    }

    const filteredBookings = filterDate ? bookings.filter((b) => b.date === filterDate) : bookings;

    return rooms.map((room) => {
      const desk = JSON.parse(room.data) as Desk;
      const roomBookings = filteredBookings.filter((b) => b.id_room === room.id);

      if (roomBookings.length === 0) {
        return {
          ...desk,
          status: 'available',
          bookedBy: undefined,
          bookedByAvatar: undefined,
          bookedDate: undefined,
          bookedStartTime: undefined,
          bookedEndTime: undefined,
          bookings: desk.type === 'meeting-room' || desk.type === 'recreational' ? [] : desk.bookings,
        };
      }

      if (desk.type === 'meeting-room' || desk.type === 'recreational') {
        return {
          ...desk,
          bookings: roomBookings
            .filter((booking) => (booking.status || '').toLowerCase() === 'approved' || (booking.status || '').toLowerCase() === 'active')
            .map((booking) => ({
              deskId: desk.id,
              userName: usersMap.get(booking.id_user)?.name || `User ${booking.id_user}`,
              date: booking.date,
              startTime: booking.start,
              endTime: booking.end,
            })),
        };
      }

      const selected =
        roomBookings.find((b) => (b.status || '').toLowerCase() === 'approved') ||
        roomBookings.find((b) => (b.status || '').toLowerCase() === 'active') ||
        roomBookings[0];

      const user = usersMap.get(selected.id_user);

      return {
        ...desk,
        status: (selected.status || '').toLowerCase() === 'rejected' ? 'available' : 'booked',
        bookedBy: user?.name || `User ${selected.id_user}`,
        bookedByAvatar: user?.avatar || undefined,
        bookedByMood: (user as any)?.mood || 'happy',
        bookedDate: selected.date,
        bookedStartTime: selected.start,
        bookedEndTime: selected.end,
      };
    });
  }

  async transformBookingToBackend(
    deskId: number,
    date: string,
    startTime: string,
    endTime: string,
    userName?: string
  ): Promise<{ id_room: number; id_user: number; date: string; start: string; end: string }> {
    const current = this.getStoredUser();
    let userId = current?.id;

    if (!userId && userName) {
      const users = await this.getUsers();
      userId = users.users.find((u) => u.name === userName)?.id;
    }

    return {
      id_room: deskId,
      id_user: userId || 1,
      date,
      start: startTime,
      end: endTime,
    };
  }
}

export const apiService = new ApiService();
export const mockApiService = apiService;
