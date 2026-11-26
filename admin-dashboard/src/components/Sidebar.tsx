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
  Fingerprint,
  Menu,
  X,
  Coins,
} from 'lucide-react';
import { useWorkspace } from '@/lib/store';

export default function Sidebar() {
  const pathname = usePathname();
  const { data } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingRequestsCount = data.requests.filter((r) => r.status === 'Menunggu').length;

  const menuItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Rekap Kehadiran', href: '/rekap', icon: ClipboardCheck },
    { label: 'Manajemen Pegawai', href: '/pegawai', icon: Users },
    { label: 'Izin & Cuti', href: '/izin', icon: CalendarDays, badge: pendingRequestsCount },
    { label: 'Tunjangan Kinerja', href: '/tukin', icon: Coins },
    { label: 'Pengaturan', href: '/pengaturan', icon: Settings },
  ];

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="p-5 lg:p-6 flex items-center justify-between border-b border-slate-100">
        <div>
          <h1 className="text-base font-black tracking-tight text-[#07142F] leading-snug">
            Presensi KPU Sulut
          </h1>
          <span className="text-[11px] font-bold text-[#D52832] tracking-wider uppercase">
            Portal Administrator
          </span>
        </div>
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="px-4 py-6 flex-1 space-y-1">
        <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Portal Administrator
        </div>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-rose-50 text-[#D52832] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#07142F]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-[#D52832]' : 'text-slate-400'}`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#D52832] text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
          AD
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">Admin KPU Sulut</p>
          <p className="text-[10px] text-[#D52832] font-semibold">Administrator</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:bg-slate-50"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - fixed on desktop, slide-in on mobile */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
