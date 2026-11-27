export const departments = [
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
      { id: 'partisipasi_humas_sdm', name: 'Partisipasi, Hubungan Masyarakat dan Sumber Daya Manusia' },
    ],
  },
];

export const roles = ['kepala_bagian', 'kepala_sub_bagian', 'staff'];

export const validWfhDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export const defaultWorkHours = {
  startHour: 8,
  startMinute: 0,
  endHourMonThu: 16,
  endMinuteMonThu: 0,
  endHourFri: 16,
  endMinuteFri: 30,
  toleranceMinutes: 0,
};

export const nipEmail = (nip) => `${String(nip).trim()}@nip.hadir.invalid`;

export function findDepartment(departmentId) {
  return departments.find((d) => d.id === departmentId) ?? null;
}

export function resolveSubdepartmentSlug(subdepartmentId) {
  if (typeof subdepartmentId !== 'string' || subdepartmentId.trim().length === 0) {
    return null;
  }
  const raw = subdepartmentId.trim();
  for (const d of departments) {
    for (const s of d.subdepartments) {
      if (s.id === raw) return s.id;
    }
  }
  const lower = raw.toLowerCase();
  if (lower.includes('keuangan')) return 'keuangan';
  if (lower.includes('umum') || lower.includes('logistik')) return 'umum_logistik';
  if (lower.includes('teknis')) return 'teknis_pemilu';
  if (lower.includes('hukum')) return 'hukum';
  if (lower.includes('perencanaan') || lower.includes('data')) return 'perencanaan_data';
  if (lower.includes('partisipasi') || lower.includes('humas') || lower.includes('sdm')) {
    return 'partisipasi_humas_sdm';
  }
  return raw;
}

export function resolveUnitDisplayName(departmentId, subdepartmentId, positionLabel) {
  if (typeof positionLabel === 'string' && positionLabel.trim().length > 0) {
    return positionLabel.trim();
  }
  const dept = findDepartment(departmentId);
  const slug = resolveSubdepartmentSlug(subdepartmentId);
  if (dept && slug) {
    const sub = dept.subdepartments.find((s) => s.id === slug);
    if (sub) return sub.name;
  }
  return dept?.name ?? 'Sekretariat KPU Sulut';
}
