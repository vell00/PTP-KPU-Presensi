'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Attendance,
  Employee,
  HolidayItem,
  LeaveRequest,
  WfhSchedule,
  WorkHoursPolicy,
  WorkspaceData,
} from '@/types';
import { INITIAL_DATA, resolveUnitDisplay } from './constants';
import { DEFAULT_WORK_HOURS } from './attendance-policy';
import { db, functions, isFirebaseConfigured } from './firebase';
import { useAdminAuth } from './auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export interface ActionResult {
  success: boolean;
  message?: string;
}

export interface CreateEmployeeInput {
  nip: string;
  name: string;
  role: 'kepala_bagian' | 'kepala_sub_bagian' | 'staff';
  departmentId: string;
  subdepartmentId: string | null;
  positionLabel?: string;
}

export interface UpdateEmployeeInput extends CreateEmployeeInput {
  uid: string;
}

interface WorkspaceContextType {
  data: WorkspaceData;
  isLoaded: boolean;
  isRefreshing: boolean;
  syncError: string | null;
  lastSyncedAt: Date | null;
  addEmployee: (input: CreateEmployeeInput) => Promise<ActionResult>;
  updateEmployee: (input: UpdateEmployeeInput) => Promise<ActionResult>;
  setEmployeeActive: (uid: string, active: boolean) => Promise<ActionResult>;
  resetEmployeePassword: (uid: string) => Promise<ActionResult>;
  reviewLeaveRequest: (
    requestId: string,
    status: 'Disetujui' | 'Ditolak',
    reviewNote?: string
  ) => Promise<ActionResult>;
  updateSettings: (settings: {
    latitude: number | null;
    longitude: number | null;
    radius: number;
    wfhSchedule: WfhSchedule;
    workHours: WorkHoursPolicy;
    holidays: HolidayItem[];
  }) => Promise<ActionResult>;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

function extractFirebaseError(error: unknown, fallback: string): string {
  const err = error as { message?: string; code?: string };
  if (err?.message) {
    return err.message.replace(/^Firebase:\s*/i, '').replace(/\s*\(functions\/[^)]+\)\.?$/i, '');
  }
  return fallback;
}

function mapUserDoc(id: string, d: Record<string, unknown>): Employee {
  const roleRaw = String(d.role || 'staff');
  const role: Employee['role'] =
    roleRaw === 'kepala_bagian' || roleRaw === 'kepala_sub_bagian' ? roleRaw : 'staff';
  const legacyPin = typeof d.pin === 'string' && d.pin.length === 6;
  return {
    id,
    nip: String(d.nip || ''),
    name: String(d.name || d.nip || 'Pegawai'),
    role,
    departmentId: String(d.departmentId || 'keuangan_umum_logistik'),
    subdepartmentId: d.subdepartmentId != null ? String(d.subdepartmentId) : null,
    positionLabel: typeof d.positionLabel === 'string' ? d.positionLabel : undefined,
    active: d.active !== false,
    isAdmin: d.isAdmin === true,
    mustChangePassword: d.mustChangePassword === true,
    hasPin: d.hasPin === true || legacyPin,
  };
}

