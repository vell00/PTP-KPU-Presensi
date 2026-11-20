import { Employee, WorkspaceData } from '@/types';

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

export const ROLES = [
  { id: 'kepala_bagian', label: 'Kepala Bagian' },
  { id: 'kepala_sub_bagian', label: 'Kepala Sub Bagian' },
  { id: 'staff', label: 'Staf' },
] as const;

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: '1',
    nip: '198503152010011002',
    name: 'Andreas R. Sondakh',
    role: 'kepala_bagian',
    departmentId: 'keuangan_umum_logistik',
    subdepartmentId: 'keuangan',
  },
  {
    id: '2',
    nip: '199008222015022003',
    name: 'Michelle W. Runtuwene',
    role: 'staff',
    departmentId: 'keuangan_umum_logistik',
    subdepartmentId: 'umum_logistik',
  },
  {
    id: '3',
    nip: '198811042012011005',
    name: 'Rizky A. Mamonto',
    role: 'kepala_sub_bagian',
    departmentId: 'teknis_hukum',
    subdepartmentId: 'teknis_pemilu',
  },
  {
    id: '4',
    nip: '199204122018032001',
    name: 'Christina M. Lumentut',
    role: 'staff',
    departmentId: 'teknis_hukum',
    subdepartmentId: 'hukum',
  },
  {
    id: '5',
    nip: '199101302017011004',
    name: 'Fadli R. Paputungan',
    role: 'staff',
    departmentId: 'perencanaan_sdm',
    subdepartmentId: 'perencanaan_data',
  },
];

export const INITIAL_DATA: WorkspaceData = {
  records: [
    {
      name: 'Andreas R. Sondakh',
      division: 'Keuangan',
      mode: 'WFO',
      entered: new Date(Date.now() - 3600000 * 3).toISOString(),
      exited: null,
    },
    {
      name: 'Christina M. Lumentut',
      division: 'Hukum',
      mode: 'WFO',
      entered: new Date(Date.now() - 3600000 * 2.5).toISOString(),
      exited: null,
    },
    {
      name: 'Fadli R. Paputungan',
      division: 'Perencanaan Data dan Informasi',
      mode: 'WFH',
      entered: new Date(Date.now() - 3600000 * 2).toISOString(),
      exited: null,
    },
  ],
  requests: [
    {
      id: 'req-1',
      name: 'Michelle W. Runtuwene',
      type: 'Cuti tahunan',
      reason: 'Keperluan keluarga di luar kota',
      date: new Date().toISOString().slice(0, 10),
      status: 'Menunggu',
    },
    {
      id: 'req-2',
      name: 'Rizky A. Mamonto',
      type: 'Izin',
      reason: 'Urusan pribadi mendesak',
      date: new Date().toISOString().slice(0, 10),
      status: 'Menunggu',
    },
  ],
  employees: INITIAL_EMPLOYEES,
  fridayWfh: true,
  latitude: 1.4748, // Kantor KPU Sulut
  longitude: 124.8421,
  radius: 100,
};
