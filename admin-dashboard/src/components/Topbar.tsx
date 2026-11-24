'use client';

import React from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { useWorkspace } from '@/lib/store';
import { useAdminAuth } from '@/lib/auth';

export default function Topbar({ title }: { title: string }) {
  const { data } = useWorkspace();
  const { user, logout } = useAdminAuth();
  const pendingCount = data.requests.filter((r) => r.status === 'Menunggu').length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10">
      {/* Left side - leave space for mobile hamburger */}
      <div className="pl-10 lg:pl-0">
        <h2 className="text-base sm:text-lg font-bold text-slate-800">{title}</h2>
        <p className="text-[10px] sm:text-xs text-slate-500">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          • WITA (UTC+8)
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative">
          <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D52832] rounded-full" />
          )}
        </div>

        <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 pl-1 sm:pl-2">
          <div className="w-7 h-7 rounded-full bg-rose-50 text-[#D52832] flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#07142F] leading-tight">{user?.name || 'Administrator'}</span>
            <span className="text-[10px] text-slate-400 font-mono leading-tight">{user?.nip || 'Admin'}</span>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 ml-1 text-slate-400 hover:text-[#D52832] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Keluar dari portal admin"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
