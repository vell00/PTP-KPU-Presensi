'use client';

import React, { useState, useMemo } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { useFeedback } from '@/components/FeedbackProvider';
import { Search, Download, Building2, Home, Filter, RefreshCw, Calendar } from 'lucide-react';

// Daftar 6 Unit Subbagian KPU Sulut
const SUBBAGIAN_LIST = [
  'Keuangan',
  'Umum dan Logistik',
  'Teknis Penyelenggaraan Pemilu',
  'Hukum',
  'Perencanaan Data dan Informasi',
  'Partisipasi, Humas & SDM',
];

// Tombol Filter Cepat (Single-Click Filter)
const QUICK_FILTERS = [
  { id: 'jagat_saksana', label: 'Jagat Saksana', match: ['Jagat Saksana'] },
  { id: 'pramubakti', label: 'Pramubakti', match: ['Pramubakti'] },
  { id: 'kasubag', label: 'Kasubag', match: ['Kepala Subbagian'] },
  { id: 'kabag', label: 'Kabag', match: ['Kepala Bagian'] },
  { id: 'jf', label: 'Jabatan Fungsional', match: ['Jabatan Fungsional'] },
  { id: 'kadiv', label: 'Kadiv', match: ['Ketua Divisi'] },
  { id: 'sekretaris', label: 'Sekretaris KPU Sulut', match: ['Sekretaris'] },
  { id: 'ketua', label: 'Ketua KPU Sulut', match: ['Ketua KPU'] },
];

const STATUS_TABS = [
  { id: 'Semua', label: 'Semua' },
  { id: 'Tepat Waktu', label: 'Tepat Waktu' },
  { id: 'Terlambat', label: 'Terlambat' },
  { id: 'Belum Absen Pulang', label: 'Belum Absen Pulang' },
  { id: 'Belum Absen', label: 'Belum / Tidak Absen' },
] as const;

interface UnifiedRow {
  key: string;
  name: string;
  nip: string;
  division: string;
  mode: string;
  entered: string | null;
  exited: string | null;
  tanggalLabel: string;
  masukLabel: string;
  pulangLabel: string;
  status: 'Tepat Waktu' | 'Terlambat' | 'Tidak Absen Pulang' | 'Belum Absen Pulang' | 'Belum / Tidak Absen';
  sortTime: number;
}

