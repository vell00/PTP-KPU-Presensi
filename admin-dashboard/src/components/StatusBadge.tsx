import React from 'react';
import { Building2, Home } from 'lucide-react';

export function ModeBadge({ mode }: { mode: string }) {
  if (mode === '-' || !mode) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const isWfh = mode === 'WFH';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
        isWfh
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-slate-100 text-[#07142F] border-slate-300'
      }`}
    >
      {isWfh ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
      {mode}
    </span>
  );
}

export function AttendanceStatusBadge({ status }: { status: string }) {
  const styles =
    status === 'Tepat Waktu'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'Terlambat' || status === 'Pulang Cepat' || status === 'Belum Absen Pulang'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      {status}
    </span>
  );
}

export function LeaveStatusBadge({ status }: { status: 'Menunggu' | 'Disetujui' | 'Ditolak' | string }) {
  const styles =
    status === 'Disetujui'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'Ditolak'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-800 border-amber-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      {status}
    </span>
  );
}
