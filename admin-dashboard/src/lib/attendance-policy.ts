import type { Attendance, Employee, HolidayItem, LeaveRequest, WorkHoursPolicy } from '../types';

export const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;

export const DEFAULT_WORK_HOURS: WorkHoursPolicy = {
  startHour: 8,
  startMinute: 0,
  endHourMonThu: 16,
  endMinuteMonThu: 0,
  endHourFri: 16,
  endMinuteFri: 30,
  toleranceMinutes: 0,
};

export interface WitaParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0=Sun..6=Sat
  dateKey: string; // YYYY-MM-DD
  timeLabel: string; // HH:mm
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Parses an ISO string safely into WITA (UTC+8) components.
 * Supports explicit offset strings ("...+08:00", "...Z") and legacy timezone-naive strings
 * produced by earlier Flutter builds ("2026-11-26T08:05:00.000", already WITA wall-clock).
 */
export function parseToWitaParts(input: string | Date): WitaParts {
  if (input instanceof Date) {
    const shifted = new Date(input.getTime() + WITA_OFFSET_MS);
    const year = shifted.getUTCFullYear();
    const month = shifted.getUTCMonth() + 1;
    const day = shifted.getUTCDate();
    const hour = shifted.getUTCHours();
    const minute = shifted.getUTCMinutes();
    const second = shifted.getUTCSeconds();
    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      weekday: shifted.getUTCDay(),
      dateKey: `${year}-${pad2(month)}-${pad2(day)}`,
      timeLabel: `${pad2(hour)}:${pad2(minute)}`,
    };
  }

  const trimmed = String(input || '').trim();
  const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  const normalized = hasExplicitZone ? trimmed : `${trimmed}+08:00`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return parseToWitaParts(new Date());
  }
  return parseToWitaParts(parsed);
}

export function getWitaTodayKey(now: Date = new Date()): string {
  return parseToWitaParts(now).dateKey;
}

export function formatWitaDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d} ${months[m - 1] || m} ${y}`;
}

export function formatWitaFullDate(now: Date = new Date()): string {
  const p = parseToWitaParts(now);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${days[p.weekday]}, ${p.day} ${months[p.month - 1]} ${p.year}`;
}

export function evaluateRecordTiming(
  rec: Attendance,
  todayWitaKey: string,
  workHours: WorkHoursPolicy = DEFAULT_WORK_HOURS
) {
  const entered = parseToWitaParts(rec.entered);
  const startCutoff = workHours.startHour * 60 + workHours.startMinute + (workHours.toleranceMinutes || 0);
  const enteredMin = entered.hour * 60 + entered.minute;
  const lateMinutes =
    typeof rec.lateMinutes === 'number' ? rec.lateMinutes : Math.max(0, enteredMin - startCutoff);

  const isPast = entered.dateKey < todayWitaKey;
  const isMissedCheckOut = !rec.exited && isPast;
  const isTodayOpen = !rec.exited && entered.dateKey === todayWitaKey;

  let earlyLeaveMinutes = typeof rec.earlyLeaveMinutes === 'number' ? rec.earlyLeaveMinutes : 0;
  let exitedParts: WitaParts | null = null;
  if (rec.exited) {
    exitedParts = parseToWitaParts(rec.exited);
    if (typeof rec.earlyLeaveMinutes !== 'number') {
      const isFri = entered.weekday === 5;
      const targetEnd = isFri
        ? workHours.endHourFri * 60 + workHours.endMinuteFri
        : workHours.endHourMonThu * 60 + workHours.endMinuteMonThu;
      const outMin = exitedParts.hour * 60 + exitedParts.minute;
      earlyLeaveMinutes = exitedParts.dateKey === entered.dateKey ? Math.max(0, targetEnd - outMin) : 0;
    }
  }

  let status:
    | 'Tepat Waktu'
    | 'Terlambat'
    | 'Pulang Cepat'
    | 'Terlambat & Pulang Cepat'
    | 'Tidak Absen Pulang'
    | 'Belum Absen Pulang';

  if (isMissedCheckOut) {
    status = 'Tidak Absen Pulang';
  } else if (lateMinutes > 0 && earlyLeaveMinutes > 0) {
    status = 'Terlambat & Pulang Cepat';
  } else if (lateMinutes > 0) {
    status = 'Terlambat';
  } else if (earlyLeaveMinutes > 0) {
    status = 'Pulang Cepat';
  } else if (isTodayOpen) {
    status = 'Tepat Waktu';
  } else {
    status = 'Tepat Waktu';
  }

  return {
    dateKey: entered.dateKey,
    enteredParts: entered,
    exitedParts,
    lateMinutes,
    earlyLeaveMinutes,
    isMissedCheckOut,
    isTodayOpen,
    status,
  };
}

