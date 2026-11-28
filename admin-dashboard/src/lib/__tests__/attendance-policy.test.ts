import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseToWitaParts,
  evaluateRecordTiming,
  getElapsedWorkdaysInMonth,
  calculateEmployeeMonthlyTukin,
  tierDeductionPercent,
} from '../attendance-policy.ts';

test('parseToWitaParts converts UTC ISO and legacy timezone-naive WITA strings accurately', () => {
  // 2026-11-26 00:05 UTC == 08:05 WITA
  const utc = parseToWitaParts('2026-11-26T00:05:00.000Z');
  assert.equal(utc.dateKey, '2026-11-26');
  assert.equal(utc.hour, 8);
  assert.equal(utc.minute, 5);

  // Legacy naive WITA string
  const naive = parseToWitaParts('2026-11-26T08:05:00.000');
  assert.equal(naive.dateKey, '2026-11-26');
  assert.equal(naive.hour, 8);
  assert.equal(naive.minute, 5);
});

test('getElapsedWorkdaysInMonth excludes weekends and configured national holidays', () => {
  // Nov 2026: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri -> 5 workdays up to Nov 6
  const workdays = getElapsedWorkdaysInMonth(
    2026,
    11,
    [{ date: '2026-11-04', name: 'Hari Libur Uji' }],
    '2026-11-06'
  );
  assert.deepEqual(workdays, ['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06']);
});

test('calculateEmployeeMonthlyTukin penalizes Alpha days, respects approved leaves, and applies replacement-hour tolerance', () => {
  const emp = {
    id: 'nip_199001012020011001',
    nip: '199001012020011001',
    name: 'Budi Santoso',
    role: 'staff' as const,
    departmentId: 'keuangan_umum_logistik',
    subdepartmentId: 'keuangan',
    positionLabel: 'Staf Pelaksana',
    active: true,
    hasPin: true,
  };

  // Cutoff: 2026-11-06 (workdays: Nov 2, 3, 4, 5, 6)
  // Nov 2: On time (07:55 - 16:00)
  // Nov 3: Late 20 min (08:20) and stayed until 16:25 -> compensated! 0% deduction
  // Nov 4: Late 45 min (08:45 - 16:00) -> TL2 = 1.0% deduction
  // Nov 5: Approved Cuti Tahunan -> 0% deduction
  // Nov 6: Today (not yet checked in, not past -> not Alpha yet)
  const res = calculateEmployeeMonthlyTukin({
    employee: emp,
    records: [
      {
        uid: emp.id,
        nip: emp.nip,
        name: emp.name,
        division: 'Keuangan',
        mode: 'WFO',
        entered: '2026-11-02T07:55:00+08:00',
        exited: '2026-11-02T16:00:00+08:00',
      },
      {
        uid: emp.id,
        nip: emp.nip,
        name: emp.name,
        division: 'Keuangan',
        mode: 'WFH',
        entered: '2026-11-03T08:20:00+08:00',
        exited: '2026-11-03T16:25:00+08:00',
      },
      {
        uid: emp.id,
        nip: emp.nip,
        name: emp.name,
        division: 'Keuangan',
        mode: 'WFO',
        entered: '2026-11-04T08:45:00+08:00',
        exited: '2026-11-04T16:00:00+08:00',
      },
    ],
    requests: [
      {
        id: 'r1',
        uid: emp.id,
        nip: emp.nip,
        name: emp.name,
        type: 'Cuti Tahunan',
        reason: 'Acara keluarga',
        startDate: '2026-11-05',
        endDate: '2026-11-05',
        daysCount: 1,
        date: '2026-11-05',
        status: 'Disetujui',
      },
    ],
    holidays: [],
    year: 2026,
    month: 11,
    todayWitaKey: '2026-11-06',
  });

  assert.equal(res.presentDays, 3);
  assert.equal(res.approvedLeaveDays, 1);
  assert.equal(res.alphaDays, 0);
  assert.equal(res.deductionPercent, 1);

  // Employee with ZERO records across 4 past workdays must receive 4 * 3% = 12% Alpha deduction (NOT 0%!)
  const absentRes = calculateEmployeeMonthlyTukin({
    employee: emp,
    records: [],
    requests: [],
    holidays: [],
    year: 2026,
    month: 11,
    todayWitaKey: '2026-11-06',
  });
  assert.equal(absentRes.alphaDays, 4);
  assert.equal(absentRes.deductionPercent, 12);
  assert.equal(tierDeductionPercent(95), 1.5);

  const missed = evaluateRecordTiming(
    { name: 'A', division: 'K', mode: 'WFO', entered: '2026-11-02T07:50:00+08:00', exited: null },
    '2026-11-06'
  );
  assert.equal(missed.status, 'Tidak Absen Pulang');
});