function mapPresensiDoc(id: string, d: Record<string, unknown>): Attendance {
  const tsToIso = (val: unknown): string | null => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
      return (val as { toDate: () => Date }).toDate().toISOString();
    }
    return null;
  };
  const entered =
    (typeof d.masukIso === 'string' && d.masukIso) ||
    (typeof d.masuk === 'string' && d.masuk) ||
    (typeof d.entered === 'string' && d.entered) ||
    tsToIso(d.masukAt) ||
    tsToIso(d.waktu) ||
    new Date().toISOString();
  const exited =
    (typeof d.keluarIso === 'string' && d.keluarIso) ||
    (typeof d.keluar === 'string' && d.keluar) ||
    (typeof d.exited === 'string' && d.exited) ||
    tsToIso(d.keluarAt) ||
    null;

  return {
    id,
    uid: typeof d.uid === 'string' ? d.uid : typeof d.userId === 'string' ? d.userId : undefined,
    nip: typeof d.nip === 'string' ? d.nip : undefined,
    name: String(d.nama || d.name || 'Pegawai'),
    division: String(d.unit || d.division || 'Sekretariat KPU Sulut'),
    departmentId: typeof d.departmentId === 'string' ? d.departmentId : undefined,
    subdepartmentId: d.subdepartmentId != null ? String(d.subdepartmentId) : null,
    mode: d.mode === 'WFH' ? 'WFH' : 'WFO',
    dateKey: typeof d.dateKey === 'string' ? d.dateKey : undefined,
    entered,
    exited,
    lateMinutes: typeof d.lateMinutes === 'number' ? d.lateMinutes : undefined,
    earlyLeaveMinutes: typeof d.earlyLeaveMinutes === 'number' ? d.earlyLeaveMinutes : undefined,
    workedMinutes: typeof d.workedMinutes === 'number' ? d.workedMinutes : undefined,
    status: typeof d.status === 'string' ? d.status : undefined,
    latitude: typeof d.latitude === 'number' ? d.latitude : null,
    longitude: typeof d.longitude === 'number' ? d.longitude : null,
    distanceMeters: typeof d.distanceMeters === 'number' ? d.distanceMeters : null,
    accuracyMeters: typeof d.accuracyMeters === 'number' ? d.accuracyMeters : null,
    checkInSelfieUrl: typeof d.checkInSelfieUrl === 'string' ? d.checkInSelfieUrl : null,
    checkOutSelfieUrl: typeof d.checkOutSelfieUrl === 'string' ? d.checkOutSelfieUrl : null,
    authMethod: typeof d.authMethod === 'string' ? d.authMethod : undefined,
  };
}

