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

export const DIVISIONS = [
  'Keuangan',
  'Umum dan Logistik',
  'Teknis Penyelenggaraan Pemilu',
  'Hukum',
  'Perencanaan Data dan Informasi',
  'Partisipasi, Hubungan Masyarakat dan Sumber Daya Manusia',
];

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