/**
 * Indonesian ASN/KPU TL & PSW tier deduction percentage (of total monthly base Tukin).
 * Reference: Perpres 126/2017 & Juknis Tukin Setjen KPU:
 * - TL1 / PSW1 (1–30 min): 0.5%
 * - TL2 / PSW2 (31–60 min): 1.0%
 * - TL3 / PSW3 (61–90 min): 1.25%
 * - TL4 / PSW4 (>90 min or Missed Check-Out): 1.5%
 * - Alpha / Tanpa Keterangan (TK): 3.0% per workday
 */
export function tierDeductionPercent(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes <= 30) return 0.5;
  if (minutes <= 60) return 1.0;
  if (minutes <= 90) return 1.25;
  return 1.5;
}

export interface JabatanTukinInfo {
  kategori: string;
  kelasLabel: string;
  nilaiJabatan: number;
  defaultIndeks: number;
  dasarHukum: string;
}

export const JABATAN_STANDAR_KPU: JabatanTukinInfo[] = [
  {
    kategori: 'Ketua KPU Provinsi',
    kelasLabel: 'Pimpinan KPU',
    nilaiJabatan: 4043,
    defaultIndeks: 5000,
    dasarHukum: 'Perpres 11/2016 (Uang Kehormatan)',
  },
  {
    kategori: 'Ketua Divisi / Anggota KPU Provinsi',
    kelasLabel: 'Pimpinan KPU',
    nilaiJabatan: 3713,
    defaultIndeks: 5000,
    dasarHukum: 'Perpres 11/2016 (Uang Kehormatan)',
  },
  {
    kategori: 'Sekretaris KPU Provinsi',
    kelasLabel: 'Kelas 15',
    nilaiJabatan: 3271,
    defaultIndeks: 4500,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Kepala Bagian',
    kelasLabel: 'Kelas 12',
    nilaiJabatan: 2203,
    defaultIndeks: 3300,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Kepala Subbagian',
    kelasLabel: 'Kelas 9',
    nilaiJabatan: 1454,
    defaultIndeks: 2600,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Jabatan Fungsional',
    kelasLabel: 'Kelas 8',
    nilaiJabatan: 1276,
    defaultIndeks: 2600,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Staf Pelaksana',
    kelasLabel: 'Kelas 7',
    nilaiJabatan: 1045,
    defaultIndeks: 2800,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Jagat Saksana',
    kelasLabel: 'Kelas 5',
    nilaiJabatan: 623,
    defaultIndeks: 4000,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Pramubakti / PPNPN',
    kelasLabel: 'Kelas 3',
    nilaiJabatan: 369,
    defaultIndeks: 6000,
    dasarHukum: 'Standar PPNPN KPU Provinsi',
  },
];

export function resolveJabatanInfo(positionOrUnit: string, role?: string): JabatanTukinInfo {
  const u = (positionOrUnit || '').toLowerCase();
  if (u.includes('ketua kpu')) return JABATAN_STANDAR_KPU[0];
  if (u.includes('ketua divisi') || u.includes('kadiv')) return JABATAN_STANDAR_KPU[1];
  if (u.includes('sekretaris')) return JABATAN_STANDAR_KPU[2];
  if (u.includes('kepala bagian') || role === 'kepala_bagian') return JABATAN_STANDAR_KPU[3];
  if (u.includes('kepala subbagian') || u.includes('kasubag') || role === 'kepala_sub_bagian') {
    return JABATAN_STANDAR_KPU[4];
  }
  if (u.includes('fungsional')) return JABATAN_STANDAR_KPU[5];
  if (u.includes('jagat saksana')) return JABATAN_STANDAR_KPU[7];
  if (u.includes('pramubakti')) return JABATAN_STANDAR_KPU[8];
  return JABATAN_STANDAR_KPU[6];
}

/**
 * Returns YYYY-MM-DD working days (Mon–Fri excluding holidays) in a given year/month (1-12),
 * capped at `cutoffDateKey` if the month is the current ongoing month (or future = 0 elapsed days).
 */
