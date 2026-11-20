'use client';

import React from 'react';
import { Bell, User, RefreshCw } from 'lucide-react';
import { useWorkspace } from '@/lib/store';

export default function Topbar({ title }: { title: string }) {
  const { data, loadFromFirestore } = useWorkspace();
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
        <button
          onClick={() => loadFromFirestore()}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          title="Muat ulang data dari database"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        <div className="relative">
          <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </div>

        <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 pl-1 sm:pl-2">
          <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Admin</span>
        </div>
      </div>
    </header>
  );
}
