'use client';

import React from 'react';
import { AuthProvider, useAdminAuth } from '@/lib/auth';
import { WorkspaceProvider } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import AdminLoginPage from '@/components/AdminLoginPage';
import { FeedbackProvider } from '@/components/FeedbackProvider';

function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F6F7F9] flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
          <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200 border-t-[#D52832] animate-spin" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo_kpu_sulut.jpg"
              alt="Logo KPU Sulut"
              className="w-9 h-9 rounded-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Memverifikasi Sesi Administrator</h2>
            <p className="text-xs text-slate-500 mt-1">
              Memeriksa hak akses portal KPU Provinsi Sulawesi Utara...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLoginPage />;
  }

  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen bg-[#F6F7F9] w-full antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">{children}</div>
      </div>
    </WorkspaceProvider>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider>
      <AuthProvider>
        <AdminGate>{children}</AdminGate>
      </AuthProvider>
    </FeedbackProvider>
  );
}
