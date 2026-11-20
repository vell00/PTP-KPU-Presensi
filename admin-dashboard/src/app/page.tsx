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
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data, isLoaded } = useWorkspace();

  if (!isLoaded) {
    return <div className="p-8 text-center text-slate-400">Memuat data dashboard...</div>;
  }

  const totalEmployees = data.employees.length;
  const todayRecords = data.records; // in demo represents latest batch
  const wfoCount = todayRecords.filter((r) => r.mode === 'WFO').length;
  const wfhCount = todayRecords.filter((r) => r.mode === 'WFH').length;
  const onTimeCount = todayRecords.filter((r) => {
    const d = new Date(r.entered);
    return d.getHours() < 8 || (d.getHours() === 8 && d.getMinutes() === 0);
  }).length;
  const lateCount = todayRecords.length - onTimeCount;
  const pendingRequests = data.requests.filter((r) => r.status === 'Menunggu');

  // Breakdown by division
  const divisionBreakdown: Record<string, number> = {};
  todayRecords.forEach((r) => {
    divisionBreakdown[r.division] = (divisionBreakdown[r.division] || 0) + 1;
  });

  return (
    <>
      <Topbar title="Ringkasan Dashboard" />
      <main className="p-8 space-y-8 max-w-7xl">
        {/* Banner Demo */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold">
              ℹ
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-900">
                Mode Demo Web Admin KPU Sulawesi Utara
              </p>
              <p className="text-xs text-teal-700">
                Data disimpan secara lokal pada browser. Pegawai melakukan presensi melalui aplikasi mobile Flutter terpisah.
              </p>
            </div>
          </div>
          <Link
            href="/rekap"
            className="text-xs font-bold text-teal-800 hover:text-teal-950 underline px-2 py-1"
          >
            Lihat Rekap Lengkap &rarr;
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Pegawai */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Pegawai</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalEmployees}</div>
            <p className="text-xs text-slate-500 mt-1">Terdaftar dalam direktori aktif</p>
          </div>

          {/* Kehadiran Hari Ini */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Presensi Tercatat</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{todayRecords.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-teal-600 font-semibold">{wfoCount} WFO</span> •{' '}
              <span className="text-blue-600 font-semibold">{wfhCount} WFH</span>
            </p>
          </div>

          {/* Tepat Waktu / Terlambat */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Ketepatan Waktu</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{onTimeCount}</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-teal-600 font-semibold">{onTimeCount} tepat waktu</span> •{' '}
              <span className="text-rose-600 font-semibold">{lateCount} terlambat</span>
            </p>
          </div>

          {/* Izin / Cuti Menunggu */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Pengajuan Izin</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{pendingRequests.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {pendingRequests.length > 0 ? (
                <span className="text-amber-600 font-semibold">Menunggu persetujuan</span>
              ) : (
                'Tidak ada antrean pending'
              )}
            </p>
          </div>
        </div>

        {/* Section 2: Distribution & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kehadiran Terkini */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Aktivitas Presensi Hari Ini</h3>
                <p className="text-xs text-slate-500">Log kehadiran masuk dari aplikasi mobile</p>
              </div>
              <Link
                href="/rekap"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Nama Pegawai</th>
                    <th className="pb-3">Subdivisi</th>
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
                        <td className="py-3 font-semibold text-slate-900">{rec.name}</td>
                        <td className="py-3 text-slate-500 text-xs">{rec.division}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                              rec.mode === 'WFO'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
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
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isLate
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-emerald-50 text-emerald-700'
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
                        Belum ada catatan presensi hari ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions & Pending Leaves */}
          <div className="space-y-6">
            {/* Pending Requests Box */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Izin / Cuti Menunggu</h3>
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                  {pendingRequests.length}
                </span>
              </div>
              <div className="space-y-3">
                {pendingRequests.map((req, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{req.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {req.type} • {req.date}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 italic">&ldquo;{req.reason}&rdquo;</p>
                    </div>
                  </div>
                ))}
                {pendingRequests.length === 0 && (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Semua pengajuan telah diproses.
                  </p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link
                  href="/izin"
                  className="block text-center text-xs font-bold text-teal-700 hover:text-teal-800"
                >
                  Kelola Pengajuan &rarr;
                </Link>
              </div>
            </div>

            {/* Kantor KPU Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Koordinat Kantor Presensi</h3>
              <div className="text-xs text-slate-600 space-y-1.5">
                <p>
                  <span className="font-semibold text-slate-700">Latitude:</span>{' '}
                  {data.latitude ?? 'Belum diisi'}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Longitude:</span>{' '}
                  {data.longitude ?? 'Belum diisi'}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Radius WFO:</span> {data.radius} meter
                </p>
              </div>
              <Link
                href="/pengaturan"
                className="mt-4 inline-block text-xs font-bold text-teal-700 hover:text-teal-800"
              >
                Ubah Pengaturan Lokasi &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
