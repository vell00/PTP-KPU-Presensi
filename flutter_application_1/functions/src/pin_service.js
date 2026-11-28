import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { verifyOwnProfile } from './user_service.js';

const WEAK_PINS = new Set([
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
  '123456',
  '654321',
  '012345',
  '543210',
]);

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function isValidPinFormat(pin) {
  return typeof pin === 'string' && /^\d{6}$/.test(pin);
}

export function isWeakPin(pin) {
  return WEAK_PINS.has(pin);
}

export function hashPin(pin, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(pin, salt, 32).toString('hex');
  return { hash, salt };
}

export function comparePinHash(pin, expectedHash, salt) {
  if (!expectedHash || !salt) return false;
  const candidate = Buffer.from(scryptSync(pin, salt, 32).toString('hex'), 'hex');
  const stored = Buffer.from(expectedHash, 'hex');
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

export async function verifyStoredPin({ db, uid, pin, now = () => Date.now(), fieldValue = FieldValue }) {
  if (!isValidPinFormat(pin)) {
    throw new HttpsError('invalid-argument', 'PIN presensi harus berupa 6 digit angka.');
  }
  const secretRef = db.collection('userSecrets').doc(uid);
  const secretSnap = await secretRef.get();
  const secret = secretSnap.data();

  if (!secret?.pinHash || !secret?.pinSalt) {
    throw new HttpsError('failed-precondition', 'PIN presensi belum diatur. Buat PIN terlebih dahulu.');
  }

  const nowMs = now();
  const lockedUntil = typeof secret.pinLockedUntilMs === 'number' ? secret.pinLockedUntilMs : 0;
  if (lockedUntil > nowMs) {
    const remainingMinutes = Math.max(1, Math.ceil((lockedUntil - nowMs) / 60000));
    throw new HttpsError(
      'resource-exhausted',
      `PIN terkunci sementara karena terlalu banyak percobaan salah. Coba lagi dalam ${remainingMinutes} menit.`
    );
  }

  const matched = comparePinHash(pin, secret.pinHash, secret.pinSalt);
  if (!matched) {
    const nextAttempts = (Number(secret.failedPinAttempts) || 0) + 1;
    const shouldLock = nextAttempts >= MAX_FAILED_ATTEMPTS;
    await secretRef.set(
      {
        failedPinAttempts: shouldLock ? 0 : nextAttempts,
        pinLockedUntilMs: shouldLock ? nowMs + LOCKOUT_MS : 0,
        updatedAt: fieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    if (shouldLock) {
      throw new HttpsError(
        'resource-exhausted',
        'PIN salah 5 kali berturut-turut. Verifikasi PIN dikunci selama 15 menit.'
      );
    }
    throw new HttpsError(
      'permission-denied',
      `PIN presensi salah (${MAX_FAILED_ATTEMPTS - nextAttempts} percobaan tersisa).`
    );
  }

  if ((Number(secret.failedPinAttempts) || 0) > 0 || lockedUntil > 0) {
    await secretRef.set(
      {
        failedPinAttempts: 0,
        pinLockedUntilMs: 0,
        updatedAt: fieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  return true;
}

export function createPinService({ db, now = () => Date.now(), fieldValue = FieldValue }) {
  return {
    async setAttendancePin(request) {
      const { ref } = await verifyOwnProfile(db, request, { ready: true });
      const uid = request.auth.uid;
      const newPin = String(request.data?.newPin ?? '').trim();
      const currentPin = request.data?.currentPin != null ? String(request.data.currentPin).trim() : null;

      if (!isValidPinFormat(newPin)) {
        throw new HttpsError('invalid-argument', 'PIN baru harus terdiri dari 6 digit angka.');
      }
      if (isWeakPin(newPin)) {
        throw new HttpsError(
          'invalid-argument',
          'PIN terlalu mudah ditebak (hindari angka berulang atau berurutan seperti 123456).'
        );
      }

      const secretRef = db.collection('userSecrets').doc(uid);
      const secretSnap = await secretRef.get();
      const existing = secretSnap.data();

      if (existing?.pinHash && existing?.pinSalt) {
        if (!currentPin) {
          throw new HttpsError('invalid-argument', 'Masukkan PIN saat ini untuk mengganti PIN.');
        }
        await verifyStoredPin({ db, uid, pin: currentPin, now, fieldValue });
        if (currentPin === newPin) {
          throw new HttpsError('invalid-argument', 'PIN baru harus berbeda dari PIN saat ini.');
        }
      }

      const { hash, salt } = hashPin(newPin);
      await secretRef.set({
        pinHash: hash,
        pinSalt: salt,
        failedPinAttempts: 0,
        pinLockedUntilMs: 0,
        updatedAt: fieldValue.serverTimestamp(),
      });

      await ref.update({
        hasPin: true,
        pin: fieldValue.delete(),
        updatedAt: fieldValue.serverTimestamp(),
      });

      return { hasPin: true };
    },

    async verifyAttendancePin(request) {
      await verifyOwnProfile(db, request, { ready: true });
      const pin = String(request.data?.pin ?? '').trim();
      await verifyStoredPin({ db, uid: request.auth.uid, pin, now, fieldValue });
      return { verified: true };
    },
  };
}