export default function RekapPage() {
  const { data } = useWorkspace();
  const { showToast } = useFeedback();
  const [searchName, setSearchName] = useState('');
  const [selectedSubbagian, setSelectedSubbagian] = useState('Semua');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedMode, setSelectedMode] = useState('Semua');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleQuickFilterClick = (filterId: string) => {
    if (activeQuickFilter === filterId) {
      setActiveQuickFilter(null);
    } else {
      setActiveQuickFilter(filterId);
      setSelectedSubbagian('Semua');
    }
  };

  const handleSubbagianChange = (value: string) => {
    setSelectedSubbagian(value);
    if (value !== 'Semua') {
      setActiveQuickFilter(null);
    }
  };

  const resetAllFilters = () => {
    setSearchName('');
    setSelectedSubbagian('Semua');
    setActiveQuickFilter(null);
    setSelectedStatus('Semua');
    setSelectedMode('Semua');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    showToast('info', 'Filter Direset', 'Semua filter pencarian dan tanggal telah dikembalikan ke awal.');
  };

  const toLocalDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const targetCheckDate = useMemo(() => {
    if (datePreset === 'custom' && startDate) return startDate;
    return toLocalDateStr(new Date());
  }, [datePreset, startDate]);

  const unifiedRows = useMemo(() => {
    const now = new Date();
    const todayStr = toLocalDateStr(now);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    const sevenDaysStr = toLocalDateStr(sevenDaysAgo);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);
    const thirtyDaysStr = toLocalDateStr(thirtyDaysAgo);

    const matchesCommon = (name: string, division: string) => {
      if (searchName && !name.toLowerCase().includes(searchName.toLowerCase())) {
        return false;
      }
      if (activeQuickFilter) {
        const filterItem = QUICK_FILTERS.find((f) => f.id === activeQuickFilter);
        if (filterItem) {
          const match = filterItem.match.some((kw) =>
            division.toLowerCase().includes(kw.toLowerCase())
          );
          if (!match) return false;
        }
      }
      if (selectedSubbagian !== 'Semua') {
        if (!division.toLowerCase().includes(selectedSubbagian.toLowerCase())) {
          return false;
        }
      }
      return true;
    };

    const rows: UnifiedRow[] = [];

    // 1. Data pegawai yang sudah melakukan presensi
    if (selectedStatus !== 'Belum Absen') {
      data.records.forEach((rec, idx) => {
        const enterDate = new Date(rec.entered);
        const recDateStr = toLocalDateStr(enterDate);

        if (datePreset === 'today' && recDateStr !== todayStr) return;
        if (datePreset === '7d' && (recDateStr < sevenDaysStr || recDateStr > todayStr)) return;
        if (datePreset === '30d' && (recDateStr < thirtyDaysStr || recDateStr > todayStr)) return;
        if (datePreset === 'custom') {
          if (startDate && recDateStr < startDate) return;
          if (endDate && recDateStr > endDate) return;
        }

        if (!matchesCommon(rec.name, rec.division)) return;
        if (selectedMode !== 'Semua' && rec.mode !== selectedMode) return;

        const isLate =
          enterDate.getHours() > 8 ||
          (enterDate.getHours() === 8 && enterDate.getMinutes() > 0);
        const isPastMissedCheckOut = !rec.exited && recDateStr < todayStr;
        const isTodayNotCheckedOut = !rec.exited && recDateStr === todayStr;

        let displayStatus: UnifiedRow['status'];
        if (isPastMissedCheckOut) {
          displayStatus = 'Tidak Absen Pulang';
        } else if (isTodayNotCheckedOut && selectedStatus === 'Belum Absen Pulang') {
          displayStatus = 'Belum Absen Pulang';
        } else {
          displayStatus = isLate ? 'Terlambat' : 'Tepat Waktu';
        }

        if (selectedStatus === 'Tepat Waktu' && (isLate || isPastMissedCheckOut)) return;
        if (selectedStatus === 'Terlambat' && (!isLate || isPastMissedCheckOut)) return;
        if (selectedStatus === 'Belum Absen Pulang' && rec.exited) return;

        rows.push({
          key: `rec-${rec.nip || rec.name}-${rec.entered}-${idx}`,
          name: rec.name,
          nip: rec.nip || '-',
          division: rec.division,
          mode: rec.mode,
          entered: rec.entered,
          exited: rec.exited || null,
          tanggalLabel: enterDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          masukLabel: `${enterDate.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })} WITA`,
          pulangLabel: rec.exited
            ? `${new Date(rec.exited).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })} WITA`
            : isPastMissedCheckOut
            ? 'Tidak absen keluar'
            : 'Belum absen pulang',
          status: displayStatus,
          sortTime: enterDate.getTime(),
        });
      });

      rows.sort((a, b) => b.sortTime - a.sortTime);
    }

    // 2. Data pegawai yang belum / tidak absen pada targetCheckDate
    if (selectedStatus === 'Semua' || selectedStatus === 'Belum Absen') {
      if (selectedMode === 'Semua') {
        const presentNips = new Set<string>();
        const presentNames = new Set<string>();
        data.records.forEach((rec) => {
          if (toLocalDateStr(new Date(rec.entered)) === targetCheckDate) {
            if (rec.nip) presentNips.add(rec.nip.trim());
            if (rec.name) presentNames.add(rec.name.trim().toLowerCase());
          }
        });

        const formattedTargetDate = new Date(`${targetCheckDate}T00:00:00`).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        data.employees.forEach((emp) => {
          const isPresent =
            (emp.nip && presentNips.has(emp.nip.trim())) ||
            (emp.name && presentNames.has(emp.name.trim().toLowerCase()));
          if (isPresent) return;

          const unitStr = emp.subdepartmentId || emp.departmentId || '-';
          if (!matchesCommon(emp.name, unitStr)) return;

          rows.push({
            key: `abs-${emp.id}`,
            name: emp.name,
            nip: emp.nip || '-',
            division: unitStr,
            mode: '-',
            entered: null,
            exited: null,
            tanggalLabel: formattedTargetDate,
            masukLabel: '—',
            pulangLabel: '—',
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
    searchName,
    selectedSubbagian,
    activeQuickFilter,
    selectedStatus,
    selectedMode,
    datePreset,
    startDate,
    endDate,
    targetCheckDate,
  ]);

  const handleDownloadReport = () => {
    if (unifiedRows.length === 0) {
      showToast('warning', 'Tidak Ada Data', 'Tidak ada data presensi yang dapat diunduh sesuai filter saat ini.');
      return;
    }

    const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'No',
      'Nama Lengkap',
      'NIP',
      'Unit / Jabatan',
      'Metode',
      'Tanggal',
      'Waktu Masuk (WITA)',
      'Waktu Pulang (WITA)',
      'Status',
    ];

    const csvRows = unifiedRows.map((row, idx) =>
      [
        String(idx + 1),
        row.name,
        row.nip,
        row.division,
        row.mode,
        row.tanggalLabel,
        row.masukLabel,
        row.pulangLabel,
        row.status,
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...csvRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `rekap-presensi-kpu-sulut-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      'Laporan Berhasil Diunduh',
      `File rekap-presensi-kpu-sulut-${todayStr}.csv (${unifiedRows.length} baris) telah diunduh.`
    );
  };

  return (
    <>
      <Topbar title="Rekapitulasi Kehadiran Pegawai" />
      <main className="p-4 sm:p-6 xl:p-8 space-y-5 sm:space-y-6 w-full">
        {/* Filter Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
            {/* Input Pencarian Nama */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari nama pegawai..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D52832]"
              />
            </div>

            {/* Dropdown Filters & Download */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedSubbagian}
                onChange={(e) => handleSubbagianChange(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-[#07142F] focus:outline-none focus:ring-2 focus:ring-[#D52832]"
              >
                <option value="Semua">Semua Unit Subbagian</option>
                {SUBBAGIAN_LIST.map((sub) => (
                  <option key={sub} value={sub}>
                    Subbagian {sub}
                  </option>
                ))}
              </select>

              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#07142F] focus:outline-none focus:ring-2 focus:ring-[#D52832]"
              >
                <option value="Semua">Semua Mode</option>
                <option value="WFO">WFO (Kantor)</option>
                <option value="WFH">WFH (Rumah)</option>
              </select>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D52832] hidden sm:block" />
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value as 'all' | 'today' | '7d' | '30d' | 'custom')}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-[#07142F] focus:outline-none focus:ring-2 focus:ring-[#D52832]"
                >
                  <option value="all">Semua Riwayat Tanggal</option>
                  <option value="today">Hari Ini</option>
                  <option value="7d">7 Hari Terakhir</option>
                  <option value="30d">30 Hari Terakhir</option>
                  <option value="custom">Pilih Tanggal...</option>
                </select>
              </div>

              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D52832] hover:bg-[#B91C1C] text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Unduh Laporan</span>
              </button>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {datePreset === 'custom' && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-600">Rentang Tanggal:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#07142F] focus:outline-none focus:ring-2 focus:ring-[#D52832]"
              />
              <span className="text-slate-400 font-semibold">s.d.</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#07142F] focus:outline-none focus:ring-2 focus:ring-[#D52832]"
              />
            </div>
          )}

          {/* Filter Status Kehadiran (Tabs 1 Klik) */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-bold text-slate-500 shrink-0">Status Kehadiran:</span>
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {STATUS_TABS.map((tab) => {
                const isActive = selectedStatus === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedStatus(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#07142F] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Filter Tombol Sekali Pencet */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#D52832]" />
              <span>Filter Cepat Jabatan:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {QUICK_FILTERS.map((qf) => {
                const isActive = activeQuickFilter === qf.id;
                return (
                  <button
                    key={qf.id}
                    type="button"
                    onClick={() => handleQuickFilterClick(qf.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                      isActive
                        ? 'bg-[#D52832] text-white border border-[#D52832]'
                        : 'bg-white hover:bg-slate-50 text-[#07142F] border border-slate-200'
                    }`}
                  >
                    {qf.label}
                  </button>
                );
              })}

              {(activeQuickFilter !== null ||
                selectedSubbagian !== 'Semua' ||
                selectedMode !== 'Semua' ||
                selectedStatus !== 'Semua' ||
                datePreset !== 'all' ||
                searchName !== '') && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-[#D52832] bg-slate-100 hover:bg-slate-200 transition-colors ml-auto cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 1 Tabel Terpadu Data Rekap Kehadiran */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Menampilkan <strong className="text-slate-800">{unifiedRows.length}</strong> data pegawai &amp; presensi
            </span>
            {(selectedStatus === 'Semua' || selectedStatus === 'Belum Absen') && (
              <span className="text-[11px] text-slate-400">
                Pengecekan pegawai belum absen untuk tanggal: <strong className="text-slate-600">{targetCheckDate}</strong>
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama Lengkap</th>
                  <th className="px-6 py-3.5">UNIT / JABATAN</th>
                  <th className="px-6 py-3.5">Metode</th>
                  <th className="px-6 py-3.5">Waktu Masuk</th>
                  <th className="px-6 py-3.5">Waktu Pulang</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {unifiedRows.map((row) => {
                  const statusBadgeClass =
                    row.status === 'Tepat Waktu'
                      ? 'bg-white text-[#07142F] border border-[#07142F]'
                      : row.status === 'Belum Absen Pulang' || row.status === 'Tidak Absen Pulang'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-[#D52832] border border-rose-200';

                  return (
                    <tr key={row.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{row.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{row.nip}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{row.division}</td>
                      <td className="px-6 py-4">
                        {row.mode === '-' ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                              row.mode === 'WFO'
                                ? 'bg-rose-50 text-[#D52832] border border-rose-200'
                                : 'bg-slate-100 text-[#07142F] border border-slate-300'
                            }`}
                          >
                            {row.mode === 'WFO' ? (
                              <Building2 className="w-3.5 h-3.5" />
                            ) : (
                              <Home className="w-3.5 h-3.5" />
                            )}
                            {row.mode}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-medium text-slate-900">{row.masukLabel}</div>
                        <div className="text-[11px] text-slate-400">{row.tanggalLabel}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{row.pulangLabel}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadgeClass}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {unifiedRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada data pegawai atau presensi yang ditemukan pada filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
