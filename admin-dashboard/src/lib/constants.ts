import { HolidayItem, WorkspaceData } from '@/types';
import { DEFAULT_WORK_HOURS } from './attendance-policy';

export const DEPARTMENTS = [
  {
    id: 'keuangan_umum_logistik',
    name: 'Bagian Keuangan, Umum dan Logistik',
    subdepartments: [
      { id: 'keuangan', name: 'Keuangan' },
      { id: 'umum_logistik', name: 'Umum dan Logistik' },
    ],
  },
  {
    id: 'teknis_hukum',
    name: 'Bagian Teknis Penyelenggaraan Pemilu dan Hukum',
    subdepartments: [
      { id: 'teknis_pemilu', name: 'Teknis Penyelenggaraan Pemilu' },
      { id: 'hukum', name: 'Hukum' },
    ],
  },
  {
    id: 'perencanaan_sdm',
    name: 'Bagian Perencanaan, Data & Informasi, Partisipasi, Humas & SDM',
    subdepartments: [
      { id: 'perencanaan_data', name: 'Perencanaan Data dan Informasi' },
      { id: 'partisipasi_humas_sdm', name: 'Partisipasi, Humas & SDM' },
    ],
  },
] as const;

export const POSITION_LABELS = [
  'Ketua KPU Provinsi Sulut',
  'Sekretaris KPU Provinsi Sulut',
  'Ketua Divisi Teknis Penyelenggaraan Pemilu',
  'Ketua Divisi Perencanaan Data & Informasi',
  'Ketua Divisi Keuangan, Umum, Rumah Tangga & Logistik',
  'Ketua Divisi Hukum & Pengawasan',
  'Ketua Divisi Sosialisasi, Partisipasi Masyarakat & SDM',
  'Kepala Bagian Keuangan, Umum dan Logistik',
  'Kepala Bagian Teknis Penyelenggaraan Pemilu dan Hukum',
  'Kepala Bagian Perencanaan, Data, Partisipasi, Humas & SDM',
  'Kepala Subbagian Keuangan',
  'Kepala Subbagian Umum dan Logistik',
  'Kepala Subbagian Teknis Penyelenggaraan Pemilu',
  'Kepala Subbagian Hukum',
  'Kepala Subbagian Perencanaan Data dan Informasi',
  'Kepala Subbagian Partisipasi, Humas & SDM',
  'Jabatan Fungsional',
  'Staf Pelaksana',
  'Jagat Saksana',
  'Pramubakti',
] as const;

export const ALL_SUBDEPARTMENTS = DEPARTMENTS.flatMap((d) =>
  d.subdepartments.map((s) => ({ ...s, departmentId: d.id, departmentName: d.name }))
);

export const WFH_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

export const LEAVE_TYPES = [
  'Izin',
  'Cuti Tahunan',
  'Cuti Sakit',
  'Perjalanan Dinas',
  'Koreksi Absen',
] as const;

export const ROLES = [
  { id: 'kepala_bagian', label: 'Kepala Bagian' },
  { id: 'kepala_sub_bagian', label: 'Kepala Subbagian' },
  { id: 'staff', label: 'Staf / Pelaksana' },
] as const;

export const DEFAULT_HOLIDAYS: HolidayItem[] = [
  { date: '2026-01-01', name: 'Tahun Baru Masehi 2026' },
  { date: '2026-08-17', name: 'Hari Kemerdekaan RI ke-81' },
  { date: '2026-12-25', name: 'Hari Raya Natal' },
];

export function resolveUnitDisplay(params: {
  departmentId?: string;
  subdepartmentId?: string | null;
  positionLabel?: string;
  role?: string;
}): string {
  if (params.positionLabel && params.positionLabel.trim()) {
    return params.positionLabel.trim();
  }
  if (params.subdepartmentId) {
    const sub = ALL_SUBDEPARTMENTS.find((s) => s.id === params.subdepartmentId);
    if (sub) return sub.name;
    // Legacy documents may store raw display string in subdepartmentId
    return params.subdepartmentId;
  }
  const dept = DEPARTMENTS.find((d) => d.id === params.departmentId);
  if (dept) return dept.name;
  const roleObj = ROLES.find((r) => r.id === params.role);
  return roleObj?.label ?? 'Sekretariat KPU Sulut';
}

export function resolveSubdepartmentSlug(subdepartmentId?: string | null): string | null {
  if (!subdepartmentId) return null;
  const direct = ALL_SUBDEPARTMENTS.find((s) => s.id === subdepartmentId);
  if (direct) return direct.id;
  const lower = subdepartmentId.toLowerCase();
  if (lower.includes('keuangan')) return 'keuangan';
  if (lower.includes('umum') || lower.includes('logistik')) return 'umum_logistik';
  if (lower.includes('teknis')) return 'teknis_pemilu';
  if (lower.includes('hukum')) return 'hukum';
  if (lower.includes('perencanaan') || lower.includes('data')) return 'perencanaan_data';
  if (lower.includes('partisipasi') || lower.includes('humas') || lower.includes('sdm')) {
    return 'partisipasi_humas_sdm';
  }
  return null;
}

export const INITIAL_DATA: WorkspaceData = {
  records: [],
  requests: [],
  employees: [],
  wfhSchedule: {
    keuangan: ['Selasa', 'Jumat'],
    umum_logistik: ['Selasa', 'Jumat'],
    teknis_pemilu: ['Selasa', 'Jumat'],
    hukum: ['Selasa', 'Jumat'],
    perencanaan_data: ['Selasa', 'Jumat'],
    partisipasi_humas_sdm: ['Selasa', 'Jumat'],
  },
  workHours: DEFAULT_WORK_HOURS,
  holidays: DEFAULT_HOLIDAYS,
  latitude: 1.4748,
  longitude: 124.8421,
  radius: 100,
};
