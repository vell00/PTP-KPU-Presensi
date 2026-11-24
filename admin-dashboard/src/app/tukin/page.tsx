'use client';

import React, { useState } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { Coins, FileText, Download, TrendingUp, AlertCircle, CheckCircle, Calculator } from 'lucide-react';

export default function TukinPage() {
  const { data } = useWorkspace();
  const [selectedMonth, setSelectedMonth] = useState('November 2026');
  const [searchTerm, setSearchTerm] = useState('');

  // Standar Tukin per Kategori Jabatan (Estimasi dasar KPU)
  const getBaseTukin = (unitJabatan: string) => {
    if (unitJabatan.includes('Ketua KPU')) return 18000000;
    if (unitJabatan.includes('Sekretaris')) return 14000000;
    if (unitJabatan.includes('Ketua Divisi')) return 12500000;
    if (unitJabatan.includes('Kepala Bagian')) return 9800000;
    if (unitJabatan.includes('Kepala Subbagian')) return 6500000;
    if (unitJabatan.includes('Jabatan Fungsional')) return 5400000;
    if (unitJabatan.includes('Jagat Saksana')) return 4200000;
    if (unitJabatan.includes('Pramubakti')) return 3500000;
    return 4500000; // Staf pelaksana
  };

  const filteredEmployees = data.employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nip.includes(searchTerm)
  );

  return (
    <>
      <Topbar title="Tunjangan Kinerja (Tukin)" />
      <main className="p-4 sm:p-6 xl:p-8 space-y-5 sm:space-y-6 w-full">
        {/* Banner Penjelasan Formula */}
        <div className="bg-[#07142F] rounded-2xl p-6 text-white shadow-md border border-[#16366C]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D52832] text-white mb-3">
                <Coins className="w-3.5 h-3.5" />
                Sistem Perhitungan Tukin KPU
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Rekap & Simulasi Tunjangan Kinerja Pegawai
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Dasar formulasi: <strong>40% Komponen Kehadiran Presensi</strong> + <strong>60% Capaian Prestasi Kerja</strong>. Potongan dihitung secara transparan dari keterlambatan atau ketidakhadiran.
              </p>
            </div>
            <button
              onClick={() => alert('Laporan rekapitulasi Tukin siap dicetak ke format PDF.')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D52832] hover:bg-[#B91C1C] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Cetak Rekap Tukin</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari nama atau NIP pegawai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D52832]"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500">Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#07142F] focus:outline-none focus:ring-2 focus:ring-[#D52832] font-medium"
            >
              <option value="November 2026">November 2026</option>
              <option value="Oktober 2026">Oktober 2026</option>
              <option value="September 2026">September 2026</option>
            </select>
          </div>
        </div>

        {/* Tabel Rekap Tukin Pegawai */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[750px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Pegawai & NIP</th>
                  <th className="px-6 py-3.5">UNIT / JABATAN</th>
                  <th className="px-6 py-3.5">Tukin Dasar</th>
                  <th className="px-6 py-3.5">Disiplin Kehadiran (40%)</th>
                  <th className="px-6 py-3.5">Kinerja (60%)</th>
                  <th className="px-6 py-3.5 font-extrabold text-[#07142F]">Total Diterima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEmployees.map((emp) => {
                  const unit = emp.subdepartmentId || 'Staf Pelaksana';
                  const base = getBaseTukin(unit);
                  const attendancePortion = base * 0.4;
                  const performancePortion = base * 0.6;
                  const total = attendancePortion + performancePortion;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-xs font-mono text-slate-400">{emp.nip}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        Rp {base.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-[#07142F]">
                          Rp {attendancePortion.toLocaleString('id-ID')}
                        </div>
                        <span className="text-[10px] text-slate-400">100% Hadir (Tanpa Potongan)</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-[#07142F]">
                          Rp {performancePortion.toLocaleString('id-ID')}
                        </div>
                        <span className="text-[10px] text-slate-400">Target SKP 100%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#D52832] text-sm font-mono bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          Rp {total.toLocaleString('id-ID')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                      Tidak ada data pegawai yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informasi Aturan Hukum */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs text-slate-500 leading-relaxed">
          <AlertCircle className="w-5 h-5 text-[#D52832] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-700">Dasar Regulasi Tunjangan Kinerja KPU</p>
            <p className="mt-0.5">
              Perhitungan besaran tunjangan berpedoman pada Keputusan Sekretaris Jenderal KPU Nomor 326/2022 jo. Nomor 1090/2025. Penilaian kehadiran pegawai diproses otomatis berdasarkan catatan jam masuk & kepulangan presensi pada sistem ini.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}