import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUserService, validateAssignment } from '../src/user_service.js';
import { createPinService, hashPin, comparePinHash } from '../src/pin_service.js';
import {
  createAttendanceService,
  isWfhAllowed,
  toWitaParts,
  haversineMeters,
  computeWorkedMinutes,
  evaluateAttendanceStatus,
} from '../src/attendance_service.js';

function createFakeDb(initialDocs = {}) {
  const store = new Map(Object.entries(initialDocs).map(([k, v]) => [k, structuredClone(v)]));
  const makeRef = (path) => ({
    path,
    async get() {
      const val = store.get(path);
      return { exists: val !== undefined, data: () => (val ? structuredClone(val) : undefined), ref: makeRef(path) };
    },
    async create(data) {
      if (store.has(path)) throw Object.assign(new Error('exists'), { code: 'already-exists' });
      store.set(path, structuredClone(data));
    },
    async set(data, opts) {
      if (opts?.merge && store.has(path)) {
        store.set(path, { ...store.get(path), ...structuredClone(data) });
      } else {
        store.set(path, structuredClone(data));
      }
    },
    async update(data) {
      if (!store.has(path)) throw Object.assign(new Error('not found'), { code: 'not-found' });
      const cur = { ...store.get(path) };
      for (const [k, v] of Object.entries(data)) {
        if (v && v.__delete) delete cur[k];
        else cur[k] = structuredClone(v);
      }
      store.set(path, cur);
    },
    async delete() {
      store.delete(path);
    },
  });
  return {
    _store: store,
    doc: (p) => makeRef(p),
    collection: (col) => ({ doc: (id) => makeRef(`${col}/${id}`) }),
    async runTransaction(fn) {
      const tx = {
        get: (ref) => ref.get(),
        set: (ref, data) => ref.set(data),
        update: (ref, data) => ref.update(data),
      };
      return fn(tx);
    },
  };
}

const fakeFieldValue = {
  serverTimestamp: () => ({ __serverTimestamp: true }),
  delete: () => ({ __delete: true }),
};

test('validateAssignment enforces hierarchy and supports positionLabel', () => {
  const valid = validateAssignment({
    nip: '199001012020011001',
    name: 'Budi Santoso',
    role: 'staff',
    departmentId: 'keuangan_umum_logistik',
    subdepartmentId: 'keuangan',
    positionLabel: 'Analis Keuangan',
  });
  assert.equal(valid.positionLabel, 'Analis Keuangan');
  assert.throws(() =>
    validateAssignment({
      nip: '199001012020011001',
      name: 'Budi',
      role: 'kepala_bagian',
      departmentId: 'keuangan_umum_logistik',
      subdepartmentId: 'keuangan',
    })
  );
});

test('pin_service hashes PIN securely, rejects weak PINs, and locks after 5 wrong attempts', async () => {
  const { hash, salt } = hashPin('482913');
  assert.equal(comparePinHash('482913', hash, salt), true);
  assert.equal(comparePinHash('482914', hash, salt), false);

  const db = createFakeDb({
    'users/nip_199001012020011001': {
      uid: 'nip_199001012020011001',
      nip: '199001012020011001',
      name: 'Pegawai Uji',
      active: true,
      mustChangePassword: false,
      sessionVersion: 'sv-1',
    },
  });
  let clockMs = 1_700_000_000_000;
  const pinService = createPinService({ db, now: () => clockMs, fieldValue: fakeFieldValue });
  const reqBase = { auth: { uid: 'nip_199001012020011001', token: { sessionVersion: 'sv-1' } } };

  await assert.rejects(
    pinService.setAttendancePin({ ...reqBase, data: { newPin: '123456' } }),
    (e) => e.code === 'invalid-argument'
  );

  await pinService.setAttendancePin({ ...reqBase, data: { newPin: '482913' } });
  const userDoc = db._store.get('users/nip_199001012020011001');
  assert.equal(userDoc.hasPin, true);
  assert.equal(userDoc.pin, undefined);
  assert.ok(db._store.get('userSecrets/nip_199001012020011001').pinHash);

  for (let i = 0; i < 4; i++) {
    await assert.rejects(
      pinService.verifyAttendancePin({ ...reqBase, data: { pin: '999999' } }),
      (e) => e.code === 'permission-denied'
    );
  }
  await assert.rejects(
    pinService.verifyAttendancePin({ ...reqBase, data: { pin: '999999' } }),
    (e) => e.code === 'resource-exhausted'
  );
  // Locked even for correct PIN until 15 min passes
  await assert.rejects(
    pinService.verifyAttendancePin({ ...reqBase, data: { pin: '482913' } }),
    (e) => e.code === 'resource-exhausted'
  );
  clockMs += 16 * 60 * 1000;
  const ok = await pinService.verifyAttendancePin({ ...reqBase, data: { pin: '482913' } });
  assert.equal(ok.verified, true);
});

