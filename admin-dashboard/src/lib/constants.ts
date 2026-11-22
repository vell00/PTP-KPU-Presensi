import { WorkspaceData } from '@/types';

export const DEPARTMENTS = [
  {
    id: 'keuangan_umum_logistik',
    name: 'Bagian Keuangan Umum dan Logistik',
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
    name: 'Bagian Perencanaan, Data dan Informasi, Partisipasi, Hubungan Masyarakat dan Sumber Daya Manusia',
    subdepartments: [
      { id: 'perencanaan_data', name: 'Perencanaan Data dan Informasi' },
      { id: 'partisipasi_humas_sdm', name: 'Partisipasi, Humas & SDM' },
    ],
  },
];

export const ALL_UNITS_AND_POSITIONS = [
  // 1. Jabatan Fungsional, Struktural & Pimpinan
  'Ketua KPU Provinsi Sulut',
  'Sekretaris KPU Provinsi Sulut',
  'Ketua Divisi Teknis Penyelenggaraan Pemilu',
  'Ketua Divisi Perencanaan Data & Informasi',
  'Ketua Divisi Keuangan, Umum, Rumah Tangga & Logistik',
  'Ketua Divisi Hukum & Pengawasan',
  'Ketua Divisi Sosialisasi Pendidikan Pemilih, Partisipasi Masyarakat & Sumber Daya Manusia',
  'Kepala Bagian Keuangan, Umum dan Logistik',
  'Kepala Bagian Teknis Penyelenggaraan Pemilu dan Hukum',
  'Kepala Bagian Perencanaan, Data dan Informasi, Partisipasi, Hubungan Masyarakat, dan Sumber Daya Manusia',
  'Kepala Subbagian Keuangan',
  'Kepala Subbagian Umum dan Logistik',
  'Kepala Subbagian Teknis Penyelenggaraan Pemilu',
  'Kepala Subbagian Hukum',
  'Kepala Subbagian Perencanaan Data dan Informasi',
  'Kepala Subbagian Partisipasi, Hubungan Masyarakat dan Sumber Daya Manusia',
  'Jabatan Fungsional',
  'Jagat Saksana',
  'Pramubakti',
  // 2. Unit Subbagian
  'Keuangan',
  'Umum dan Logistik',
  'Teknis Penyelenggaraan Pemilu',
  'Hukum',
  'Perencanaan Data dan Informasi',
  'Partisipasi, Humas & SDM',
];

export const DIVISIONS = ALL_UNITS_AND_POSITIONS;

export const ALL_SUBDEPARTMENTS = DEPARTMENTS.flatMap((d) =>
  d.subdepartments.map((s) => ({ ...s, departmentName: d.name }))
);

export const WFH_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export const ROLES = [
  { id: 'kepala_bagian', label: 'Kepala Bagian' },
  { id: 'kepala_sub_bagian', label: 'Kepala Sub Bagian' },
  { id: 'staff', label: 'Staf' },
] as const;

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
  latitude: 1.4748,
  longitude: 124.8421,
  radius: 100,
};
