import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { createUserService } from './user_service.js';
import { createPinService } from './pin_service.js';
import { createAttendanceService } from './attendance_service.js';

initializeApp();

const initialPassword = defineSecret('INITIAL_USER_PASSWORD');
const auth = getAuth();
const db = getFirestore();

const userService = createUserService({
  auth,
  db,
  initialPassword: () => initialPassword.value(),
});
const pinService = createPinService({ db });
const attendanceService = createAttendanceService({ db });

const secretOptions = { region: 'asia-southeast2', secrets: [initialPassword], maxInstances: 5 };
const standardOptions = { region: 'asia-southeast2', maxInstances: 5 };

export const createManagedUser = onCall(secretOptions, (request) => userService.createManagedUser(request));
export const updateManagedUser = onCall(standardOptions, (request) => userService.updateManagedUser(request));
export const setUserActive = onCall(standardOptions, (request) => userService.setUserActive(request));
export const resetUserPassword = onCall(secretOptions, (request) => userService.resetUserPassword(request));
export const completeInitialPasswordChange = onCall(secretOptions, (request) =>
  userService.completeInitialPasswordChange(request)
);
export const setAttendancePin = onCall(standardOptions, (request) => pinService.setAttendancePin(request));
export const verifyAttendancePin = onCall(standardOptions, (request) => pinService.verifyAttendancePin(request));
export const recordAttendance = onCall(standardOptions, (request) => attendanceService.recordAttendance(request));
