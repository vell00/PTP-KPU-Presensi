'use client';

import React, { useState } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { useFeedback } from '@/components/FeedbackProvider';
import { Coins, Download, AlertCircle, Calculator, RotateCcw } from 'lucide-react';

interface JabatanTukinInfo {
  kategori: string;
  kelasLabel: string;
  nilaiJabatan: number;
  defaultIndeks: number;
  dasarHukum: string;
}

const JABATAN_STANDAR_KPU: JabatanTukinInfo[] = [
  {
    kategori: 'Ketua KPU Provinsi',
    kelasLabel: 'Pimpinan KPU',
    nilaiJabatan: 4043,
    defaultIndeks: 5000,
    dasarHukum: 'Perpres 11/2016 (Uang Kehormatan)',
  },
  {
    kategori: 'Ketua Divisi / Anggota KPU Provinsi',
    kelasLabel: 'Pimpinan KPU',
    nilaiJabatan: 3713,
    defaultIndeks: 5000,
    dasarHukum: 'Perpres 11/2016 (Uang Kehormatan)',
  },
  {
    kategori: 'Sekretaris KPU Provinsi',
    kelasLabel: 'Kelas 15',
    nilaiJabatan: 3271,
    defaultIndeks: 4500,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Kepala Bagian',
    kelasLabel: 'Kelas 12',
    nilaiJabatan: 2203,
    defaultIndeks: 3300,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Kepala Subbagian',
    kelasLabel: 'Kelas 9',
    nilaiJabatan: 1454,
    defaultIndeks: 2600,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Jabatan Fungsional',
    kelasLabel: 'Kelas 8',
    nilaiJabatan: 1276,
    defaultIndeks: 2600,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Staf Pelaksana',
    kelasLabel: 'Kelas 7',
    nilaiJabatan: 1045,
    defaultIndeks: 2800,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Jagat Saksana',
    kelasLabel: 'Kelas 5',
    nilaiJabatan: 623,
    defaultIndeks: 4000,
    dasarHukum: 'Perpres 126/2017 & PermenPANRB 34/2011',
  },
  {
    kategori: 'Pramubakti / PPNPN',
    kelasLabel: 'Kelas 3',
    nilaiJabatan: 369,
    defaultIndeks: 6000,
    dasarHukum: 'Standar PPNPN KPU Provinsi',
  },
];

function resolveJabatanInfo(unitJabatan: string, role?: string): JabatanTukinInfo {
  const u = unitJabatan.toLowerCase();
  if (u.includes('ketua kpu')) return JABATAN_STANDAR_KPU[0];
  if (u.includes('ketua divisi') || u.includes('kadiv')) return JABATAN_STANDAR_KPU[1];
  if (u.includes('sekretaris')) return JABATAN_STANDAR_KPU[2];
  if (u.includes('kepala bagian') || role === 'kepala_bagian') return JABATAN_STANDAR_KPU[3];
  if (u.includes('kepala subbagian') || u.includes('kasubag') || role === 'kepala_sub_bagian') return JABATAN_STANDAR_KPU[4];
  if (u.includes('fungsional')) return JABATAN_STANDAR_KPU[5];
  if (u.includes('jagat saksana')) return JABATAN_STANDAR_KPU[7];
  if (u.includes('pramubakti')) return JABATAN_STANDAR_KPU[8];
  return JABATAN_STANDAR_KPU[6]; // Staf Pelaksana
}

