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
      <div className="min-h-screen w-full bg-[#040C1D] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-3 border-[#D52832] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Memverifikasi Sesi Administrator...
        </span>
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
        <title>PTP-KPU Portal Administrator • Sulawesi Utara</title>
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
