export type AttendanceStatus =
  | 'Tepat Waktu'
  | 'Terlambat'
  | 'Pulang Cepat'
  | 'Terlambat & Pulang Cepat'
  | 'Belum Absen Pulang'
  | 'Tidak Absen Pulang'
  | 'Belum / Tidak Absen'
  | 'Izin / Cuti';

export interface Attendance {
  id?: string;
  uid?: string;
  nip?: string;
  name: string;
  division: string;
  departmentId?: string;
  subdepartmentId?: string | null;
  mode: 'WFO' | 'WFH';
  dateKey?: string;
  entered: string; // ISO8601 (preferably +08:00 WITA)
  exited?: string | null;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  workedMinutes?: number;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceMeters?: number | null;
  accuracyMeters?: number | null;
  checkInSelfieUrl?: string | null;
  checkOutSelfieUrl?: string | null;
  authMethod?: 'biometric' | 'pin' | string;
}

export type LeaveType =
  | 'Izin'
  | 'Cuti Tahunan'
  | 'Cuti Sakit'
  | 'Perjalanan Dinas'
  | 'Koreksi Absen';

export interface LeaveRequest {
  id: string;
  uid?: string;
  nip?: string;
  name: string;
  unit?: string;
  type: LeaveType | string;
  reason: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  date: string; // legacy compatibility (equals startDate)
  attachmentUrl?: string | null;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
}

export interface Employee {
  id: string;
  nip: string;
  name: string;
  role: 'kepala_bagian' | 'kepala_sub_bagian' | 'staff';
  departmentId: string;
  subdepartmentId?: string | null;
  positionLabel?: string;
  active: boolean;
  isAdmin?: boolean;
  mustChangePassword?: boolean;
  hasPin: boolean;
}

export type WfhSchedule = Record<string, string[]>;

export interface WorkHoursPolicy {
  startHour: number;
  startMinute: number;
  endHourMonThu: number;
  endMinuteMonThu: number;
  endHourFri: number;
  endMinuteFri: number;
  toleranceMinutes: number;
}

export interface HolidayItem {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface WorkspaceData {
  records: Attendance[];
  requests: LeaveRequest[];
  employees: Employee[];
  wfhSchedule: WfhSchedule;
  workHours: WorkHoursPolicy;
  holidays: HolidayItem[];
  latitude: number | null;
  longitude: number | null;
  radius: number;
}
