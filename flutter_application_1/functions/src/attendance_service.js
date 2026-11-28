import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { defaultWorkHours, resolveSubdepartmentSlug, resolveUnitDisplayName } from './organization.js';
import { verifyOwnProfile } from './user_service.js';
import { verifyStoredPin } from './pin_service.js';

const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MAX_ACCEPTABLE_GPS_ACCURACY_METERS = 150;

export function toWitaParts(date) {
  const shifted = new Date(date.getTime() + WITA_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();
  const second = shifted.getUTCSeconds();
  const weekday = shifted.getUTCDay(); // 0=Sun..6=Sat
  const pad = (n) => String(n).padStart(2, '0');
  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday,
    dayName: DAY_NAMES_ID[weekday],
    dateKey: `${year}-${pad(month)}-${pad(day)}`,
    iso: `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}+08:00`,
  };
}

export function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWfhAllowed(dayName, subdepartmentId, wfhSchedule) {
  const slug = resolveSubdepartmentSlug(subdepartmentId);
  if (!slug || !wfhSchedule || typeof wfhSchedule !== 'object') return false;
  const days = wfhSchedule[slug];
  return Array.isArray(days) && days.includes(dayName);
}

export function computeWorkedMinutes(enteredDate, exitedDate) {
  if (!enteredDate || !exitedDate) return 0;
  const startMs = enteredDate.getTime();
  const endMs = exitedDate.getTime();
  if (endMs <= startMs) return 0;

  const p = toWitaParts(enteredDate);
  const isFriday = p.weekday === 5;
  const pauseStartUtc = Date.UTC(p.year, p.month - 1, p.day, isFriday ? 11 : 12, isFriday ? 30 : 0) - WITA_OFFSET_MS;
  const pauseEndUtc = Date.UTC(p.year, p.month - 1, p.day, 13, 0) - WITA_OFFSET_MS;
  const overlap = Math.max(0, Math.min(endMs, pauseEndUtc) - Math.max(startMs, pauseStartUtc));
  return Math.max(0, Math.floor((endMs - startMs - overlap) / 60000));
}

export function evaluateAttendanceStatus({ enteredDate, exitedDate = null, workHours = defaultWorkHours }) {
  const wh = { ...defaultWorkHours, ...(workHours || {}) };
  const inParts = toWitaParts(enteredDate);
  const startCutoffMin = wh.startHour * 60 + wh.startMinute + (wh.toleranceMinutes || 0);
  const enteredMin = inParts.hour * 60 + inParts.minute;
  const lateMinutes = Math.max(0, enteredMin - startCutoffMin);

  let earlyLeaveMinutes = 0;
  let workedMinutes = 0;
  if (exitedDate) {
    const outParts = toWitaParts(exitedDate);
    const isFriday = inParts.weekday === 5;
    const endTargetMin = isFriday
      ? wh.endHourFri * 60 + wh.endMinuteFri
      : wh.endHourMonThu * 60 + wh.endMinuteMonThu;
    const exitedMin = outParts.hour * 60 + outParts.minute;
    if (outParts.dateKey === inParts.dateKey) {
      earlyLeaveMinutes = Math.max(0, endTargetMin - exitedMin);
    }
    workedMinutes = computeWorkedMinutes(enteredDate, exitedDate);
  }

  let status = 'Tepat Waktu';
  if (lateMinutes > 0 && earlyLeaveMinutes > 0) {
    status = 'Terlambat & Pulang Cepat';
  } else if (lateMinutes > 0) {
    status = 'Terlambat';
  } else if (earlyLeaveMinutes > 0) {
    status = 'Pulang Cepat';
  }

  return { lateMinutes, earlyLeaveMinutes, workedMinutes, status };
}

function validateSelfieUrl(url) {
  if (url === undefined || url === null || url === '') return null;
  if (typeof url !== 'string' || url.length > 2000 || !/^https:\/\/.+/i.test(url)) {
    throw new HttpsError('invalid-argument', 'URL bukti foto selfie tidak valid.');
  }
  return url;
}