test('attendance_service enforces WITA server time, holidays, geofence, WFH schedule, and ISHOMA', async () => {
  // 2026-11-26 is Thursday; 08:15 WITA = 00:15 UTC
  const thuMorning = new Date('2026-11-26T00:15:00.000Z');
  const parts = toWitaParts(thuMorning);
  assert.equal(parts.dateKey, '2026-11-26');
  assert.equal(parts.hour, 8);
  assert.equal(parts.minute, 15);
  assert.equal(parts.dayName, 'Kamis');

  const thuAfternoon = new Date('2026-11-26T08:00:00.000Z'); // 16:00 WITA
  const worked = computeWorkedMinutes(thuMorning, thuAfternoon);
  assert.equal(worked, 405); // 7h45m - 1h ISHOMA = 6h45m = 405m

  const statusRes = evaluateAttendanceStatus({ enteredDate: thuMorning, exitedDate: thuAfternoon });
  assert.equal(statusRes.lateMinutes, 15);
  assert.equal(statusRes.earlyLeaveMinutes, 0);
  assert.equal(statusRes.status, 'Terlambat');
  assert.ok(haversineMeters(1.4748, 124.8421, 1.4748, 124.8421) < 1);
  assert.equal(isWfhAllowed('Jumat', 'keuangan', { keuangan: ['Selasa', 'Jumat'] }), true);
  assert.equal(isWfhAllowed('Jumat', 'Keuangan', { keuangan: ['Selasa', 'Jumat'] }), true);
  assert.equal(isWfhAllowed('Kamis', 'Keuangan', { keuangan: ['Selasa', 'Jumat'] }), false);

  const db = createFakeDb({
    'users/nip_199001012020011001': {
      uid: 'nip_199001012020011001',
      nip: '199001012020011001',
      name: 'Pegawai Uji',
      role: 'staff',
      departmentId: 'keuangan_umum_logistik',
      subdepartmentId: 'keuangan',
      active: true,
      mustChangePassword: false,
      sessionVersion: 'sv-1',
    },
    'settings/general': {
      latitude: 1.4748,
      longitude: 124.8421,
      radius: 100,
      wfhSchedule: { keuangan: ['Selasa', 'Jumat'] },
      holidays: [{ date: '2026-12-25', name: 'Hari Raya Natal' }],
    },
  });

  const authReq = { auth: { uid: 'nip_199001012020011001', token: { sessionVersion: 'sv-1' } } };

  // Fake GPS rejected
  const svcThu = createAttendanceService({ db, clock: () => thuMorning, fieldValue: fakeFieldValue });
  await assert.rejects(
    svcThu.recordAttendance({
      ...authReq,
      data: { action: 'check_in', authMethod: 'biometric', latitude: 1.4748, longitude: 124.8421, isMocked: true },
    }),
    (e) => e.code === 'permission-denied'
  );

  // Outside geofence rejected on WFO day (Thursday)
  await assert.rejects(
    svcThu.recordAttendance({
      ...authReq,
      data: { action: 'check_in', authMethod: 'biometric', latitude: 1.49, longitude: 124.86, accuracyMeters: 15 },
    }),
    (e) => e.code === 'failed-precondition'
  );

  // Valid WFO check-in
  const inRes = await svcThu.recordAttendance({
    ...authReq,
    data: {
      action: 'check_in',
      authMethod: 'biometric',
      latitude: 1.4749,
      longitude: 124.8421,
      accuracyMeters: 12,
      selfieUrl: 'https://firebasestorage.googleapis.com/v0/b/test/o/selfie.jpg',
    },
  });
  assert.equal(inRes.mode, 'WFO');
  assert.equal(inRes.lateMinutes, 15);
  assert.equal(inRes.status, 'Terlambat');

  // Duplicate check-in rejected
  await assert.rejects(
    svcThu.recordAttendance({
      ...authReq,
      data: { action: 'check_in', authMethod: 'biometric', latitude: 1.4749, longitude: 124.8421, accuracyMeters: 12 },
    }),
    (e) => e.code === 'already-exists'
  );

  // Valid check-out at 15:30 WITA (30 min early)
  const thuEarlyOut = new Date('2026-11-26T07:30:00.000Z');
  const svcOut = createAttendanceService({ db, clock: () => thuEarlyOut, fieldValue: fakeFieldValue });
  const outRes = await svcOut.recordAttendance({
    ...authReq,
    data: { action: 'check_out', authMethod: 'biometric', latitude: 1.4749, longitude: 124.8421, accuracyMeters: 10 },
  });
  assert.equal(outRes.earlyLeaveMinutes, 30);
  assert.equal(outRes.status, 'Terlambat & Pulang Cepat');

  // Holiday blocked (2026-12-25 is Friday)
  const svcHoliday = createAttendanceService({
    db,
    clock: () => new Date('2026-12-25T00:00:00.000Z'),
    fieldValue: fakeFieldValue,
  });
  await assert.rejects(
    svcHoliday.recordAttendance({ ...authReq, data: { action: 'check_in', authMethod: 'biometric' } }),
    (e) => e.code === 'failed-precondition'
  );
});

