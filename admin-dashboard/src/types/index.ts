export interface Attendance {
  name: string;
  division: string;
  mode: 'WFO' | 'WFH';
  entered: string; // ISO8601
  exited?: string | null;
  nip?: string;
  status?: string;
}

export interface LeaveRequest {
  id?: string;
  name: string;
  type: string;
  reason: string;
  date: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
}

export interface Employee {
  id: string;
  nip: string;
  name: string;
  password?: string;
  pin?: string;
  role: 'kepala_bagian' | 'kepala_sub_bagian' | 'staff';
  departmentId: string;
  subdepartmentId?: string;
}

export type WfhSchedule = Record<string, string[]>; // e.g. { 'keuangan': ['Selasa', 'Jumat'] }

export interface WorkspaceData {
  records: Attendance[];
  requests: LeaveRequest[];
  employees: Employee[];
  wfhSchedule: WfhSchedule;
  latitude: number | null;
  longitude: number | null;
  radius: number;
}
