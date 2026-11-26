'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { useFeedback } from '@/components/FeedbackProvider';
import { AttendanceStatusBadge, ModeBadge } from '@/components/StatusBadge';
import {
  evaluateRecordTiming,
  formatWitaDateLabel,
  getWitaTodayKey,
} from '@/lib/attendance-policy';
import { ALL_SUBDEPARTMENTS, resolveUnitDisplay } from '@/lib/constants';
import { Attendance } from '@/types';
import {
  Search,
  Download,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Camera,
  ShieldCheck,
  Eye,
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'Semua', label: 'Semua' },
  { id: 'Tepat Waktu', label: 'Tepat Waktu' },
  { id: 'Terlambat', label: 'Terlambat' },
  { id: 'Pulang Cepat', label: 'Pulang Cepat' },
  { id: 'Belum Pulang', label: 'Belum / Tidak Absen Pulang' },
  { id: 'Belum Absen', label: 'Belum / Tidak Absen' },
] as const;

const PAGE_SIZE = 25;

interface UnifiedRow {
  key: string;
  record: Attendance | null;
  name: string;
  nip: string;
  division: string;
  mode: string;
  dateKey: string;
  tanggalLabel: string;
  masukLabel: string;
  pulangLabel: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: string;
  sortTime: number;
}

