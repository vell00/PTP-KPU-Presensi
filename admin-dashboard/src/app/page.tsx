'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { AttendanceStatusBadge, ModeBadge } from '@/components/StatusBadge';
import {
  evaluateRecordTiming,
  formatWitaDateLabel,
  getWitaTodayKey,
  parseToWitaParts,
} from '@/lib/attendance-policy';
import { ALL_SUBDEPARTMENTS } from '@/lib/constants';
import {
  Users,
  CheckCircle2,
  Clock,
  CalendarDays,
  MapPin,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function DashboardPage() {
  const { data, isLoaded } = useWorkspace();

  const metrics = useMemo(() => {
    const now = new Date();
    const todayKey = getWitaTodayKey(now);
    const todayParts = parseToWitaParts(now);
    const todayDayName = DAY_NAMES_ID[todayParts.weekday];

    const activeEmployees = data.employees.filter((e) => e.active !== false);
    const todayEntries = data.records
      .map((rec) => ({ rec, timing: evaluateRecordTiming(rec, todayKey, data.workHours) }))
      .filter((item) => item.timing.dateKey === todayKey)
      .sort((a, b) => new Date(b.rec.entered).getTime() - new Date(a.rec.entered).getTime());

    const wfoCount = todayEntries.filter((x) => x.rec.mode === 'WFO').length;
    const wfhCount = todayEntries.filter((x) => x.rec.mode === 'WFH').length;
    const onTimeCount = todayEntries.filter((x) => x.timing.lateMinutes === 0).length;
    const lateCount = todayEntries.length - onTimeCount;

    const presentKeys = new Set<string>();
    todayEntries.forEach(({ rec }) => {
      if (rec.uid) presentKeys.add(rec.uid);
      if (rec.nip) presentKeys.add(rec.nip);
    });
    const absentTodayCount = Math.max(
      0,
      activeEmployees.filter((e) => !presentKeys.has(e.id) && !presentKeys.has(e.nip)).length
    );
    const attendanceRate =
      activeEmployees.length > 0
        ? Math.min(100, Math.round((todayEntries.length / activeEmployees.length) * 100))
        : 0;

    const pendingRequests = data.requests.filter((r) => r.status === 'Menunggu');

    // Last 7 days trend (WITA)
    const trend: { dateKey: string; label: string; onTime: number; late: number; total: number }[] = [];
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(now.getTime() - offset * 86400000);
      const dk = getWitaTodayKey(d);
      const p = parseToWitaParts(d);
      const dayItems = data.records
        .map((rec) => evaluateRecordTiming(rec, todayKey, data.workHours))
        .filter((t) => t.dateKey === dk);
      const onTime = dayItems.filter((t) => t.lateMinutes === 0).length;
      const late = dayItems.length - onTime;
      trend.push({
        dateKey: dk,
        label: `${DAY_NAMES_ID[p.weekday].slice(0, 3)} ${p.day}`,
        onTime,
        late,
        total: dayItems.length,
      });
    }
    const maxTrend = Math.max(1, ...trend.map((t) => t.total));

    const wfhSubdeptsToday = ALL_SUBDEPARTMENTS.filter((s) =>
      (data.wfhSchedule[s.id] || []).includes(todayDayName)
    );
    const holidayToday = data.holidays.find((h) => h.date === todayKey) || null;

    return {
      todayKey,
      todayDayName,
      totalActive: activeEmployees.length,
      todayEntries,
      wfoCount,
      wfhCount,
      onTimeCount,
      lateCount,
      absentTodayCount,
      attendanceRate,
      pendingRequests,
      trend,
      maxTrend,
      wfhSubdeptsToday,
      holidayToday,
    };
  }, [data]);

  return (
    <>
      <Topbar title="Ringkasan Kehadiran" />
      <main className="p-4 sm:p-6 xl:p-8 space-y-6 w-full max-w-[1440px]">
        {!isLoaded ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className="h-32 bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                  <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
                  <div className="h-8 w-16 bg-slate-200 rounded mb-3" />
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
            <div className="h-80 bg-white rounded-xl border border-slate-200 animate-pulse" />
          </div>
        ) : (
          <>
            {metrics.holidayToday && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-sm text-blue-900">
                <CalendarDays className="w-5 h-5 text-blue-600 shrink-0" />
                <span>
                  Hari ini tercatat sebagai hari libur instansi:{' '}
                  <strong>{metrics.holidayToday.name}</strong> ({formatWitaDateLabel(metrics.todayKey)}).
                </span>
              </div>
            )}

            {/* KPI Strip — Today WITA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">Pegawai Aktif</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#07142F] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {metrics.totalActive}
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  {metrics.absentTodayCount > 0 ? (
                    <span>
                      <strong className="text-slate-800 tabular-nums">{metrics.absentTodayCount}</strong>{' '}
                      belum absen hari ini
                    </span>
                  ) : (
                    'Seluruh pegawai aktif terdata'
                  )}
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">Hadir Hari Ini</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {metrics.todayEntries.length}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                    {metrics.attendanceRate}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
                  <strong className="text-slate-800">{metrics.wfoCount} WFO</strong>
                  {' / '}
                  <strong className="text-blue-700">{metrics.wfhCount} WFH</strong>
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">Ketepatan Waktu</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {metrics.onTimeCount}
                </div>
                <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
                  <span className="text-emerald-700 font-semibold">{metrics.onTimeCount} tepat</span>
                  {' / '}
                  <span className={metrics.lateCount > 0 ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                    {metrics.lateCount} terlambat
                  </span>
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">Antrean Izin &amp; Cuti</span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      metrics.pendingRequests.length > 0
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {metrics.pendingRequests.length}
                </div>
                <p className="text-xs mt-1.5">
                  {metrics.pendingRequests.length > 0 ? (
                    <Link href="/izin" className="text-[#D52832] font-semibold hover:underline">
                      Tinjau pengajuan menunggu
                    </Link>
                  ) : (
                    <span className="text-slate-500">Tidak ada antrean</span>
                  )}
                </p>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: 7-Day Trend + Today Activity Table */}
              <div className="lg:col-span-2 space-y-6">
                {/* 7-Day Attendance Bar Chart */}
                <section className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Tren Presensi 7 Hari Terakhir</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Perbandingan kehadiran tepat waktu dan terlambat (WITA)
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#07142F]" />
                        Tepat Waktu
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                        Terlambat
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-36 pt-2">
                    {metrics.trend.map((bar) => {
                      const onTimeH = Math.round((bar.onTime / metrics.maxTrend) * 100);
                      const lateH = Math.round((bar.late / metrics.maxTrend) * 100);
                      const isToday = bar.dateKey === metrics.todayKey;
                      return (
                        <div key={bar.dateKey} className="flex flex-col items-center gap-2 h-full">
                          <span className="text-[11px] font-mono tabular-nums text-slate-500">
                            {bar.total}
                          </span>
                          <div className="w-full max-w-[38px] flex-1 bg-slate-100 rounded-md flex flex-col justify-end overflow-hidden">
                            {bar.late > 0 && (
                              <div
                                style={{ height: `${lateH}%` }}
                                className="w-full bg-amber-500 transition-all"
                                title={`Terlambat: ${bar.late}`}
                              />
                            )}
                            {bar.onTime > 0 && (
                              <div
                                style={{ height: `${onTimeH}%` }}
                                className="w-full bg-[#07142F] transition-all"
                                title={`Tepat Waktu: ${bar.onTime}`}
                              />
                            )}
                          </div>
                          <span
                            className={`text-[11px] tabular-nums ${
                              isToday ? 'font-bold text-[#D52832]' : 'text-slate-500'
                            }`}
                          >
                            {bar.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Today Check-In Log */}
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Aktivitas Presensi Hari Ini ({formatWitaDateLabel(metrics.todayKey)})
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Diurutkan dari waktu masuk terbaru (WITA)
                      </p>
                    </div>
                    <Link
                      href="/rekap"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#07142F] hover:text-[#D52832] transition-colors"
                    >
                      <span>Lihat Rekap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[540px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                        <tr>
                          <th className="px-5 py-3">Pegawai</th>
                          <th className="px-4 py-3">Unit / Jabatan</th>
                          <th className="px-4 py-3">Mode</th>
                          <th className="px-4 py-3">Masuk</th>
                          <th className="px-5 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {metrics.todayEntries.slice(0, 8).map(({ rec, timing }, idx) => (
                          <tr key={rec.id || `${rec.nip}-${idx}`} className="hover:bg-slate-50/70">
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-slate-900">{rec.name}</div>
                              {rec.nip && (
                                <div className="text-[11px] font-mono tabular-nums text-slate-500">
                                  {rec.nip}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-600">{rec.division}</td>
                            <td className="px-4 py-3.5">
                              <ModeBadge mode={rec.mode} />
                            </td>
                            <td className="px-4 py-3.5 text-xs font-mono font-semibold tabular-nums text-slate-800">
                              {timing.enteredParts.timeLabel} WITA
                            </td>
                            <td className="px-5 py-3.5">
                              <AttendanceStatusBadge status={timing.status} />
                            </td>
                          </tr>
                        ))}
                        {metrics.todayEntries.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-10 text-center">
                              <p className="text-sm font-medium text-slate-600">
                                Belum ada presensi masuk untuk hari ini.
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Catatan akan muncul otomatis secara real-time saat pegawai melakukan
                                check-in di aplikasi mobile.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* Right Column: Pending Leaves & Policy Summary */}
              <div className="space-y-6">
                <section className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-900">Izin &amp; Cuti Menunggu</h2>
                    <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      {metrics.pendingRequests.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {metrics.pendingRequests.slice(0, 4).map((req) => (
                      <Link
                        key={req.id}
                        href="/izin"
                        className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900 truncate">{req.name}</p>
                          <span className="text-[11px] font-medium text-amber-700 shrink-0">
                            {req.daysCount} hari
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">
                          {req.type} — {req.startDate}
                          {req.endDate && req.endDate !== req.startDate ? ` s.d. ${req.endDate}` : ''}
                        </p>
                      </Link>
                    ))}
                    {metrics.pendingRequests.length === 0 && (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        Semua pengajuan izin dan cuti telah diproses.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link
                      href="/izin"
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#07142F] hover:text-[#D52832] transition-colors"
                    >
                      <span>Kelola Semua Pengajuan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Status Geofencing &amp; WFH</h2>
                    <MapPin className="w-4 h-4 text-[#D52832]" />
                  </div>

                  <dl className="text-xs space-y-2 text-slate-600">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-500">Koordinat Kantor</dt>
                      <dd className="font-mono tabular-nums font-medium text-slate-900">
                        {data.latitude != null && data.longitude != null
                          ? `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`
                          : 'Belum diatur'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-500">Radius Toleransi WFO</dt>
                      <dd className="font-mono tabular-nums font-medium text-slate-900">
                        {data.radius} meter
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-500">Jam Masuk WITA</dt>
                      <dd className="font-mono tabular-nums font-medium text-slate-900">
                        {String(data.workHours.startHour).padStart(2, '0')}:
                        {String(data.workHours.startMinute).padStart(2, '0')} WITA
                      </dd>
                    </div>
                  </dl>

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      Subbagian WFH Hari Ini ({metrics.todayDayName})
                    </p>
                    {metrics.wfhSubdeptsToday.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {metrics.wfhSubdeptsToday.map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                        Seluruh unit dijadwalkan WFO hari ini.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Link
                      href="/pengaturan"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#07142F] hover:text-[#D52832] transition-colors"
                    >
                      <span>Ubah Pengaturan Kantor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
