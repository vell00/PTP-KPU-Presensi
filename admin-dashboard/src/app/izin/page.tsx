'use client';

import React, { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { useFeedback } from '@/components/FeedbackProvider';
import { LeaveStatusBadge } from '@/components/StatusBadge';
import { formatWitaDateLabel } from '@/lib/attendance-policy';
import { LeaveRequest } from '@/types';
import { Check, X, Calendar, Paperclip, MessageSquare } from 'lucide-react';

export default function IzinPage() {
  const { data, reviewLeaveRequest } = useWorkspace();
  const { showToast } = useFeedback();

  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Menunggu' | 'Disetujui' | 'Ditolak'>(
    'Semua'
  );
  const [reviewTarget, setReviewTarget] = useState<{
    request: LeaveRequest;
    decision: 'Disetujui' | 'Ditolak';
  } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!reviewTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) setReviewTarget(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reviewTarget, busy]);

  const counts = {
    Semua: data.requests.length,
    Menunggu: data.requests.filter((r) => r.status === 'Menunggu').length,
    Disetujui: data.requests.filter((r) => r.status === 'Disetujui').length,
    Ditolak: data.requests.filter((r) => r.status === 'Ditolak').length,
  };

  const filteredRequests = data.requests.filter(
    (req) => filterStatus === 'Semua' || req.status === filterStatus
  );

  const openReviewModal = (request: LeaveRequest, decision: 'Disetujui' | 'Ditolak') => {
    setReviewTarget({ request, decision });
    setReviewNote('');
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;
    if (reviewTarget.decision === 'Ditolak' && reviewNote.trim().length < 3) {
      showToast('warning', 'Catatan Diperlukan', 'Berikan alasan singkat penolakan agar pegawai mengetahui tindak lanjutnya.');
      return;
    }

    setBusy(true);
    const res = await reviewLeaveRequest(
      reviewTarget.request.id,
      reviewTarget.decision,
      reviewNote.trim() || undefined
    );
    setBusy(false);

    if (res.success) {
      showToast(
        reviewTarget.decision === 'Disetujui' ? 'success' : 'info',
        `Pengajuan ${reviewTarget.decision}`,
        `Keputusan untuk ${reviewTarget.request.name} telah disimpan ke Firestore.`
      );
      setReviewTarget(null);
    } else {
      showToast('error', 'Gagal Menyimpan Keputusan', res.message);
    }
  };

  return (
    <>
      <Topbar title="Persetujuan Izin & Cuti" />
      <main className="p-4 sm:p-6 xl:p-8 space-y-5 w-full max-w-[1440px]">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['Semua', 'Menunggu', 'Disetujui', 'Ditolak'] as const).map((tab) => {
              const active = filterStatus === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterStatus(tab)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#07142F] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[11px] tabular-nums ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {counts[tab]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Pegawai</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Periode &amp; Durasi</th>
                  <th className="px-4 py-3">Alasan &amp; Lampiran</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{req.name}</div>
                      {req.nip && (
                        <div className="text-[11px] font-mono tabular-nums text-slate-500">
                          {req.nip}
                        </div>
                      )}
                      {req.unit && <div className="text-[11px] text-slate-500">{req.unit}</div>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {req.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {formatWitaDateLabel(req.startDate)}
                          {req.endDate && req.endDate !== req.startDate
                            ? ` – ${formatWitaDateLabel(req.endDate)}`
                            : ''}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 tabular-nums mt-0.5 block">
                        {req.daysCount} hari kalender
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 max-w-xs space-y-1">
                      <p className="leading-relaxed">{req.reason}</p>
                      {req.attachmentUrl && /^https?:\/\//i.test(req.attachmentUrl) && (
                        <a
                          href={req.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-700 hover:underline font-medium"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Lihat berkas lampiran</span>
                        </a>
                      )}
                      {req.reviewNote && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
                          <MessageSquare className="w-3 h-3 shrink-0" />
                          <span>Catatan: {req.reviewNote}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <LeaveStatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {req.status === 'Menunggu' ? (
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openReviewModal(req, 'Disetujui')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openReviewModal(req, 'Ditolak')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Telah diproses</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                      Tidak ada pengajuan izin atau cuti pada kategori ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Review Modal with Admin Note */}
        {reviewTarget && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
            onClick={() => !busy && setReviewTarget(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-modal-title"
              className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={submitReview}>
                <div className="p-6 space-y-4">
                  <div>
                    <h2 id="review-modal-title" className="text-base font-bold text-slate-900">
                      {reviewTarget.decision === 'Disetujui'
                        ? 'Setujui Pengajuan Izin / Cuti'
                        : 'Tolak Pengajuan Izin / Cuti'}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      <strong>{reviewTarget.request.name}</strong> — {reviewTarget.request.type} (
                      {reviewTarget.request.daysCount} hari)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="review-note"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Catatan Administrator{' '}
                      {reviewTarget.decision === 'Ditolak' ? '(Wajib)' : '(Opsional)'}
                    </label>
                    <textarea
                      id="review-note"
                      rows={3}
                      maxLength={300}
                      required={reviewTarget.decision === 'Ditolak'}
                      placeholder={
                        reviewTarget.decision === 'Disetujui'
                          ? 'Contoh: Disetujui, pastikan serah terima tugas berjalan lancar.'
                          : 'Jelaskan alasan penolakan...'
                      }
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-[#07142F]"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setReviewTarget(null)}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 ${
                      reviewTarget.decision === 'Disetujui'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-[#D52832] hover:bg-[#B91C1C]'
                    }`}
                  >
                    {busy
                      ? 'Menyimpan...'
                      : reviewTarget.decision === 'Disetujui'
                      ? 'Konfirmasi Setujui'
                      : 'Konfirmasi Tolak'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
