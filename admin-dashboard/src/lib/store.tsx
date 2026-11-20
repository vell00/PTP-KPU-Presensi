'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WorkspaceData, Employee, WfhSchedule } from '@/types';
import { INITIAL_DATA } from './constants';
import { db } from './firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

interface WorkspaceContextType {
  data: WorkspaceData;
  isLoaded: boolean;
  saveData: (updater: (prev: WorkspaceData) => WorkspaceData) => void;
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<{ success: boolean; message?: string }>;
  updateEmployee: (emp: Employee) => { success: boolean; message?: string };
  deleteEmployee: (id: string) => void;
  updateRequestStatus: (index: number, status: 'Disetujui' | 'Ditolak') => void;
  updateSettings: (settings: { latitude: number | null; longitude: number | null; radius: number; wfhSchedule: WfhSchedule }) => void;
  addAttendanceRecord: (record: WorkspaceData['records'][0]) => void;
  loadFromFirestore: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(INITIAL_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  // Bersihkan data lama localStorage agar tidak ada sisa dummy
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hadir_kpu_workspace');
    }
    loadFromFirestore().then(() => setIsLoaded(true)).catch(() => setIsLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFromFirestore = useCallback(async () => {
    try {
      // 1. Ambil data pegawai murni dari Firestore collection 'users'
      const usersSnap = await getDocs(collection(db, 'users'));
      const employees: Employee[] = [];
      usersSnap.forEach((docSnap) => {
        const d = docSnap.data();
        employees.push({
          id: docSnap.id,
          nip: d.nip || '',
          name: d.name || d.nip || '',
          role: d.role || 'staff',
          departmentId: d.departmentId || '',
          subdepartmentId: d.subdepartmentId || '',
          password: d.password,
        });
      });

      // 2. Ambil data kehadiran murni dari Firestore collection 'presensi'
      const presensiSnap = await getDocs(collection(db, 'presensi'));
      const records: WorkspaceData['records'] = [];
      presensiSnap.forEach((docSnap) => {
        const d = docSnap.data();
        records.push({
          name: d.nama || d.name || '',
          division: d.unit || d.division || '',
          mode: d.mode || 'WFO',
          entered: d.masuk || d.entered || (d.waktu?.toDate?.()?.toISOString()) || new Date().toISOString(),
          exited: d.keluar || d.exited || null,
          nip: d.nip,
        });
      });

      // 3. Ambil data izin murni dari Firestore collection 'requests'
      const requestsSnap = await getDocs(collection(db, 'requests'));
      const requests: WorkspaceData['requests'] = [];
      requestsSnap.forEach((docSnap) => {
        const d = docSnap.data();
        requests.push({
          id: docSnap.id,
          name: d.name || '',
          type: d.type || '',
          reason: d.reason || '',
          date: d.date || '',
          status: d.status || 'Menunggu',
        });
      });

      // 4. Ambil pengaturan kantor dari Firestore 'settings/general'
      const { doc: docRef, getDoc } = await import('firebase/firestore');
      const settingsSnap = await getDoc(docRef(db, 'settings', 'general'));
      const settings = settingsSnap.exists() ? settingsSnap.data() : {};

      // Data diupdate HANYA dengan apa yang ada di database murni
      setData({
        employees,
        records,
        requests,
        latitude: settings.latitude ?? INITIAL_DATA.latitude,
        longitude: settings.longitude ?? INITIAL_DATA.longitude,
        radius: settings.radius ?? INITIAL_DATA.radius,
        wfhSchedule: settings.wfhSchedule ?? INITIAL_DATA.wfhSchedule,
      });
    } catch (e) {
      console.error('Gagal memuat data dari Firestore:', e);
      setData(INITIAL_DATA);
    }
  }, []);

  const saveData = useCallback((updater: (prev: WorkspaceData) => WorkspaceData) => {
    setData((prev) => updater(prev));
  }, []);

  const addEmployee = useCallback(async (emp: Omit<Employee, 'id'>): Promise<{ success: boolean; message?: string }> => {
    if (!/^\d{18}$/.test(emp.nip)) {
      return { success: false, message: 'NIP harus terdiri dari tepat 18 digit angka.' };
    }
    if (data.employees.some((e) => e.nip === emp.nip)) {
      return { success: false, message: 'NIP sudah terdaftar di sistem.' };
    }

    try {
      const auth = getAuth();
      const email = `${emp.nip}@nip.hadir.invalid`;
      const password = emp.password || 'Password123!';

      // 1. Buat User di Firebase Authentication
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // 2. Simpan profil lengkap ke Cloud Firestore
      await setDoc(doc(db, 'users', uid), {
        nip: emp.nip,
        name: emp.name || emp.nip,
        role: emp.role || 'staff',
        departmentId: emp.departmentId || '',
        subdepartmentId: emp.subdepartmentId || '',
        active: true,
        isAdmin: false,
        mustChangePassword: false,
      });

      // 3. Masukkan ke state lokal
      const newEmp: Employee = {
        ...emp,
        id: uid,
      };
      setData((prev) => ({
        ...prev,
        employees: [...prev.employees, newEmp],
      }));

      return { success: true };
    } catch (e: any) {
      console.error('Gagal membuat akun:', e);
      if (e?.code === 'auth/email-already-in-use') {
        return { success: false, message: 'NIP sudah terdaftar di Firebase Authentication.' };
      }
      return { success: false, message: e?.message || 'Gagal membuat akun pengguna.' };
    }
  }, [data.employees]);

  const updateEmployee = useCallback((emp: Employee) => {
    let result: { success: boolean; message?: string } = { success: true };
    if (!/^\d{18}$/.test(emp.nip)) {
      return { success: false, message: 'NIP harus terdiri dari tepat 18 digit angka.' };
    }
    setData((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === emp.id ? emp : e)),
    }));
    return result;
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== id),
    }));
  }, []);

  const updateRequestStatus = useCallback((index: number, status: 'Disetujui' | 'Ditolak') => {
    setData((prev) => {
      const nextRequests = [...prev.requests];
      if (nextRequests[index]) {
        nextRequests[index] = { ...nextRequests[index], status };
      }
      return {
        ...prev,
        requests: nextRequests,
      };
    });
  }, []);

  const updateSettings = useCallback(async (settings: { latitude: number | null; longitude: number | null; radius: number; wfhSchedule: WfhSchedule }) => {
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        latitude: settings.latitude,
        longitude: settings.longitude,
        radius: settings.radius,
        wfhSchedule: settings.wfhSchedule,
      }, { merge: true });
    } catch (e) {
      console.error('Gagal menyimpan pengaturan ke Firestore:', e);
    }

    setData((prev) => ({
      ...prev,
      ...settings,
    }));
  }, []);

  const addAttendanceRecord = useCallback((record: WorkspaceData['records'][0]) => {
    setData((prev) => ({
      ...prev,
      records: [record, ...prev.records],
    }));
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        data,
        isLoaded,
        saveData,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        updateRequestStatus,
        updateSettings,
        addAttendanceRecord,
        loadFromFirestore,
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