export default function TukinPage() {
  const { data } = useWorkspace();
  const { showToast } = useFeedback();
  const [selectedMonth, setSelectedMonth] = useState('November 2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [customIndeks, setCustomIndeks] = useState<string>('');

  const parsedCustomIndeks = customIndeks.trim() !== '' ? Number(customIndeks) : null;
  const activeIndeksValid = parsedCustomIndeks !== null && !isNaN(parsedCustomIndeks) && parsedCustomIndeks > 0;

  const filteredEmployees = data.employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nip.includes(searchTerm)
  );

  const handleExportTukin = () => {
    if (filteredEmployees.length === 0) {
      showToast('warning', 'Tidak Ada Data', 'Tidak ada data pegawai yang dapat diekspor ke rekap Tukin.');
      return;
    }

    const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'No',
      'Nama Pegawai',
      'NIP',
      'Unit / Jabatan',
      'Kelas Jabatan',
      'Nilai Jabatan',
      'Indeks Besaran (Rp)',
      'Tukin Dasar (Rp)',
      'Disiplin Kehadiran 40% (Rp)',
      'Kinerja SKP 60% (Rp)',
      'Total Diterima (Rp)',
    ];

    const todayStr = new Date().toISOString().slice(0, 10);

    const rows = filteredEmployees.map((emp, idx) => {
      const unit = emp.subdepartmentId || 'Staf Pelaksana';
      const info = resolveJabatanInfo(unit, emp.role);
      const indeks = activeIndeksValid ? parsedCustomIndeks! : info.defaultIndeks;
      const base = info.nilaiJabatan * indeks;
      const maxAttendance = base * 0.4;
      const empRecords = data.records.filter(
        (r) =>
          (r.nip && r.nip === emp.nip) ||
          r.name.toLowerCase() === emp.name.toLowerCase()
      );
      let lateCount = 0;
      let missedOutCount = 0;
      empRecords.forEach((r) => {
        const d = new Date(r.entered);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!r.exited && dStr < todayStr) {
          missedOutCount++;
        } else if (d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0)) {
          lateCount++;
        }
      });
      const deduction = Math.min(maxAttendance, base * (missedOutCount * 0.015 + lateCount * 0.005));
      const attendancePortion = Math.max(0, maxAttendance - deduction);
      const performancePortion = base * 0.6;
      const total = attendancePortion + performancePortion;

      return [
        String(idx + 1),
        emp.name,
        emp.nip,
        unit,
        info.kelasLabel,
        String(info.nilaiJabatan),
        String(indeks),
        String(base),
        String(attendancePortion),
        String(performancePortion),
        String(total),
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slugMonth = selectedMonth.toLowerCase().replace(/\s+/g, '-');
    link.href = url;
    link.setAttribute('download', `rekap-tukin-kpu-sulut-${slugMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      'success',
      'Rekap Tukin Diunduh',
      `Laporan Tukin periode ${selectedMonth} (${filteredEmployees.length} pegawai) berhasil diunduh.`
    );
  };

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
                Sistem Perhitungan Tukin KPU Provinsi
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Rekap &amp; Simulasi Tunjangan Kinerja Pegawai
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-3xl leading-relaxed">
                Rumus dasar: <strong>Tukin = Nilai Jabatan &times; Indeks Besaran Rupiah</strong> (PermenPANRB 34/2011 &amp; Perpres 126/2017 / Perpres 11/2016).
                Pencairan bulanan dibagi atas <strong>40% Komponen Kehadiran Presensi</strong> + <strong>60% Capaian SKP</strong>.
              </p>
            </div>
            <button
              onClick={handleExportTukin}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D52832] hover:bg-[#B91C1C] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Rekap Tukin</span>
            </button>
          </div>
        </div>

        {/* Filter & Simulasi Indeks Rupiah */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="w-full lg:w-80">
            <input
              type="text"
              placeholder="Cari nama atau NIP pegawai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D52832]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#D52832]" />
              <span className="text-xs font-semibold text-slate-600">Simulasi Indeks (Rp):</span>
              <input
                type="number"
                min={1000}
                step={100}
                placeholder="Standar Jabatan"
                value={customIndeks}
                onChange={(e) => setCustomIndeks(e.target.value)}
                className="w-36 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-[#07142F] focus:outline-none focus:ring-2 focus:ring-[#D52832]"
              />
              {customIndeks !== '' && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomIndeks('');
                    showToast('info', 'Indeks Direset', 'Perhitungan kembali menggunakan Indeks standar masing-masing jabatan KPU Provinsi.');
                  }}
                  className="p-1.5 text-slate-500 hover:text-[#D52832] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Reset ke Indeks Standar"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Periode:</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  showToast('info', 'Periode Diubah', `Menampilkan simulasi Tukin periode ${e.target.value}.`);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#07142F] focus:outline-none focus:ring-2 focus:ring-[#D52832] font-medium"
              >
                <option value="November 2026">November 2026</option>
                <option value="Oktober 2026">Oktober 2026</option>
                <option value="September 2026">September 2026</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel Rekap Tukin Pegawai */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Pegawai &amp; NIP</th>
                  <th className="px-5 py-3.5">Jabatan &amp; Kelas</th>
                  <th className="px-5 py-3.5">Nilai Jabatan &times; Indeks</th>
                  <th className="px-5 py-3.5">Tukin Dasar</th>
                  <th className="px-5 py-3.5">Kehadiran (40%)</th>
                  <th className="px-5 py-3.5">Kinerja SKP (60%)</th>
                  <th className="px-5 py-3.5 font-extrabold text-[#07142F]">Total Diterima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEmployees.map((emp) => {
                  const unit = emp.subdepartmentId || 'Staf Pelaksana';
                  const info = resolveJabatanInfo(unit, emp.role);
                  const indeks = activeIndeksValid ? parsedCustomIndeks! : info.defaultIndeks;
                  const base = info.nilaiJabatan * indeks;
                  const maxAttendance = base * 0.4;

                  const now = new Date();
                  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                  const empRecords = data.records.filter(
                    (r) =>
                      (r.nip && r.nip === emp.nip) ||
                      r.name.toLowerCase() === emp.name.toLowerCase()
                  );
                  let lateCount = 0;
                  let missedOutCount = 0;
                  empRecords.forEach((r) => {
                    const d = new Date(r.entered);
                    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    if (!r.exited && dStr < todayStr) {
                      missedOutCount++;
                    } else if (d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0)) {
                      lateCount++;
                    }
                  });
                  const deduction = Math.min(
                    maxAttendance,
                    base * (missedOutCount * 0.015 + lateCount * 0.005)
                  );
                  const attendancePortion = Math.max(0, maxAttendance - deduction);
                  const performancePortion = base * 0.6;
                  const total = attendancePortion + performancePortion;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-xs font-mono text-slate-400">{emp.nip}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-slate-800">{unit}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-[#07142F] border border-slate-200">
                          {info.kelasLabel} &bull; {info.kategori}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        <span className="font-bold text-[#07142F]">{info.nilaiJabatan.toLocaleString('id-ID')}</span>
                        {' \u00d7 '}
                        <span>Rp {indeks.toLocaleString('id-ID')}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                        Rp {base.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="font-semibold text-[#07142F]">
                          Rp {attendancePortion.toLocaleString('id-ID')}
                        </div>
                        {deduction > 0 ? (
                          <span className="text-[10px] text-[#D52832] font-semibold block">
                            Potongan Rp {deduction.toLocaleString('id-ID')} ({missedOutCount}x tidak absen pulang, {lateCount}x telat)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">100% Hadir (Tanpa Potongan)</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="font-semibold text-[#07142F]">
                          Rp {performancePortion.toLocaleString('id-ID')}
                        </div>
                        <span className="text-[10px] text-slate-400">Target SKP 100%</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-[#D52832] text-sm font-mono bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          Rp {total.toLocaleString('id-ID')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                      Tidak ada data pegawai yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Matriks Standar Jabatan KPU Provinsi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#07142F] mb-3">
            Referensi Nilai Jabatan &amp; Indeks Besaran Rupiah Instansi KPU Provinsi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {JABATAN_STANDAR_KPU.map((item) => {
              const indeks = activeIndeksValid ? parsedCustomIndeks! : item.defaultIndeks;
              const nominal = item.nilaiJabatan * indeks;
              return (
                <div key={item.kategori} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#07142F]">{item.kategori}</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                      {item.kelasLabel}
                    </span>
                  </div>
                  <div className="mt-1.5 font-mono text-slate-600">
                    {item.nilaiJabatan.toLocaleString('id-ID')} &times; Rp {indeks.toLocaleString('id-ID')} ={' '}
                    <strong className="text-[#D52832]">Rp {nominal.toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{item.dasarHukum}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informasi Aturan Hukum */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs text-slate-500 leading-relaxed">
          <AlertCircle className="w-5 h-5 text-[#D52832] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-700">Dasar Regulasi Tunjangan Kinerja KPU Provinsi</p>
            <p className="mt-0.5">
              Mengacu pada <strong>Perpres Nomor 126 Tahun 2017</strong> (Tunjangan Kinerja Pegawai di Lingkungan Setjen KPU),{' '}
              <strong>Perpres Nomor 11 Tahun 2016</strong> (Kedudukan Keuangan Ketua &amp; Anggota KPU Provinsi), serta{' '}
              <strong>PermenPANRB Nomor 34 Tahun 2011 jo. Nomor 39 Tahun 2013</strong> tentang Evaluasi &amp; Kelas Jabatan (<em>Nilai Jabatan &times; Indeks Besaran Rupiah</em>).
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