export function getElapsedWorkdaysInMonth(
  year: number,
  month: number,
  holidays: HolidayItem[],
  cutoffDateKey: string
): string[] {
  const holidaySet = new Set(holidays.map((h) => h.date));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const result: string[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${pad2(month)}-${pad2(d)}`;
    if (key > cutoffDateKey) break;
    const weekday = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    if (holidaySet.has(key)) continue;
    result.push(key);
  }
  return result;
}

export interface EmployeeTukinBreakdown {
  employee: Employee;
  jabatan: JabatanTukinInfo;
  indeks: number;
  baseTukin: number;
  maxAttendancePortion: number;
  performancePortion: number;
  workdaysCount: number;
  presentDays: number;
  approvedLeaveDays: number;
  alphaDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  missedCheckOutDays: number;
  deductionPercent: number;
  deductionAmount: number;
  attendancePortion: number;
  totalReceived: number;
}

export function calculateEmployeeMonthlyTukin(params: {
  employee: Employee;
  records: Attendance[];
  requests: LeaveRequest[];
  holidays: HolidayItem[];
  workHours?: WorkHoursPolicy;
  year: number;
  month: number; // 1-12
  todayWitaKey: string;
  customIndeks?: number | null;
  skpPercent?: number;
}): EmployeeTukinBreakdown {
  const {
    employee,
    records,
    requests,
    holidays,
    workHours = DEFAULT_WORK_HOURS,
    year,
    month,
    todayWitaKey,
    customIndeks = null,
    skpPercent = 100,
  } = params;

  const label = employee.positionLabel || employee.subdepartmentId || 'Staf Pelaksana';
  const jabatan = resolveJabatanInfo(label, employee.role);
  const indeks = customIndeks && customIndeks > 0 ? customIndeks : jabatan.defaultIndeks;
  const baseTukin = jabatan.nilaiJabatan * indeks;
  const maxAttendancePortion = Math.round(baseTukin * 0.4);
  const performancePortion = Math.round(baseTukin * 0.6 * (Math.min(100, Math.max(0, skpPercent)) / 100));

  const workdays = getElapsedWorkdaysInMonth(year, month, holidays, todayWitaKey);
  const workdaySet = new Set(workdays);
  const monthPrefix = `${year}-${pad2(month)}-`;

  const empRecordsByDay = new Map<string, Attendance>();
  for (const r of records) {
    const matchesEmp =
      (r.uid && r.uid === employee.id) ||
      (r.nip && r.nip === employee.nip) ||
      r.name.trim().toLowerCase() === employee.name.trim().toLowerCase();
    if (!matchesEmp) continue;
    const dk = r.dateKey || parseToWitaParts(r.entered).dateKey;
    if (!dk.startsWith(monthPrefix)) continue;
    empRecordsByDay.set(dk, r);
  }

  const approvedLeaveDates = new Set<string>();
  for (const req of requests) {
    if (req.status !== 'Disetujui') continue;
    const matchesEmp =
      (req.uid && req.uid === employee.id) ||
      (req.nip && req.nip === employee.nip) ||
      req.name.trim().toLowerCase() === employee.name.trim().toLowerCase();
    if (!matchesEmp) continue;
    const start = req.startDate || req.date;
    const end = req.endDate || req.date;
    if (!start || !end) continue;
    for (const wd of workdays) {
      if (wd >= start && wd <= end) {
        approvedLeaveDates.add(wd);
      }
    }
  }

  let presentDays = 0;
  let approvedLeaveDays = 0;
  let alphaDays = 0;
  let lateDays = 0;
  let earlyLeaveDays = 0;
  let missedCheckOutDays = 0;
  let totalDeductionPct = 0;

  for (const wd of workdays) {
    const rec = empRecordsByDay.get(wd);
    if (rec) {
      presentDays++;
      const timing = evaluateRecordTiming(rec, todayWitaKey, workHours);
      if (timing.isMissedCheckOut) {
        missedCheckOutDays++;
        totalDeductionPct += 1.5;
      } else {
        if (timing.lateMinutes > 0) {
          lateDays++;
          // Replacement-hour tolerance (Perpres/Juknis): late <= 60 min compensated if stayed late equally
          let compensated = false;
          if (timing.lateMinutes <= 60 && timing.exitedParts) {
            const isFri = timing.enteredParts.weekday === 5;
            const targetEnd = isFri
              ? workHours.endHourFri * 60 + workHours.endMinuteFri
              : workHours.endHourMonThu * 60 + workHours.endMinuteMonThu;
            const actualOut = timing.exitedParts.hour * 60 + timing.exitedParts.minute;
            if (actualOut >= targetEnd + timing.lateMinutes) {
              compensated = true;
            }
          }
          if (!compensated) {
            totalDeductionPct += tierDeductionPercent(timing.lateMinutes);
          }
        }
        if (timing.earlyLeaveMinutes > 0) {
          earlyLeaveDays++;
          totalDeductionPct += tierDeductionPercent(timing.earlyLeaveMinutes);
        }
      }
    } else if (approvedLeaveDates.has(wd)) {
      approvedLeaveDays++;
    } else if (wd < todayWitaKey && workdaySet.has(wd)) {
      // Past elapsed workday with neither attendance nor approved leave = Alpha (TK 3%)
      alphaDays++;
      totalDeductionPct += 3.0;
    }
  }

  const cappedPct = Math.min(40, totalDeductionPct);
  const deductionAmount = Math.min(maxAttendancePortion, Math.round(baseTukin * (cappedPct / 100)));
  const attendancePortion = Math.max(0, maxAttendancePortion - deductionAmount);
  const totalReceived = attendancePortion + performancePortion;

  return {
    employee,
    jabatan,
    indeks,
    baseTukin,
    maxAttendancePortion,
    performancePortion,
    workdaysCount: workdays.length,
    presentDays,
    approvedLeaveDays,
    alphaDays,
    lateDays,
    earlyLeaveDays,
    missedCheckOutDays,
    deductionPercent: Number(cappedPct.toFixed(2)),
    deductionAmount,
    attendancePortion,
    totalReceived,
  };
}
