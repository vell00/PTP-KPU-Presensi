'use client';

import React, { useState } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { useFeedback } from '@/components/FeedbackProvider';
import { Check, X, Calendar } from 'lucide-react';

export default function IzinPage() {
  const { data, updateRequestStatus } = useWorkspace();
  const { showToast, confirmAction } = useFeedback();
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  const filteredRequests = data.requests
    .map((req, index) => ({ ...req, index }))
    .filter((req) => {
      if (filterStatus !== 'Semua' && req.status !== filterStatus) return false;
      return true;
    });

  const handleAction = async (index: number, name: string, status: 'Disetujui' | 'Ditolak') => {
    const actionText = status === 'Disetujui' ? 'menyetujui' : 'menolak';
    const confirmed = await confirmAction({
      title: status === 'Disetujui' ? 'Setujui Pengajuan Izin/Cuti?' : 'Tolak Pengajuan Izin/Cuti?',
      message: `Apakah Anda yakin ingin ${actionText} permohonan dari ${name}?`,
      confirmLabel: status === 'Disetujui' ? 'Ya, Setujui' : 'Ya, Tolak',
      variant: status === 'Ditolak' ? 'danger' : 'primary',
    });
    if (confirmed) {
      await updateRequestStatus(index, status);
      showToast(
        status === 'Disetujui' ? 'success' : 'warning',
        `Pengajuan ${status}`,
        `Permohonan izin/cuti atas nama ${name} telah ${status.toLowerCase()}.`
      );
    }
  };

  return (
    <>
      <Topbar title="Persetujuan Izin & Cuti Pegawai" />
      <main className="p-4 sm:p-6 xl:p-8 space-y-5 sm:space-y-6 w-full">
        {/* Header summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Daftar Permohonan Izin / Cuti</h3>
            <p className="text-xs text-slate-500">
              Pengajuan izin atau cuti yang diajukan oleh pegawai KPU
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-[#07142F] focus:outline-none focus:ring-2 focus:ring-[#D52832] shadow-sm"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Requests List Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama Pegawai</th>
                  <th className="px-6 py-3.5">Jenis Permohonan</th>
                  <th className="px-6 py-3.5">Tanggal Izin</th>
                  <th className="px-6 py-3.5">Alasan / Keterangan</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRequests.map((req) => (
                  <tr key={req.index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{req.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        {req.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">
                      {req.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          req.status === 'Disetujui'
                            ? 'bg-rose-50 text-[#D52832] border border-rose-200'
                            : req.status === 'Ditolak'
                            ? 'bg-slate-100 text-[#07142F] border border-slate-300'
                            : 'bg-white text-[#07142F] border border-[#07142F]'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'Menunggu' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(req.index, req.name, 'Disetujui')}
                            className="flex items-center gap-1 px-3 py-1 bg-[#D52832] hover:bg-[#B91C1C] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                          <button
                            onClick={() => handleAction(req.index, req.name, 'Ditolak')}
                            className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 text-[#07142F] border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada pengajuan izin yang ditemukan.
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
