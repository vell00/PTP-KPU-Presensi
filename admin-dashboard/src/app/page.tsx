'use client';

import React from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import {
  Users,
  CheckCircle2,
  Clock,
  CalendarDays,
  Building2,
  Home,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data, isLoaded } = useWorkspace();

  if (!isLoaded) {
    return <div className="p-8 text-center text-slate-400">Memuat data dashboard...</div>;
  }

  const totalEmployees = data.employees.length;
  const todayRecords = data.records;
  const wfoCount = todayRecords.filter((r) => r.mode === 'WFO').length;
  const wfhCount = todayRecords.filter((r) => r.mode === 'WFH').length;
  const onTimeCount = todayRecords.filter((r) => {
    const d = new Date(r.entered);
    return d.getHours() < 8 || (d.getHours() === 8 && d.getMinutes() === 0);
  }).length;
  const lateCount = todayRecords.length - onTimeCount;
  const pendingRequests = data.requests.filter((r) => r.status === 'Menunggu');

  return (
    <>
      <Topbar title="Ringkasan Dashboard" />
      <main className="p-4 sm:p-6 xl:p-8 space-y-5 sm:space-y-6 w-full">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Pegawai */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pegawai</span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-xs">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{totalEmployees}</div>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">Terdaftar dalam sistem</p>
          </div>

          {/* Kehadiran */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Presensi</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-[#D52832] shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#07142F]">{todayRecords.length}</div>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              <span className="text-[#07142F] font-bold">{wfoCount} WFO</span>
              {' · '}
              <span className="text-[#D52832] font-bold">{wfhCount} WFH</span>
            </p>
          </div>

          {/* Ketepatan Waktu */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ketepatan</span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-[#07142F] shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#07142F]">{onTimeCount}</div>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              <span className="text-[#07142F] font-bold">{onTimeCount} tepat</span>
              {' · '}
              <span className="text-[#D52832] font-bold">{lateCount} terlambat</span>
            </p>
          </div>

          {/* Izin Menunggu */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pengajuan</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-[#D52832] shadow-xs">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#07142F]">{pendingRequests.length}</div>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {pendingRequests.length > 0 ? (
                <span className="text-[#D52832] font-bold">Menunggu persetujuan</span>
              ) : (
                'Tidak ada antrean'
              )}
            </p>
          </div>
        </div>

        {/* Aktivitas & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Tabel Presensi */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Aktivitas Presensi</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Log kehadiran dari aplikasi mobile</p>
              </div>
              <Link href="/rekap" className="text-xs font-bold text-[#D52832] hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-4 sm:px-0">Nama Pegawai</th>
                    <th className="pb-3">UNIT / JABATAN</th>
                    <th className="pb-3">Metode</th>
                    <th className="pb-3">Jam Masuk</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {todayRecords.slice(0, 5).map((rec, i) => {
                    const enterDate = new Date(rec.entered);
                    const isLate =
                      enterDate.getHours() > 8 ||
                      (enterDate.getHours() === 8 && enterDate.getMinutes() > 0);
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 sm:px-0 font-semibold text-slate-900">{rec.name}</td>
                        <td className="py-3 text-slate-500 text-xs">{rec.division}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold ${
                              rec.mode === 'WFO'
                                ? 'bg-slate-100 text-[#07142F] border border-slate-200'
                                : 'bg-rose-50 text-[#D52832] border border-rose-200'
                            }`}
                          >
                            {rec.mode === 'WFO' ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                            {rec.mode}
                          </span>
                        </td>
                        <td className="py-3 text-xs font-medium">
                          {enterDate.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isLate
                                ? 'bg-rose-100 text-[#D52832]'
                                : 'bg-slate-100 text-[#07142F]'
                            }`}
                          >
                            {isLate ? 'Terlambat' : 'Tepat Waktu'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {todayRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Belum ada catatan presensi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#07142F]">Izin / Cuti Menunggu</h3>
                <span className="text-xs font-bold px-2 py-0.5 bg-rose-50 text-[#D52832] rounded-full border border-rose-200">
                  {pendingRequests.length}
                </span>
              </div>
              <div className="space-y-3">
                {pendingRequests.map((req, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{req.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {req.type} • {req.date}
                    </p>
                  </div>
                ))}
                {pendingRequests.length === 0 && (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Semua pengajuan telah diproses.
                  </p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link href="/izin" className="block text-center text-xs font-bold text-[#D52832] hover:underline">
                  Kelola Pengajuan &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[#07142F] mb-3">Koordinat Kantor</h3>
              <div className="text-xs text-slate-600 space-y-1.5">
                <p><span className="font-semibold text-[#07142F]">Latitude:</span> {data.latitude ?? 'Belum diisi'}</p>
                <p><span className="font-semibold text-[#07142F]">Longitude:</span> {data.longitude ?? 'Belum diisi'}</p>
                <p><span className="font-semibold text-[#07142F]">Radius WFO:</span> {data.radius} meter</p>
              </div>
              <Link href="/pengaturan" className="mt-4 inline-block text-xs font-bold text-[#D52832] hover:underline">
                Ubah Pengaturan &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
