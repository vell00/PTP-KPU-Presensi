'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WorkspaceData, Employee, LeaveRequest, Attendance } from '@/types';
import { INITIAL_DATA } from './constants';

const STORAGE_KEY = 'hadir_kpu_workspace';

interface WorkspaceContextType {
  data: WorkspaceData;
  isLoaded: boolean;
  saveData: (updater: (prev: WorkspaceData) => WorkspaceData) => void;
  addEmployee: (emp: Omit<Employee, 'id'>) => { success: boolean; message?: string };
  updateEmployee: (emp: Employee) => { success: boolean; message?: string };
  deleteEmployee: (id: string) => void;
  updateRequestStatus: (index: number, status: 'Disetujui' | 'Ditolak') => void;
  updateSettings: (settings: { latitude: number | null; longitude: number | null; radius: number; fridayWfh: boolean }) => void;
  addAttendanceRecord: (record: Attendance) => void;
  resetDemoData: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(INITIAL_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData({
          ...INITIAL_DATA,
          ...parsed,
          employees: parsed.employees || INITIAL_DATA.employees,
          records: parsed.records || INITIAL_DATA.records,
          requests: parsed.requests || INITIAL_DATA.requests,
        });
      }
    } catch (e) {
      console.error('Failed to parse workspace from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveData = useCallback((updater: (prev: WorkspaceData) => WorkspaceData) => {
    setData((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save workspace to localStorage', e);
      }
      return next;
    });
  }, []);

  const addEmployee = useCallback((emp: Omit<Employee, 'id'>) => {
    let result: { success: boolean; message?: string } = { success: true };
    saveData((prev) => {
      // Validate 18 digit NIP
      if (!/^\d{18}$/.test(emp.nip)) {
        result = { success: false, message: 'NIP harus terdiri dari tepat 18 digit angka.' };
        return prev;
      }
      // Check duplicate
      if (prev.employees.some((e) => e.nip === emp.nip)) {
        result = { success: false, message: 'NIP sudah terdaftar di sistem.' };
        return prev;
      }
      const newEmp: Employee = {
        ...emp,
        id: Date.now().toString(),
      };
      return {
        ...prev,
        employees: [...prev.employees, newEmp],
      };
    });
    return result;
  }, [saveData]);

  const updateEmployee = useCallback((emp: Employee) => {
    let result: { success: boolean; message?: string } = { success: true };
    saveData((prev) => {
      if (!/^\d{18}$/.test(emp.nip)) {
        result = { success: false, message: 'NIP harus terdiri dari tepat 18 digit angka.' };
        return prev;
      }
      // Check duplicate with others
      if (prev.employees.some((e) => e.id !== emp.id && e.nip === emp.nip)) {
        result = { success: false, message: 'NIP sudah digunakan oleh pegawai lain.' };
        return prev;
      }
      return {
        ...prev,
        employees: prev.employees.map((e) => (e.id === emp.id ? emp : e)),
      };
    });
    return result;
  }, [saveData]);

  const deleteEmployee = useCallback((id: string) => {
    saveData((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== id),
    }));
  }, [saveData]);

  const updateRequestStatus = useCallback((index: number, status: 'Disetujui' | 'Ditolak') => {
    saveData((prev) => {
      const nextRequests = [...prev.requests];
      if (nextRequests[index]) {
        nextRequests[index] = { ...nextRequests[index], status };
      }
      return {
        ...prev,
        requests: nextRequests,
      };
    });
  }, [saveData]);

  const updateSettings = useCallback((settings: { latitude: number | null; longitude: number | null; radius: number; fridayWfh: boolean }) => {
    saveData((prev) => ({
      ...prev,
      ...settings,
    }));
  }, [saveData]);

  const addAttendanceRecord = useCallback((record: Attendance) => {
    saveData((prev) => ({
      ...prev,
      records: [record, ...prev.records],
    }));
  }, [saveData]);

  const resetDemoData = useCallback(() => {
    setData(INITIAL_DATA);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
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
        resetDemoData,
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
