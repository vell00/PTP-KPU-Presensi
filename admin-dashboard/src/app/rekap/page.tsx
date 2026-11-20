'use client';

import React, { useState, useMemo } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { DIVISIONS } from '@/lib/constants';
import { Search, Download, Building2, Home } from 'lucide-react';

export default function RekapPage() {
  const { data } = useWorkspace();
  const [searchName, setSearchName] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedMode, setSelectedMode] = useState('Semua');

  const filteredRecords = useMemo(() => {
    return data.records.filter((rec) => {
      if (searchName && !rec.name.toLowerCase().includes(searchName.toLowerCase())) {
        return false;
      }
      if (selectedDivision !== 'Semua' && rec.division !== selectedDivision) {
        return false;
      }
      if (selectedMode !== 'Semua' && rec.mode !== selectedMode) {
        return false;
      }
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
  }, [data.records, searchName, selectedDivision, selectedStatus, selectedMode]);

  return (
    <>
      <Topbar title="Rekapitulasi Kehadiran Pegawai" />
      <main className="p-4 sm:p-8 space-y-6 max-w-7xl">
        {/* Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari nama pegawai..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Semua">Semua Subdivisi</option>
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Semua">Semua Mode</option>
                <option value="WFO">WFO (Kantor)</option>
                <option value="WFH">WFH (Rumah)</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Semua">Semua Status</option>
                <option value="Tepat Waktu">Tepat Waktu</option>
                <option value="Terlambat">Terlambat</option>
              </select>

              <button
                onClick={() => {
                  alert('Laporan siap dicetak / diunduh.');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Unduh Laporan</span>
              </button>
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
                  <th className="px-6 py-3.5">Subdivisi</th>
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
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                              : 'bg-blue-50 text-blue-700 border border-blue-200/50'
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
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
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
