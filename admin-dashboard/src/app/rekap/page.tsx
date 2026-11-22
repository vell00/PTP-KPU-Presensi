'use client';

import React, { useState, useMemo } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { Search, Download, Building2, Home, Filter, RefreshCw } from 'lucide-react';

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

export default function RekapPage() {
  const { data } = useWorkspace();
  const [searchName, setSearchName] = useState('');
  const [selectedSubbagian, setSelectedSubbagian] = useState('Semua');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedMode, setSelectedMode] = useState('Semua');

  const handleQuickFilterClick = (filterId: string) => {
    if (activeQuickFilter === filterId) {
      setActiveQuickFilter(null); // toggle off jika ditekan kembali
    } else {
      setActiveQuickFilter(filterId);
      setSelectedSubbagian('Semua'); // reset dropdown subbagian jika quick filter ditekan
    }
  };

  const handleSubbagianChange = (value: string) => {
    setSelectedSubbagian(value);
    if (value !== 'Semua') {
      setActiveQuickFilter(null); // reset quick filter jika memilih dropdown subbagian
    }
  };

  const resetAllFilters = () => {
    setSearchName('');
    setSelectedSubbagian('Semua');
    setActiveQuickFilter(null);
    setSelectedStatus('Semua');
    setSelectedMode('Semua');
  };

  const filteredRecords = useMemo(() => {
    return data.records.filter((rec) => {
      // 1. Filter Nama
      if (searchName && !rec.name.toLowerCase().includes(searchName.toLowerCase())) {
        return false;
      }

      // 2. Filter Quick Role Button
      if (activeQuickFilter) {
        const filterItem = QUICK_FILTERS.find((f) => f.id === activeQuickFilter);
        if (filterItem) {
          const match = filterItem.match.some((kw) =>
            rec.division.toLowerCase().includes(kw.toLowerCase())
          );
          if (!match) return false;
        }
      }

      // 3. Filter Dropdown Subbagian
      if (selectedSubbagian !== 'Semua') {
        const matchSubbagian = rec.division.toLowerCase().includes(selectedSubbagian.toLowerCase());
        if (!matchSubbagian) return false;
      }

      // 4. Filter Mode WFO / WFH
      if (selectedMode !== 'Semua' && rec.mode !== selectedMode) {
        return false;
      }

      // 5. Filter Status Kehadiran
      const enterDate = new Date(rec.entered);
      const isLate =
        enterDate.getHours() > 8 ||
        (enterDate.getHours() === 8 && enterDate.getMinutes() > 0);
      const status = isLate ? 'Terlambat' : 'Tepat Waktu';
      if (selectedStatus !== 'Semua' && status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [data.records, searchName, selectedSubbagian, activeQuickFilter, selectedStatus, selectedMode]);

  return (
    <>
      <Topbar title="Rekapitulasi Kehadiran Pegawai" />
      <main className="p-4 sm:p-8 space-y-6 max-w-7xl">
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
              {/* Dropdown Semua Unit Subbagian */}
              <div className="flex items-center gap-1.5">
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
              </div>

              {/* Mode WFO/WFH */}
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#07142F] focus:outline-none focus:ring-2 focus:ring-[#D52832]"
              >
                <option value="Semua">Semua Mode</option>
                <option value="WFO">WFO (Kantor)</option>
                <option value="WFH">WFH (Rumah)</option>
              </select>

              {/* Status Tepat Waktu/Terlambat */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#07142F] focus:outline-none focus:ring-2 focus:ring-[#D52832]"
              >
                <option value="Semua">Semua Status</option>
                <option value="Tepat Waktu">Tepat Waktu</option>
                <option value="Terlambat">Terlambat</option>
              </select>

              {/* Unduh Laporan */}
              <button
                onClick={() => {
                  alert('Laporan rekap kehadiran siap diunduh / dicetak.');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D52832] hover:bg-[#B91C1C] text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Unduh Laporan</span>
              </button>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
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
                searchName !== '') && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-[#D52832] bg-slate-100 hover:bg-slate-200 transition-colors ml-auto"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Data Rekap */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredRecords.length}</strong> data presensi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
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
                {filteredRecords.map((rec, idx) => {
                  const enterDate = new Date(rec.entered);
                  const isLate =
                    enterDate.getHours() > 8 ||
                    (enterDate.getHours() === 8 && enterDate.getMinutes() > 0);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{rec.name}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{rec.division}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                            rec.mode === 'WFO'
                              ? 'bg-rose-50 text-[#D52832] border border-rose-200'
                              : 'bg-slate-100 text-[#07142F] border border-slate-300'
                          }`}
                        >
                          {rec.mode === 'WFO' ? (
                            <Building2 className="w-3.5 h-3.5" />
                          ) : (
                            <Home className="w-3.5 h-3.5" />
                          )}
                          {rec.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-medium text-slate-900">
                          {enterDate.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WITA
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {enterDate.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {rec.exited
                          ? new Date(rec.exited).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isLate
                              ? 'bg-rose-50 text-[#D52832] border border-rose-200'
                              : 'bg-white text-[#07142F] border border-[#07142F]'
                          }`}
                        >
                          {isLate ? 'Terlambat' : 'Tepat Waktu'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada data presensi yang ditemukan.
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