export default function RekapPage() {
  const { data } = useWorkspace();
  const { showToast } = useFeedback();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubbagian, setSelectedSubbagian] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedMode, setSelectedMode] = useState('Semua');
  const [datePreset, setDatePreset] = useState<'today' | '7d' | '30d' | 'all' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDetail, setSelectedDetail] = useState<UnifiedRow | null>(null);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedSubbagian, selectedStatus, selectedMode, datePreset, startDate, endDate]);

  useEffect(() => {
    if (!selectedDetail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDetail(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedDetail]);

  const todayWitaKey = getWitaTodayKey();

  const targetCheckDate = useMemo(() => {
    if (datePreset === 'custom' && startDate) return startDate;
    return todayWitaKey;
  }, [datePreset, startDate, todayWitaKey]);

  const unifiedRows = useMemo(() => {
    const now = new Date();
    const sevenDaysStr = getWitaTodayKey(new Date(now.getTime() - 6 * 86400000));
    const thirtyDaysStr = getWitaTodayKey(new Date(now.getTime() - 29 * 86400000));

    const q = searchQuery.trim().toLowerCase();
    const matchesCommon = (name: string, nip: string, division: string, subdeptId?: string | null) => {
      if (q && !name.toLowerCase().includes(q) && !nip.toLowerCase().includes(q)) {
        return false;
      }
      if (selectedSubbagian !== 'Semua') {
        const subObj = ALL_SUBDEPARTMENTS.find((s) => s.id === selectedSubbagian);
        const matchesId = subdeptId === selectedSubbagian;
        const matchesLabel =
          subObj && division.toLowerCase().includes(subObj.name.toLowerCase());
        if (!matchesId && !matchesLabel) return false;
      }
      return true;
    };

    const rows: UnifiedRow[] = [];

    if (selectedStatus !== 'Belum Absen') {
      data.records.forEach((rec, idx) => {
        const timing = evaluateRecordTiming(rec, todayWitaKey, data.workHours);
        const dk = timing.dateKey;

        if (datePreset === 'today' && dk !== todayWitaKey) return;
        if (datePreset === '7d' && (dk < sevenDaysStr || dk > todayWitaKey)) return;
        if (datePreset === '30d' && (dk < thirtyDaysStr || dk > todayWitaKey)) return;
        if (datePreset === 'custom') {
          if (startDate && dk < startDate) return;
          if (endDate && dk > endDate) return;
        }

        if (!matchesCommon(rec.name, rec.nip || '', rec.division, rec.subdepartmentId)) return;
        if (selectedMode !== 'Semua' && rec.mode !== selectedMode) return;

        if (selectedStatus === 'Tepat Waktu' && timing.status !== 'Tepat Waktu') return;
        if (
          selectedStatus === 'Terlambat' &&
          timing.lateMinutes <= 0
        ) {
          return;
        }
        if (selectedStatus === 'Pulang Cepat' && timing.earlyLeaveMinutes <= 0) return;
        if (selectedStatus === 'Belum Pulang' && rec.exited) return;

        const displayStatus =
          selectedStatus === 'Belum Pulang' && timing.isTodayOpen
            ? 'Belum Absen Pulang'
            : timing.status;

        rows.push({
          key: `rec-${rec.id || rec.nip || rec.name}-${idx}`,
          record: rec,
          name: rec.name,
          nip: rec.nip || '-',
          division: rec.division,
          mode: rec.mode,
          dateKey: dk,
          tanggalLabel: formatWitaDateLabel(dk),
          masukLabel: `${timing.enteredParts.timeLabel} WITA`,
          pulangLabel: timing.exitedParts
            ? `${timing.exitedParts.timeLabel} WITA`
            : timing.isMissedCheckOut
            ? 'Tidak absen pulang'
            : 'Belum pulang',
          lateMinutes: timing.lateMinutes,
          earlyLeaveMinutes: timing.earlyLeaveMinutes,
          status: displayStatus,
          sortTime: new Date(rec.entered).getTime(),
        });
      });

      rows.sort((a, b) => b.sortTime - a.sortTime);
    }

    if (
      (selectedStatus === 'Semua' && datePreset === 'today') ||
      selectedStatus === 'Belum Absen'
    ) {
      if (selectedMode === 'Semua') {
        const presentUids = new Set<string>();
        const presentNips = new Set<string>();
        data.records.forEach((rec) => {
          const dk = evaluateRecordTiming(rec, todayWitaKey, data.workHours).dateKey;
          if (dk === targetCheckDate) {
            if (rec.uid) presentUids.add(rec.uid);
            if (rec.nip) presentNips.add(rec.nip.trim());
          }
        });

        data.employees
          .filter((e) => e.active !== false)
          .forEach((emp) => {
            if (presentUids.has(emp.id) || (emp.nip && presentNips.has(emp.nip.trim()))) return;
            const unitStr = resolveUnitDisplay({
              departmentId: emp.departmentId,
              subdepartmentId: emp.subdepartmentId,
              positionLabel: emp.positionLabel,
              role: emp.role,
            });
            if (!matchesCommon(emp.name, emp.nip, unitStr, emp.subdepartmentId)) return;

            rows.push({
              key: `abs-${emp.id}`,
              record: null,
              name: emp.name,
              nip: emp.nip || '-',
              division: unitStr,
              mode: '-',
              dateKey: targetCheckDate,
              tanggalLabel: formatWitaDateLabel(targetCheckDate),
              masukLabel: '—',
              pulangLabel: '—',
              lateMinutes: 0,
              earlyLeaveMinutes: 0,
              status: 'Belum / Tidak Absen',
              sortTime: 0,
            });
          });
      }
    }

    return rows;
  }, [
    data.records,
    data.employees,
    data.workHours,
    searchQuery,
    selectedSubbagian,
    selectedStatus,
    selectedMode,
    datePreset,
    startDate,
    endDate,
    todayWitaKey,
    targetCheckDate,
  ]);

  const totalPages = Math.max(1, Math.ceil(unifiedRows.length / PAGE_SIZE));
  const pagedRows = unifiedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedSubbagian('Semua');
    setSelectedStatus('Semua');
    setSelectedMode('Semua');
    setDatePreset('today');
    setStartDate('');
    setEndDate('');
    showToast('info', 'Filter Direset', 'Filter rekapitulasi dikembalikan ke tampilan hari ini.');
  };

  const handleDownloadReport = () => {
    if (unifiedRows.length === 0) {
      showToast('warning', 'Tidak Ada Data', 'Tidak ada baris presensi yang sesuai filter saat ini.');
      return;
    }

    const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'No',
      'Nama Lengkap',
      'NIP',
      'Unit / Jabatan',
      'Metode',
      'Tanggal (WITA)',
      'Masuk (WITA)',
      'Pulang (WITA)',
      'Telat (Menit)',
      'Pulang Cepat (Menit)',
      'Status',
    ];
    const csvRows = unifiedRows.map((row, idx) =>
      [
        String(idx + 1),
        row.name,
        row.nip,
        row.division,
        row.mode,
        row.dateKey,
        row.masukLabel,
        row.pulangLabel,
        String(row.lateMinutes),
        String(row.earlyLeaveMinutes),
        row.status,
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...csvRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap-presensi-kpu-sulut-${todayWitaKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      'Laporan Diunduh',
      `File rekap-presensi-kpu-sulut-${todayWitaKey}.csv (${unifiedRows.length} baris) berhasil diunduh.`
    );
  };

  return (
    <>
      <Topbar title="Rekapitulasi Kehadiran" />
      <main className="p-4 sm:p-6 xl:p-8 space-y-5 w-full max-w-[1440px]">
        {/* Filter Panel */}
        <section className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama atau NIP pegawai..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#07142F]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                aria-label="Filter subbagian"
                value={selectedSubbagian}
                onChange={(e) => setSelectedSubbagian(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-800"
              >
                <option value="Semua">Semua Subbagian</option>
                {ALL_SUBDEPARTMENTS.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter mode kerja"
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-800"
              >
                <option value="Semua">Semua Mode</option>
                <option value="WFO">WFO</option>
                <option value="WFH">WFH</option>
              </select>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
                <select
                  aria-label="Pilih rentang tanggal"
                  value={datePreset}
                  onChange={(e) =>
                    setDatePreset(e.target.value as 'today' | '7d' | '30d' | 'all' | 'custom')
                  }
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-800"
                >
                  <option value="today">Hari Ini</option>
                  <option value="7d">7 Hari Terakhir</option>
                  <option value="30d">30 Hari Terakhir</option>
                  <option value="all">Semua Riwayat</option>
                  <option value="custom">Rentang Kustom...</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleDownloadReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D52832] hover:bg-[#B91C1C] text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {datePreset === 'custom' && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold text-slate-600">Rentang Tanggal (WITA):</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
              <span className="text-slate-400">s.d.</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
          )}

          {/* Status Filter Tabs */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_TABS.map((tab) => {
                const active = selectedStatus === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedStatus(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#07142F] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {(searchQuery ||
              selectedSubbagian !== 'Semua' ||
              selectedMode !== 'Semua' ||
              selectedStatus !== 'Semua' ||
              datePreset !== 'today') && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#D52832] hover:bg-rose-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </section>

        {/* Data Table */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Menampilkan <strong className="text-slate-900 tabular-nums">{unifiedRows.length}</strong>{' '}
              catatan
            </span>
            {(selectedStatus === 'Semua' && datePreset === 'today') ||
            selectedStatus === 'Belum Absen' ? (
              <span>
                Acuan pengecekan belum absen:{' '}
                <strong className="text-slate-700">{formatWitaDateLabel(targetCheckDate)}</strong>
              </span>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Pegawai &amp; NIP</th>
                  <th className="px-4 py-3">Unit / Jabatan</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Masuk</th>
                  <th className="px-4 py-3">Pulang</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedRows.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{row.name}</div>
                      <div className="text-[11px] font-mono tabular-nums text-slate-500">
                        {row.nip}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[200px] truncate">
                      {row.division}
                    </td>
                    <td className="px-4 py-3.5">
                      <ModeBadge mode={row.mode} />
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <div className="font-mono font-semibold tabular-nums text-slate-900">
                        {row.masukLabel}
                      </div>
                      <div className="text-[11px] text-slate-500">{row.tanggalLabel}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono tabular-nums text-slate-600">
                      {row.pulangLabel}
                    </td>
                    <td className="px-4 py-3.5">
                      <AttendanceStatusBadge status={row.status} />
                      {row.lateMinutes > 0 && (
                        <div className="text-[11px] text-amber-700 mt-0.5 tabular-nums">
                          +{row.lateMinutes} mnt telat
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {row.record ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDetail(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#07142F] hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {pagedRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                      Tidak ada data presensi yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {unifiedRows.length > PAGE_SIZE && (
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="tabular-nums">
                Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-medium"
                >
                  Berikutnya
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Attendance Verification Slide-Over Drawer */}
        {selectedDetail?.record && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/45 flex justify-end"
            onClick={() => setSelectedDetail(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="detail-drawer-title"
              className="bg-white w-full max-w-md h-full border-l border-slate-200 shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 id="detail-drawer-title" className="text-base font-bold text-slate-900">
                    Bukti Verifikasi Presensi
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedDetail.tanggalLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  aria-label="Tutup panel detail"
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-900">{selectedDetail.name}</p>
                  <p className="text-xs font-mono tabular-nums text-slate-500">
                    NIP {selectedDetail.nip}
                  </p>
                  <p className="text-xs text-slate-600">{selectedDetail.division}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <ModeBadge mode={selectedDetail.mode} />
                    <AttendanceStatusBadge status={selectedDetail.status} />
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs">
                  <div>
                    <dt className="text-slate-500">Masuk</dt>
                    <dd className="font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                      {selectedDetail.masukLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Pulang</dt>
                    <dd className="font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                      {selectedDetail.pulangLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Keterlambatan</dt>
                    <dd className="font-semibold tabular-nums text-slate-900 mt-0.5">
                      {selectedDetail.lateMinutes} menit
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Pulang Cepat</dt>
                    <dd className="font-semibold tabular-nums text-slate-900 mt-0.5">
                      {selectedDetail.earlyLeaveMinutes} menit
                    </dd>
                  </div>
                </dl>

                {/* Geofence & Auth Metadata */}
                <div className="space-y-2.5 text-xs">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D52832]" />
                    Data Lokasi &amp; Autentikasi
                  </h3>
                  <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Koordinat</span>
                      <span className="font-mono tabular-nums text-slate-900">
                        {selectedDetail.record.latitude != null &&
                        selectedDetail.record.longitude != null
                          ? `${selectedDetail.record.latitude.toFixed(5)}, ${selectedDetail.record.longitude.toFixed(5)}`
                          : 'Tidak tercatat (WFH)'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Jarak dari Kantor</span>
                      <span className="font-mono tabular-nums text-slate-900">
                        {selectedDetail.record.distanceMeters != null
                          ? `${selectedDetail.record.distanceMeters} meter`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Metode Verifikasi</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-900 capitalize">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {selectedDetail.record.authMethod || 'Akun Terverifikasi'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selfie Photos */}
                <div className="space-y-2.5 text-xs">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#07142F]" />
                    Bukti Foto Selfie
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                      <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                        Selfie Masuk
                      </p>
                      {selectedDetail.record.checkInSelfieUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedDetail.record.checkInSelfieUrl}
                          alt={`Selfie masuk ${selectedDetail.name}`}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="h-32 flex items-center justify-center text-slate-400 text-[11px] px-3 text-center">
                          Tidak ada foto selfie masuk
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                      <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                        Selfie Pulang
                      </p>
                      {selectedDetail.record.checkOutSelfieUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedDetail.record.checkOutSelfieUrl}
                          alt={`Selfie pulang ${selectedDetail.name}`}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="h-32 flex items-center justify-center text-slate-400 text-[11px] px-3 text-center">
                          Belum ada foto pulang
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
