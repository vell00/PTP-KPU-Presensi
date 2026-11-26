'use client';

import React, { useMemo, useState } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { useFeedback } from '@/components/FeedbackProvider';
import {
  JABATAN_STANDAR_KPU,
  calculateEmployeeMonthlyTukin,
  getWitaTodayKey,
  parseToWitaParts,
} from '@/lib/attendance-policy';
import { resolveUnitDisplay } from '@/lib/constants';
import { Download, AlertCircle, Calculator, RotateCcw, Search } from 'lucide-react';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function buildMonthOptions(now: Date) {
  const p = parseToWitaParts(now);
  const options: { value: string; year: number; month: number; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    let m = p.month - i;
    let y = p.year;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const value = `${y}-${String(m).padStart(2, '0')}`;
    options.push({ value, year: y, month: m, label: `${MONTH_NAMES[m - 1]} ${y}` });
  }
  return options;
}

export default function TukinPage() {
  const { data } = useWorkspace();
  const { showToast } = useFeedback();

  const monthOptions = useMemo(() => buildMonthOptions(new Date()), []);
  const [selectedPeriod, setSelectedPeriod] = useState(monthOptions[0].value);
  const [searchTerm, setSearchTerm] = useState('');
  const [customIndeks, setCustomIndeks] = useState('');
  const [skpPercent, setSkpPercent] = useState('100');

  const todayWitaKey = getWitaTodayKey();
  const activeOption =
    monthOptions.find((o) => o.value === selectedPeriod) || monthOptions[0];

  const parsedIndeks = customIndeks.trim() !== '' ? Number(customIndeks) : null;
  const validIndeks =
    parsedIndeks !== null && !Number.isNaN(parsedIndeks) && parsedIndeks > 0 ? parsedIndeks : null;
  const parsedSkp = Math.min(100, Math.max(0, Number(skpPercent) || 0));

  const breakdowns = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return data.employees
      .filter((emp) => emp.active !== false)
      .filter(
        (emp) =>
          !q ||
          emp.name.toLowerCase().includes(q) ||
          emp.nip.includes(q) ||
          (emp.positionLabel || '').toLowerCase().includes(q)
      )
      .map((employee) =>
        calculateEmployeeMonthlyTukin({
          employee,
          records: data.records,
          requests: data.requests,
          holidays: data.holidays,
          workHours: data.workHours,
          year: activeOption.year,
          month: activeOption.month,
          todayWitaKey,
          customIndeks: validIndeks,
          skpPercent: parsedSkp,
        })
      );
  }, [
    data.employees,
    data.records,
    data.requests,
    data.holidays,
    data.workHours,
    searchTerm,
    activeOption,
    todayWitaKey,
    validIndeks,
    parsedSkp,
  ]);

  const summary = useMemo(() => {
    const totalPayout = breakdowns.reduce((acc, b) => acc + b.totalReceived, 0);
    const totalDeduction = breakdowns.reduce((acc, b) => acc + b.deductionAmount, 0);
    const totalAlpha = breakdowns.reduce((acc, b) => acc + b.alphaDays, 0);
    const workdays = breakdowns[0]?.workdaysCount ?? 0;
    return { totalPayout, totalDeduction, totalAlpha, workdays };
  }, [breakdowns]);

  const handleExportTukin = () => {
    if (breakdowns.length === 0) {
      showToast('warning', 'Tidak Ada Data', 'Tidak ada pegawai aktif untuk diekspor.');
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
      'Indeks (Rp)',
      'Tukin Dasar (Rp)',
      'Hadir (Hari)',
      'Izin/Cuti Disetujui (Hari)',
      'Alpha/TK (Hari)',
      'Telat (Hari)',
      'Pulang Cepat (Hari)',
      'Tidak Absen Pulang (Hari)',
      'Total Potongan (%)',
      'Potongan (Rp)',
      'Kehadiran 40% (Rp)',
      `Kinerja SKP ${parsedSkp}% (Rp)`,
      'Total Diterima (Rp)',
    ];

    const rows = breakdowns.map((b, idx) =>
      [
        String(idx + 1),
        b.employee.name,
        b.employee.nip,
        resolveUnitDisplay({
          departmentId: b.employee.departmentId,
          subdepartmentId: b.employee.subdepartmentId,
          positionLabel: b.employee.positionLabel,
          role: b.employee.role,
        }),
        b.jabatan.kelasLabel,
        String(b.jabatan.nilaiJabatan),
        String(b.indeks),
        String(b.baseTukin),
        String(b.presentDays),
        String(b.approvedLeaveDays),
        String(b.alphaDays),
        String(b.lateDays),
        String(b.earlyLeaveDays),
        String(b.missedCheckOutDays),
        String(b.deductionPercent),
        String(b.deductionAmount),
        String(b.attendancePortion),
        String(b.performancePortion),
        String(b.totalReceived),
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap-tukin-kpu-sulut-${activeOption.value}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      'success',
      'Rekap Tukin Diunduh',
      `Laporan periode ${activeOption.label} (${breakdowns.length} pegawai) berhasil diunduh.`
    );
  };

  return (
    <>
      <Topbar
        title="Tunjangan Kinerja (Tukin)"
        subtitle={`Periode ${activeOption.label} • Mengacu Perpres 126/2017 & Perpres 11/2016`}
      />
      <main className="p-4 sm:p-6 xl:p-8 space-y-5 w-full max-w-[1440px]">
        {/* Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-[#07142F] text-white p-5 rounded-xl border border-[#16366C]">
            <p className="text-xs font-medium text-slate-300">Total Estimasi Pencairan</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums mt-2">
              Rp {summary.totalPayout.toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              {breakdowns.length} pegawai aktif • {activeOption.label}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500">Total Potongan Disiplin</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-rose-700 mt-2">
              Rp {summary.totalDeduction.toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Akumulasi TL, PSW, Tidak Absen Pulang &amp; Alpha
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500">Hari Kerja Terhitung</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-2">
              {summary.workdays} hari
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Senin–Jumat di luar hari libur nasional
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500">Akumulasi Alpha (TK)</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-2">
              {summary.totalAlpha} hari
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Potongan 3% per hari tanpa keterangan</p>
          </div>
        </div>

        {/* Controls */}
        <section className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, NIP, atau jabatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="tukin-period" className="text-xs font-semibold text-slate-600">
                Periode
              </label>
              <select
                id="tukin-period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-slate-900"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="tukin-skp" className="text-xs font-semibold text-slate-600">
                SKP (%)
              </label>
              <input
                id="tukin-skp"
                type="number"
                min={0}
                max={100}
                value={skpPercent}
                onChange={(e) => setSkpPercent(e.target.value)}
                className="w-20 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-slate-500" />
              <input
                type="number"
                aria-label="Simulasi Indeks Rupiah"
                min={1000}
                step={100}
                placeholder="Indeks standar"
                value={customIndeks}
                onChange={(e) => setCustomIndeks(e.target.value)}
                className="w-36 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900"
              />
              {customIndeks !== '' && (
                <button
                  type="button"
                  onClick={() => setCustomIndeks('')}
                  aria-label="Reset indeks standar"
                  title="Reset ke indeks standar"
                  className="p-2 text-slate-500 hover:text-[#D52832] hover:bg-rose-50 rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleExportTukin}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D52832] hover:bg-[#B91C1C] text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </section>

        {/* Tukin Breakdown Table */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[960px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Pegawai &amp; NIP</th>
                  <th className="px-4 py-3">Kelas &amp; Dasar</th>
                  <th className="px-4 py-3">Rekap Bulan Ini</th>
                  <th className="px-4 py-3 text-right">Kehadiran (40%)</th>
                  <th className="px-4 py-3 text-right">SKP ({parsedSkp}% × 60%)</th>
                  <th className="px-5 py-3 text-right text-slate-900">Total Diterima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakdowns.map((b) => {
                  const unitLabel = resolveUnitDisplay({
                    departmentId: b.employee.departmentId,
                    subdepartmentId: b.employee.subdepartmentId,
                    positionLabel: b.employee.positionLabel,
                    role: b.employee.role,
                  });
                  return (
                    <tr key={b.employee.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{b.employee.name}</div>
                        <div className="text-[11px] font-mono tabular-nums text-slate-500">
                          {b.employee.nip}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{unitLabel}</div>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                          {b.jabatan.kelasLabel}
                        </span>
                        <div className="font-mono tabular-nums text-slate-600 mt-1">
                          Rp {b.baseTukin.toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs space-y-1">
                        <div className="flex flex-wrap gap-1.5 tabular-nums">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                            Hadir {b.presentDays}h
                          </span>
                          {b.approvedLeaveDays > 0 && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                              Izin/Cuti {b.approvedLeaveDays}h
                            </span>
                          )}
                          {b.alphaDays > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">
                              Alpha {b.alphaDays}h
                            </span>
                          )}
                          {(b.lateDays > 0 || b.earlyLeaveDays > 0 || b.missedCheckOutDays > 0) && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium">
                              {b.lateDays} TL · {b.earlyLeaveDays} PSW · {b.missedCheckOutDays} TAP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-xs">
                        <div className="font-mono font-semibold tabular-nums text-slate-900">
                          Rp {b.attendancePortion.toLocaleString('id-ID')}
                        </div>
                        {b.deductionAmount > 0 ? (
                          <div className="text-[11px] font-mono tabular-nums text-rose-700 mt-0.5">
                            −Rp {b.deductionAmount.toLocaleString('id-ID')} ({b.deductionPercent}%)
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-700 mt-0.5">Tanpa potongan</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-mono font-semibold tabular-nums text-slate-800">
                        Rp {b.performancePortion.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-block font-mono font-bold tabular-nums text-sm text-[#07142F] bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
                          Rp {b.totalReceived.toLocaleString('id-ID')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {breakdowns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                      Tidak ada pegawai aktif yang sesuai pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reference Matrix & Legal Basis */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Referensi Nilai Jabatan &amp; Indeks KPU Provinsi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {JABATAN_STANDAR_KPU.map((item) => {
              const indeks = validIndeks ?? item.defaultIndeks;
              const nominal = item.nilaiJabatan * indeks;
              return (
                <div
                  key={item.kategori}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">{item.kategori}</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 shrink-0">
                      {item.kelasLabel}
                    </span>
                  </div>
                  <div className="mt-1.5 font-mono tabular-nums text-slate-700">
                    {item.nilaiJabatan.toLocaleString('id-ID')} × Rp {indeks.toLocaleString('id-ID')} ={' '}
                    <strong className="text-slate-900">Rp {nominal.toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{item.dasarHukum}</div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p>
              Skema potongan mengikuti <strong>Perpres 126/2017</strong> &amp; Juknis Tukin Setjen
              KPU: TL1/PSW1 (1–30 mnt) = 0,5%, TL2/PSW2 (31–60 mnt) = 1%, TL3/PSW3 (61–90 mnt) =
              1,25%, TL4/PSW4 (&gt;90 mnt) &amp; Tidak Absen Pulang = 1,5%, Alpha (TK) = 3%/hari.
              Keterlambatan ≤60 menit yang diganti dengan tambahan jam pulang pada hari yang sama
              dibebaskan dari potongan.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
