'use client';

import React from 'react';
import './globals.css';
import { AuthProvider, useAdminAuth } from '@/lib/auth';
import { WorkspaceProvider } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import AdminLoginPage from '@/components/AdminLoginPage';

function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="relative min-h-screen w-full bg-[#040C1D] flex flex-col items-center justify-center text-white px-4 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute w-80 h-80 bg-[#16366C]/35 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full bg-[#0B1730]/80 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          {/* Logo + Spinner Ring */}
          <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-[#D52832] animate-spin" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo_kpu_sulut.jpg"
              alt="Logo KPU Sulut"
              className="w-11 h-11 rounded-full object-cover border border-white/20"
            />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#EE5A62] mb-1">
            Sistem Presensi KPU Sulawesi Utara
          </span>
          <h2 className="text-sm font-bold text-white tracking-wide">
            Memverifikasi Sesi Administrator...
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Mohon tunggu sebentar, sedang memeriksa hak akses portal.
          </p>
        </div>
      </div>
    );
  }

  // Jika belum login sebagai admin, tampilkan AdminLoginPage bergaya PTP-KPU
  if (!user) {
    return <AdminLoginPage />;
  }

  // Jika sudah login admin, tampilkan Dashboard dengan Sidebar
  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen bg-[#F8FAF9] w-full antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
          {children}
        </div>
      </div>
    </WorkspaceProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Sistem Presensi KPU Sulawesi Utara • Portal Administrator</title>
      </head>
      <body className="min-h-screen bg-[#040C1D] antialiased" suppressHydrationWarning>
        <AuthProvider>
          <AdminGate>
            {children}
          </AdminGate>
        </AuthProvider>
      </body>
    </html>
  );
}
