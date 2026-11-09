import { AuthError, type Hours } from '@/auth/types';
import type { Master } from '@/data/types';

import type { AttendanceRow, Stats } from './business';
import { isLive, request } from './client';

/** A booking as the master sees it in their cabinet. */
export type StaffBooking = {
  id: string;
  startAt: string;
  endAt: string;
  services: string[];
  total: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'no_show';
  client: string | null;
  source: 'customer' | 'salon';
};

/** Everything a master's own cabinet shows. */
export type StaffCabinet = {
  salon: { id: string; name: string; address: string; logoUrl: string | null; hoursWeek: (Hours | null)[] };
  master: Master;
  checkedIn: boolean;
  openShift: AttendanceRow | null;
  today: AttendanceRow[];
  recent: AttendanceRow[];
  bookings: StaffBooking[];
  /** This month so far. */
  stats: Stats;
};

export interface StaffApi {
  me(token: string): Promise<StaffCabinet>;
  stats(token: string, q: { from?: string; to?: string }): Promise<Stats>;
  checkIn(token: string): Promise<AttendanceRow>;
  checkOut(token: string): Promise<AttendanceRow>;
}

const httpStaffApi: StaffApi = {
  me: (token) => request('GET', '/staff/me', { token, fresh: true }),
  stats: (token, q) => request('GET', '/staff/stats', { token, query: q }),
  checkIn: (token) => request('POST', '/staff/check-in', { token }),
  checkOut: (token) => request('POST', '/staff/check-out', { token }),
};

/** The on-device demo has no staff accounts. */
const demoStaffApi: StaffApi = {
  me: async () => {
    throw new AuthError('forbidden');
  },
  stats: async () => {
    throw new AuthError('forbidden');
  },
  checkIn: async () => {
    throw new AuthError('forbidden');
  },
  checkOut: async () => {
    throw new AuthError('forbidden');
  },
};

export const staffApi: StaffApi = isLive ? httpStaffApi : demoStaffApi;