test('user_service rejects missing sessionVersion and allows admin deactivation', async () => {
  const usersAuth = new Map([
    ['nip_199001012020011001', { uid: 'nip_199001012020011001', disabled: false, customClaims: { sessionVersion: 'sv-1' } }],
  ]);
  const fakeAuth = {
    async updateUser(uid, patch) {
      usersAuth.set(uid, { ...usersAuth.get(uid), ...patch });
    },
    async getUser(uid) {
      return usersAuth.get(uid);
    },
    async setCustomUserClaims(uid, claims) {
      usersAuth.set(uid, { ...usersAuth.get(uid), customClaims: claims });
    },
    async revokeRefreshTokens() {},
  };
  const db = createFakeDb({
    'users/admin-1': { isAdmin: true, active: true, mustChangePassword: false, sessionVersion: 'adm-1' },
    'users/legacy-no-sv': { isAdmin: true, active: true, mustChangePassword: false },
    'users/nip_199001012020011001': {
      uid: 'nip_199001012020011001',
      nip: '199001012020011001',
      name: 'Pegawai Uji',
      active: true,
      mustChangePassword: false,
      sessionVersion: 'sv-1',
    },
  });
  const svc = createUserService({ auth: fakeAuth, db, initialPassword: () => 'InitialPass123', fieldValue: fakeFieldValue });

  // Missing sessionVersion on profile must NOT pass undefined !== undefined check
  await assert.rejects(
    svc.setUserActive({ auth: { uid: 'legacy-no-sv', token: {} }, data: { uid: 'nip_199001012020011001', active: false } }),
    (e) => e.code === 'permission-denied'
  );

  const res = await svc.setUserActive({
    auth: { uid: 'admin-1', token: { sessionVersion: 'adm-1' } },
    data: { uid: 'nip_199001012020011001', active: false },
  });
  assert.equal(res.active, false);
  assert.equal(usersAuth.get('nip_199001012020011001').disabled, true);
  assert.equal(db._store.get('users/nip_199001012020011001').active, false);
});