function mapRequestDoc(id: string, d: Record<string, unknown>): LeaveRequest {
  const startDate = String(d.startDate || d.date || '');
  const endDate = String(d.endDate || startDate);
  const statusRaw = String(d.status || 'Menunggu');
  const status: LeaveRequest['status'] =
    statusRaw === 'Disetujui' || statusRaw === 'Ditolak' ? statusRaw : 'Menunggu';
  const tsToIso = (val: unknown): string | null => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
      return (val as { toDate: () => Date }).toDate().toISOString();
    }
    return null;
  };
  return {
    id,
    uid: typeof d.uid === 'string' ? d.uid : undefined,
    nip: typeof d.nip === 'string' ? d.nip : undefined,
    name: String(d.name || 'Pegawai'),
    unit: typeof d.unit === 'string' ? d.unit : undefined,
    type: String(d.type || 'Izin'),
    reason: String(d.reason || ''),
    startDate,
    endDate,
    daysCount: typeof d.daysCount === 'number' && d.daysCount > 0 ? d.daysCount : 1,
    date: startDate,
    attachmentUrl: typeof d.attachmentUrl === 'string' ? d.attachmentUrl : null,
    status,
    reviewNote: typeof d.reviewNote === 'string' ? d.reviewNote : null,
    reviewedBy: typeof d.reviewedBy === 'string' ? d.reviewedBy : null,
    reviewedAt: tsToIso(d.reviewedAt),
    createdAt: tsToIso(d.createdAt),
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAdminAuth();
  const [data, setData] = useState<WorkspaceData>(INITIAL_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hadir_kpu_workspace');
    }
    if (!isFirebaseConfigured || !user) {
      setIsLoaded(true);
      return;
    }

    let settled = 0;
    const markReady = () => {
      settled++;
      if (settled >= 4) {
        setIsLoaded(true);
      }
      setLastSyncedAt(new Date());
    };

    const handleSnapError = (label: string) => (err: Error) => {
      console.error(`Error realtime ${label}:`, err);
      setSyncError(`Gagal menyinkronkan ${label}: ${err.message}`);
      markReady();
    };

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const employees = snap.docs
          .map((d) => mapUserDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
        setData((prev) => ({ ...prev, employees }));
        setSyncError(null);
        markReady();
      },
      handleSnapError('data pegawai')
    );

    const unsubPresensi = onSnapshot(
      collection(db, 'presensi'),
      (snap) => {
        const records = snap.docs
          .map((d) => mapPresensiDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => new Date(b.entered).getTime() - new Date(a.entered).getTime());
        setData((prev) => ({ ...prev, records }));
        setSyncError(null);
        markReady();
      },
      handleSnapError('catatan presensi')
    );

    const unsubRequests = onSnapshot(
      collection(db, 'requests'),
      (snap) => {
        const requests = snap.docs
          .map((d) => mapRequestDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => (b.createdAt || b.startDate).localeCompare(a.createdAt || a.startDate));
        setData((prev) => ({ ...prev, requests }));
        setSyncError(null);
        markReady();
      },
      handleSnapError('pengajuan izin')
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'general'),
      (snap) => {
        if (snap.exists()) {
          const s = snap.data();
          setData((prev) => ({
            ...prev,
            latitude: typeof s.latitude === 'number' ? s.latitude : INITIAL_DATA.latitude,
            longitude: typeof s.longitude === 'number' ? s.longitude : INITIAL_DATA.longitude,
            radius: typeof s.radius === 'number' ? s.radius : INITIAL_DATA.radius,
            wfhSchedule: (s.wfhSchedule as WfhSchedule) || INITIAL_DATA.wfhSchedule,
            workHours: { ...DEFAULT_WORK_HOURS, ...(s.workHours || {}) },
            holidays: Array.isArray(s.holidays) ? (s.holidays as HolidayItem[]) : INITIAL_DATA.holidays,
          }));
        }
        setSyncError(null);
        markReady();
      },
      handleSnapError('pengaturan kantor')
    );

    return () => {
      unsubUsers();
      unsubPresensi();
      unsubRequests();
      unsubSettings();
    };
  }, [user]);

  const refresh = useCallback(async () => {
    if (!isFirebaseConfigured || !user) return;
    setIsRefreshing(true);
    try {
      const [usersSnap, presensiSnap, requestsSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'presensi')),
        getDocs(collection(db, 'requests')),
        getDoc(doc(db, 'settings', 'general')),
      ]);
      const employees = usersSnap.docs
        .map((d) => mapUserDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
      const records = presensiSnap.docs
        .map((d) => mapPresensiDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.entered).getTime() - new Date(a.entered).getTime());
      const requests = requestsSnap.docs
        .map((d) => mapRequestDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => (b.createdAt || b.startDate).localeCompare(a.createdAt || a.startDate));
      const s = settingsSnap.exists() ? settingsSnap.data() : {};
      setData({
        employees,
        records,
        requests,
        latitude: typeof s.latitude === 'number' ? s.latitude : INITIAL_DATA.latitude,
        longitude: typeof s.longitude === 'number' ? s.longitude : INITIAL_DATA.longitude,
        radius: typeof s.radius === 'number' ? s.radius : INITIAL_DATA.radius,
        wfhSchedule: (s.wfhSchedule as WfhSchedule) || INITIAL_DATA.wfhSchedule,
        workHours: { ...DEFAULT_WORK_HOURS, ...(s.workHours || {}) },
        holidays: Array.isArray(s.holidays) ? (s.holidays as HolidayItem[]) : INITIAL_DATA.holidays,
      });
      setSyncError(null);
      setLastSyncedAt(new Date());
    } catch (e) {
      setSyncError(extractFirebaseError(e, 'Gagal memuat ulang data dari server.'));
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  const addEmployee = useCallback(async (input: CreateEmployeeInput): Promise<ActionResult> => {
    if (!/^\d{18}$/.test(input.nip)) {
      return { success: false, message: 'NIP harus terdiri dari tepat 18 digit angka.' };
    }
    try {
      const callable = httpsCallable<CreateEmployeeInput, { uid: string }>(
        functions,
        'createManagedUser'
      );
      await callable({
        nip: input.nip.trim(),
        name: input.name.trim(),
        role: input.role,
        departmentId: input.departmentId,
        subdepartmentId: input.role === 'kepala_bagian' ? null : input.subdepartmentId,
        positionLabel:
          input.positionLabel?.trim() ||
          resolveUnitDisplay({
            departmentId: input.departmentId,
            subdepartmentId: input.subdepartmentId,
            role: input.role,
          }),
      });
      return {
        success: true,
        message: 'Akun pegawai dibuat. Pegawai wajib mengganti password awal saat pertama masuk.',
      };
    } catch (e) {
      return { success: false, message: extractFirebaseError(e, 'Gagal menambahkan akun pegawai.') };
    }
  }, []);

  const updateEmployee = useCallback(async (input: UpdateEmployeeInput): Promise<ActionResult> => {
    if (!/^\d{18}$/.test(input.nip)) {
      return { success: false, message: 'NIP harus terdiri dari tepat 18 digit angka.' };
    }
    try {
      const callable = httpsCallable<UpdateEmployeeInput, { uid: string }>(
        functions,
        'updateManagedUser'
      );
      await callable({
        uid: input.uid,
        nip: input.nip.trim(),
        name: input.name.trim(),
        role: input.role,
        departmentId: input.departmentId,
        subdepartmentId: input.role === 'kepala_bagian' ? null : input.subdepartmentId,
        positionLabel: input.positionLabel?.trim() || undefined,
      });
      return { success: true };
    } catch (e) {
      return { success: false, message: extractFirebaseError(e, 'Gagal memperbarui data pegawai.') };
    }
  }, []);

  const setEmployeeActive = useCallback(
    async (uid: string, active: boolean): Promise<ActionResult> => {
      try {
        const callable = httpsCallable<{ uid: string; active: boolean }, { uid: string; active: boolean }>(
          functions,
          'setUserActive'
        );
        await callable({ uid, active });
        return { success: true };
      } catch (e) {
        return {
          success: false,
          message: extractFirebaseError(e, 'Gagal mengubah status aktif pegawai.'),
        };
      }
    },
    []
  );

  const resetEmployeePassword = useCallback(async (uid: string): Promise<ActionResult> => {
    try {
      const callable = httpsCallable<{ uid: string }, { uid: string; reset: boolean }>(
        functions,
        'resetUserPassword'
      );
      await callable({ uid });
      return {
        success: true,
        message: 'Kata sandi dikembalikan ke kata sandi awal dan pegawai wajib menggantinya saat masuk.',
      };
    } catch (e) {
      return {
        success: false,
        message: extractFirebaseError(e, 'Gagal mereset kata sandi pegawai.'),
      };
    }
  }, []);

  const reviewLeaveRequest = useCallback(
    async (
      requestId: string,
      status: 'Disetujui' | 'Ditolak',
      reviewNote?: string
    ): Promise<ActionResult> => {
      if (!user) return { success: false, message: 'Sesi admin tidak valid.' };
      try {
        await updateDoc(doc(db, 'requests', requestId), {
          status,
          reviewNote: reviewNote?.trim() || null,
          reviewedBy: user.uid,
          reviewedAt: serverTimestamp(),
        });
        return { success: true };
      } catch (e) {
        return {
          success: false,
          message: extractFirebaseError(e, 'Gagal menyimpan keputusan pengajuan ke database.'),
        };
      }
    },
    [user]
  );

  const updateSettings = useCallback(
    async (settings: {
      latitude: number | null;
      longitude: number | null;
      radius: number;
      wfhSchedule: WfhSchedule;
      workHours: WorkHoursPolicy;
      holidays: HolidayItem[];
    }): Promise<ActionResult> => {
      if (!user) return { success: false, message: 'Sesi admin tidak valid.' };
      try {
        await setDoc(
          doc(db, 'settings', 'general'),
          {
            latitude: settings.latitude,
            longitude: settings.longitude,
            radius: settings.radius,
            wfhSchedule: settings.wfhSchedule,
            workHours: settings.workHours,
            holidays: settings.holidays,
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        return { success: true };
      } catch (e) {
        return {
          success: false,
          message: extractFirebaseError(e, 'Gagal menyimpan pengaturan ke Firestore.'),
        };
      }
    },
    [user]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        data,
        isLoaded,
        isRefreshing,
        syncError,
        lastSyncedAt,
        addEmployee,
        updateEmployee,
        setEmployeeActive,
        resetEmployeePassword,
        reviewLeaveRequest,
        updateSettings,
        refresh,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
