'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  CalendarDays,
  Settings,
  Menu,
  X,
  Coins,
  LogOut,
} from 'lucide-react';
import { useWorkspace } from '@/lib/store';
import { useAdminAuth } from '@/lib/auth';
import { useFeedback } from '@/components/FeedbackProvider';

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return 'AD';
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data } = useWorkspace();
  const { user, logout } = useAdminAuth();
  const { confirmAction } = useFeedback();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingRequestsCount = data.requests.filter((r) => r.status === 'Menunggu').length;

  const menuItems = [
    { label: 'Ringkasan', href: '/', icon: LayoutDashboard },
    { label: 'Rekap Kehadiran', href: '/rekap', icon: ClipboardCheck },
    { label: 'Direktori Pegawai', href: '/pegawai', icon: Users },
    { label: 'Izin & Cuti', href: '/izin', icon: CalendarDays, badge: pendingRequestsCount },
    { label: 'Tunjangan Kinerja', href: '/tukin', icon: Coins },
    { label: 'Pengaturan', href: '/pengaturan', icon: Settings },
  ];

  const handleLogout = async () => {
    const ok = await confirmAction({
      title: 'Keluar dari Portal Admin?',
      message: 'Sesi administrator Anda akan diakhiri dan Anda perlu masuk kembali dengan NIP.',
      confirmLabel: 'Keluar',
      variant: 'danger',
    });
    if (ok) {
      await logout();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#07142F] text-slate-100">
      {/* Brand Header */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 min-w-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo_kpu_sulut.jpg"
            alt="Logo KPU Sulut"
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover border border-white/25 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-tight truncate">
              Presensi KPU Sulut
            </p>
            <p className="text-[11px] font-medium text-slate-300 truncate">Portal Administrator</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu navigasi"
          className="lg:hidden p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Menu utama administrator" className="px-3 py-5 flex-1 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#D52832] text-white font-semibold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 text-[11px] font-bold tabular-nums rounded-full ${
                    isActive
                      ? 'bg-white text-[#D52832]'
                      : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Active Admin Profile */}
      <div className="p-4 border-t border-white/10 bg-[#050E22]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#16366C] border border-white/15 flex items-center justify-center font-bold text-xs text-white shrink-0">
            {getInitials(user?.name || 'Admin')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user?.name || 'Administrator'}
            </p>
            <p className="text-[11px] text-slate-300 font-mono tabular-nums truncate">
              {user?.nip || 'Admin KPU Sulut'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Keluar dari portal administrator"
            title="Keluar"
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Buka menu navigasi"
        className="lg:hidden fixed top-3 left-3 z-40 p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 border-r border-slate-900/10 transition-transform duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