export function createAttendanceService({ db, clock = () => new Date(), fieldValue = FieldValue }) {
  return {
    async recordAttendance(request) {
      const { profile } = await verifyOwnProfile(db, request, { ready: true });
      const uid = request.auth.uid;
      const action = request.data?.action;
      const authMethod = request.data?.authMethod;

      if (action !== 'check_in' && action !== 'check_out') {
        throw new HttpsError('invalid-argument', 'Jenis presensi harus check_in atau check_out.');
      }
      if (authMethod !== 'biometric' && authMethod !== 'pin') {
        throw new HttpsError('invalid-argument', 'Metode autentikasi tidak valid.');
      }

      const nowDate = clock();
      const wita = toWitaParts(nowDate);

      if (wita.weekday === 0 || wita.weekday === 6) {
        throw new HttpsError('failed-precondition', 'Presensi tidak tersedia pada hari libur akhir pekan.');
      }

      const settingsSnap = await db.doc('settings/general').get();
      const settings = settingsSnap.exists ? settingsSnap.data() : {};
      const holidays = Array.isArray(settings?.holidays) ? settings.holidays : [];
      const holidayToday = holidays.find((h) => h && h.date === wita.dateKey);
      if (holidayToday) {
        throw new HttpsError(
          'failed-precondition',
          `Presensi dinonaktifkan pada hari libur: ${holidayToday.name || wita.dateKey}.`
        );
      }

      if (authMethod === 'pin') {
        await verifyStoredPin({
          db,
          uid,
          pin: String(request.data?.pin ?? '').trim(),
          now: () => nowDate.getTime(),
          fieldValue,
        });
      }

      const wfhToday = isWfhAllowed(wita.dayName, profile.subdepartmentId, settings?.wfhSchedule);
      const mode = wfhToday ? 'WFH' : 'WFO';

      const lat = typeof request.data?.latitude === 'number' ? request.data.latitude : null;
      const lng = typeof request.data?.longitude === 'number' ? request.data.longitude : null;
      const accuracy = typeof request.data?.accuracyMeters === 'number' ? request.data.accuracyMeters : null;
      const isMocked = request.data?.isMocked === true;

      if (isMocked) {
        throw new HttpsError('permission-denied', 'Lokasi tiruan (Fake GPS) terdeteksi. Presensi ditolak.');
      }

      let distanceMeters = 0;
      if (mode === 'WFO') {
        if (typeof settings?.latitude !== 'number' || typeof settings?.longitude !== 'number') {
          throw new HttpsError('failed-precondition', 'Titik koordinat kantor belum diatur oleh administrator.');
        }
        if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new HttpsError('invalid-argument', 'Koordinat GPS wajib tersedia untuk presensi WFO.');
        }
        if (accuracy !== null && accuracy > MAX_ACCEPTABLE_GPS_ACCURACY_METERS) {
          throw new HttpsError(
            'failed-precondition',
            `Akurasi GPS terlalu rendah (${Math.round(accuracy)} m). Pindah ke area terbuka lalu coba lagi.`
          );
        }
        const radius = typeof settings?.radius === 'number' && settings.radius > 0 ? settings.radius : 100;
        distanceMeters = Math.round(haversineMeters(lat, lng, settings.latitude, settings.longitude));
        if (distanceMeters > radius) {
          throw new HttpsError(
            'failed-precondition',
            `Anda berada di luar radius kantor (${distanceMeters} m dari kantor, batas ${Math.round(radius)} m).`
          );
        }
      }

      const selfieUrl = validateSelfieUrl(request.data?.selfieUrl);
      const docId = `${uid}_${wita.dateKey}`;
      const docRef = db.collection('presensi').doc(docId);
      const workHours = settings?.workHours || defaultWorkHours;
      const unitDisplay = resolveUnitDisplayName(
        profile.departmentId,
        profile.subdepartmentId,
        profile.positionLabel
      );

      let responsePayload;
      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(docRef);
        const existing = snap.exists ? snap.data() : null;

        if (action === 'check_in') {
          if (existing?.masukIso || existing?.masukAt) {
            throw new HttpsError('already-exists', 'Anda sudah mencatat presensi masuk hari ini.');
          }
          const evalRes = evaluateAttendanceStatus({ enteredDate: nowDate, workHours });
          const payload = {
            uid,
            userId: uid,
            nip: profile.nip,
            nama: profile.name,
            unit: unitDisplay,
            departmentId: profile.departmentId || '',
            subdepartmentId: profile.subdepartmentId || null,
            mode,
            dateKey: wita.dateKey,
            masukAt: fieldValue.serverTimestamp(),
            masuk: wita.iso,
            masukIso: wita.iso,
            keluarAt: null,
            keluar: null,
            keluarIso: null,
            lateMinutes: evalRes.lateMinutes,
            earlyLeaveMinutes: 0,
            workedMinutes: 0,
            status: evalRes.status,
            latitude: lat,
            longitude: lng,
            distanceMeters,
            accuracyMeters: accuracy,
            checkInSelfieUrl: selfieUrl,
            checkOutSelfieUrl: null,
            authMethod,
            waktu: fieldValue.serverTimestamp(),
            updatedAt: fieldValue.serverTimestamp(),
          };
          transaction.set(docRef, payload);
          responsePayload = {
            id: docId,
            action,
            mode,
            dateKey: wita.dateKey,
            masukIso: wita.iso,
            keluarIso: null,
            distanceMeters,
            ...evalRes,
          };
        } else {
          if (!existing || (!existing.masukIso && !existing.masuk)) {
            throw new HttpsError('failed-precondition', 'Anda belum mencatat presensi masuk hari ini.');
          }
          if (existing.keluarIso || existing.keluar) {
            throw new HttpsError('already-exists', 'Presensi keluar hari ini sudah tercatat.');
          }
          const enteredDate = existing.masukAt?.toDate
            ? existing.masukAt.toDate()
            : new Date(existing.masukIso || existing.masuk);
          const evalRes = evaluateAttendanceStatus({
            enteredDate,
            exitedDate: nowDate,
            workHours,
          });
          transaction.update(docRef, {
            keluarAt: fieldValue.serverTimestamp(),
            keluar: wita.iso,
            keluarIso: wita.iso,
            earlyLeaveMinutes: evalRes.earlyLeaveMinutes,
            workedMinutes: evalRes.workedMinutes,
            durasiDetik: evalRes.workedMinutes * 60,
            status: evalRes.status,
            checkOutLatitude: lat,
            checkOutLongitude: lng,
            checkOutDistanceMeters: distanceMeters,
            checkOutSelfieUrl: selfieUrl,
            checkOutAuthMethod: authMethod,
            updatedAt: fieldValue.serverTimestamp(),
          });
          responsePayload = {
            id: docId,
            action,
            mode: existing.mode || mode,
            dateKey: wita.dateKey,
            masukIso: existing.masukIso || existing.masuk,
            keluarIso: wita.iso,
            distanceMeters,
            ...evalRes,
          };
        }
      });

      return responsePayload;
    },
  };
}
