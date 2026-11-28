'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, RefreshCw, LogOut, CalendarDays, AlertCircle, ArrowRight } from 'lucide-react';
import { useWorkspace } from '@/lib/store';
import { useAdminAuth } from '@/lib/auth';
import { useFeedback } from '@/components/FeedbackProvider';
import { formatWitaFullDate, parseToWitaParts } from '@/lib/attendance-policy';

export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { data, isRefreshing, syncError, refresh } = useWorkspace();
  const { user, logout } = useAdminAuth();
  const { confirmAction, showToast } = useFeedback();

  const [now, setNow] = useState<Date>(() => new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [notifOpen]);

  const pendingRequests = data.requests.filter((r) => r.status === 'Menunggu');
  const wita = parseToWitaParts(now);
  const clockStr = `${String(wita.hour).padStart(2, '0')}:${String(wita.minute).padStart(2, '0')}:${String(wita.second).padStart(2, '0')} WITA`;

  const handleManualRefresh = async () => {
    await refresh();
    showToast('info', 'Data Diperbarui', 'Seluruh data presensi dan kepegawaian telah disinkronkan.');
  };

  const handleLogout = async () => {
    const ok = await confirmAction({
      title: 'Keluar dari Portal Admin?',
      message: 'Anda akan keluar dari sesi administrator saat ini.',
      confirmLabel: 'Keluar',
      variant: 'danger',
    });
    if (ok) {
      await logout();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 xl:px-8 h-16 flex items-center justify-between sticky top-0 z-20 gap-3">
      {/* Page Title */}
      <div className="pl-11 lg:pl-0 min-w-0">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
          {title}
        </h1>
        <p className="text-xs text-slate-500 truncate">
          {subtitle || formatWitaFullDate(now)}
        </p>
      </div>

      {/* Right Utilities */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live WITA Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-semibold tabular-nums">
          <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>{clockStr}</span>
        </div>

        {/* Manual Refresh */}
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          aria-label="Segarkan data dari server"
          title="Segarkan data"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Interactive Notification Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label={`Notifikasi pengajuan menunggu (${pendingRequests.length})`}
            aria-expanded={notifOpen}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {pendingRequests.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D52832] text-white text-[10px] font-bold tabular-nums flex items-center justify-center">
                {pendingRequests.length > 9 ? '9+' : pendingRequests.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              role="region"
              aria-label="Daftar pengajuan menunggu persetujuan"
              className="fixed sm:absolute right-4 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Antrean Persetujuan</span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full tabular-nums">
                  {pendingRequests.length} menunggu
                </span>
              </div>

              {syncError && (
                <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-100 flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{syncError}</span>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {pendingRequests.slice(0, 5).map((req) => (
                  <Link
                    key={req.id}
                    href="/izin"
                    onClick={() => setNotifOpen(false)}
                    className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">{req.name}</p>
                      <span className="text-[11px] font-medium text-slate-500 shrink-0">
                        {req.daysCount} hari
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {req.type} ({req.startDate}
                        {req.endDate && req.endDate !== req.startDate ? ` s.d. ${req.endDate}` : ''})
                      </span>
                    </p>
                  </Link>
                ))}
                {pendingRequests.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">
                    Seluruh pengajuan izin &amp; cuti telah ditindaklanjuti.
                  </div>
                )}
              </div>

              <Link
                href="/izin"
                onClick={() => setNotifOpen(false)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-[#07142F] hover:text-[#D52832] transition-colors"
              >
                <span>Buka Halaman Izin &amp; Cuti</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Quick Profile & Logout */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-900 leading-tight">
              {user?.name || 'Administrator'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums leading-tight">
              {user?.nip || 'Admin'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Keluar dari portal admin"
            title="Keluar"
            className="p-2 text-slate-500 hover:text-[#D52832] hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
