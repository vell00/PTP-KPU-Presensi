'use client';

import React, { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { useAdminAuth } from '@/lib/auth';
import { useFeedback } from '@/components/FeedbackProvider';
import {
  DEPARTMENTS,
  POSITION_LABELS,
  ROLES,
  resolveSubdepartmentSlug,
  resolveUnitDisplay,
} from '@/lib/constants';
import { Employee } from '@/types';
import {
  UserPlus,
  Pencil,
  Search,
  X,
  Check,
  ShieldCheck,
  KeyRound,
  UserX,
  UserCheck,
  Info,
} from 'lucide-react';

export default function PegawaiPage() {
  const {
    data,
    addEmployee,
    updateEmployee,
    setEmployeeActive,
    resetEmployeePassword,
  } = useWorkspace();
  const { user: currentAdmin } = useAdminAuth();
  const { showToast, confirmAction } = useFeedback();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states — NO plaintext password or PIN fields!
  const [nip, setNip] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'kepala_bagian' | 'kepala_sub_bagian' | 'staff'>('staff');
  const [departmentId, setDepartmentId] = useState<string>(DEPARTMENTS[0].id);
  const [subdepartmentId, setSubdepartmentId] = useState<string>(
    DEPARTMENTS[0].subdepartments[0].id
  );
  const [positionLabel, setPositionLabel] = useState<string>('Staf Pelaksana');
  const [formError, setFormError] = useState('');

  const currentDept = DEPARTMENTS.find((d) => d.id === departmentId) || DEPARTMENTS[0];

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen, isSubmitting]);

  const openAddModal = () => {
    setEditingEmployee(null);
    setNip('');
    setName('');
    setRole('staff');
    setDepartmentId(DEPARTMENTS[0].id);
    setSubdepartmentId(DEPARTMENTS[0].subdepartments[0].id);
    setPositionLabel('Staf Pelaksana');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    const dept = DEPARTMENTS.find((d) => d.id === emp.departmentId) || DEPARTMENTS[0];
    const resolvedSlug =
      resolveSubdepartmentSlug(emp.subdepartmentId) || dept.subdepartments[0].id;
    setEditingEmployee(emp);
    setNip(emp.nip);
    setName(emp.name);
    setRole(emp.role);
    setDepartmentId(dept.id);
    setSubdepartmentId(emp.role === 'kepala_bagian' ? '' : resolvedSlug);
    setPositionLabel(
      emp.positionLabel ||
        resolveUnitDisplay({
          departmentId: emp.departmentId,
          subdepartmentId: emp.subdepartmentId,
          role: emp.role,
        })
    );
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDepartmentChange = (nextDeptId: string) => {
    setDepartmentId(nextDeptId);
    const dept = DEPARTMENTS.find((d) => d.id === nextDeptId);
    if (dept && role !== 'kepala_bagian') {
      setSubdepartmentId(dept.subdepartments[0]?.id || '');
    }
  };

  const handleRoleChange = (nextRole: 'kepala_bagian' | 'kepala_sub_bagian' | 'staff') => {
    setRole(nextRole);
    if (nextRole === 'kepala_bagian') {
      setSubdepartmentId('');
    } else if (!subdepartmentId) {
      setSubdepartmentId(currentDept.subdepartments[0]?.id || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!/^\d{18}$/.test(nip.trim())) {
      setFormError('NIP harus terdiri dari tepat 18 digit angka.');
      return;
    }
    if (name.trim().length < 2) {
      setFormError('Nama pegawai minimal 2 karakter.');
      return;
    }
    if (role !== 'kepala_bagian' && !subdepartmentId) {
      setFormError('Pilih subbagian penugasan pegawai.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nip: nip.trim(),
        name: name.trim(),
        role,
        departmentId,
        subdepartmentId: role === 'kepala_bagian' ? null : subdepartmentId,
        positionLabel: positionLabel.trim() || undefined,
      };
      const res = editingEmployee
        ? await updateEmployee({ ...payload, uid: editingEmployee.id })
        : await addEmployee(payload);

      if (!res.success) {
        setFormError(res.message || 'Gagal menyimpan data pegawai.');
        return;
      }

      setIsModalOpen(false);
      showToast(
        'success',
        editingEmployee ? 'Data Pegawai Diperbarui' : 'Akun Pegawai Dibuat',
        res.message || `Data untuk ${name.trim()} berhasil disimpan melalui server.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (emp: Employee) => {
    const nextActive = !emp.active;
    const ok = await confirmAction({
      title: nextActive ? 'Aktifkan Kembali Akun?' : 'Nonaktifkan Akun Pegawai?',
      message: nextActive
        ? `Pegawai "${emp.name}" (${emp.nip}) akan dapat kembali masuk ke aplikasi mobile presensi.`
        : `Pegawai "${emp.name}" (${emp.nip}) akan segera dikeluarkan dari sesi aktif dan tidak dapat login.`,
      confirmLabel: nextActive ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan',
      variant: nextActive ? 'primary' : 'danger',
    });
    if (!ok) return;

    const res = await setEmployeeActive(emp.id, nextActive);
    if (res.success) {
      showToast(
        'success',
        nextActive ? 'Akun Diaktifkan' : 'Akun Dinonaktifkan',
        `Status akun ${emp.name} berhasil diperbarui.`
      );
    } else {
      showToast('error', 'Gagal Mengubah Status', res.message);
    }
  };

  const handleResetPassword = async (emp: Employee) => {
    const ok = await confirmAction({
      title: 'Reset Kata Sandi Pegawai?',
      message: `Kata sandi ${emp.name} (${emp.nip}) akan dikembalikan ke kata sandi awal instansi dan sesi aktifnya akan dicabut. Pegawai wajib membuat kata sandi baru saat login berikutnya.`,
      confirmLabel: 'Reset Kata Sandi',
      variant: 'primary',
    });
    if (!ok) return;

    const res = await resetEmployeePassword(emp.id);
    if (res.success) {
      showToast('success', 'Kata Sandi Direset', res.message);
    } else {
      showToast('error', 'Gagal Mereset Kata Sandi', res.message);
    }
  };

  const filteredEmployees = data.employees.filter((emp) => {
    if (statusFilter === 'active' && !emp.active) return false;
    if (statusFilter === 'inactive' && emp.active) return false;
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const unitText = resolveUnitDisplay({
      departmentId: emp.departmentId,
      subdepartmentId: emp.subdepartmentId,
      positionLabel: emp.positionLabel,
      role: emp.role,
    }).toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.nip.includes(q) ||
      unitText.includes(q)
    );
  });

  return (
    <>
      <Topbar title="Direktori Pegawai" />
      <main className="p-4 sm:p-6 xl:p-8 space-y-5 w-full max-w-[1440px]">
        {/* Security Provisioning Notice */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Pembuatan akun pegawai berjalan melalui <strong>Cloud Functions</strong> tanpa menyimpan
            kata sandi atau PIN dalam teks biasa. Pegawai baru masuk dengan kata sandi awal instansi
            dan wajib menggantinya sebelum mencatat presensi.
          </p>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama, NIP, atau jabatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#07142F]"
              />
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 self-start">
              {(
                [
                  { id: 'active', label: 'Aktif' },
                  { id: 'inactive', label: 'Nonaktif' },
                  { id: 'all', label: 'Semua' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatusFilter(opt.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    statusFilter === opt.id
                      ? 'bg-[#07142F] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#D52832] hover:bg-[#B91C1C] text-white rounded-lg text-sm font-semibold transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai</span>
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3">Pegawai &amp; NIP</th>
                <th className="px-4 py-3">Unit &amp; Jabatan</th>
                <th className="px-4 py-3">Status Akun</th>
                <th className="px-4 py-3">Keamanan PIN</th>
                <th className="px-5 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => {
                const dept = DEPARTMENTS.find((d) => d.id === emp.departmentId);
                const roleObj = ROLES.find((r) => r.id === emp.role);
                const unitLabel = resolveUnitDisplay({
                  departmentId: emp.departmentId,
                  subdepartmentId: emp.subdepartmentId,
                  positionLabel: emp.positionLabel,
                  role: emp.role,
                });
                const isSelf = currentAdmin?.uid === emp.id;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{emp.name}</span>
                        {emp.isAdmin && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#07142F] text-white">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                        {emp.nip}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs font-semibold text-slate-800">{unitLabel}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {roleObj?.label || emp.role} • {dept?.name || 'Sekretariat KPU Sulut'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {!emp.active ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Nonaktif
                        </span>
                      ) : emp.mustChangePassword ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Menunggu Aktivasi
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          emp.hasPin
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {emp.hasPin ? 'PIN Terdaftar' : 'Belum Diatur'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(emp)}
                          aria-label={`Ubah data ${emp.name}`}
                          title="Ubah data"
                          className="p-2 text-slate-500 hover:text-[#07142F] hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!isSelf && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResetPassword(emp)}
                              aria-label={`Reset kata sandi ${emp.name}`}
                              title="Reset kata sandi ke awal"
                              className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(emp)}
                              aria-label={
                                emp.active ? `Nonaktifkan ${emp.name}` : `Aktifkan ${emp.name}`
                              }
                              title={emp.active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                              className={`p-2 rounded-lg transition-colors ${
                                emp.active
                                  ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                                  : 'text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {emp.active ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-500">
                    Tidak ada pegawai yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredEmployees.map((emp) => {
            const unitLabel = resolveUnitDisplay({
              departmentId: emp.departmentId,
              subdepartmentId: emp.subdepartmentId,
              positionLabel: emp.positionLabel,
              role: emp.role,
            });
            const isSelf = currentAdmin?.uid === emp.id;
            return (
              <div key={emp.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{emp.name}</p>
                    <p className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">{emp.nip}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(emp)}
                      aria-label={`Ubah ${emp.name}`}
                      className="p-2 text-slate-500 hover:text-[#07142F] rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(emp)}
                        aria-label={emp.active ? `Nonaktifkan ${emp.name}` : `Aktifkan ${emp.name}`}
                        className="p-2 text-slate-500 hover:text-rose-700 rounded-lg"
                      >
                        {emp.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center text-xs">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                    {unitLabel}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold border ${
                      emp.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {emp.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {emp.hasPin ? 'PIN Terdaftar' : 'PIN Belum Diatur'}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredEmployees.length === 0 && (
            <p className="text-center text-slate-500 py-8 text-sm">Tidak ada pegawai ditemukan.</p>
          )}
        </div>

        {/* Add / Edit Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="employee-modal-title"
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 id="employee-modal-title" className="text-base font-bold text-slate-900">
                  {editingEmployee ? 'Ubah Data Pegawai' : 'Tambah Pegawai Baru'}
                </h2>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Tutup dialog"
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                {formError && (
                  <div
                    role="alert"
                    className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700"
                  >
                    {formError}
                  </div>
                )}

                {!editingEmployee && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-xs text-blue-900">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Akun dibuat oleh server dengan kata sandi awal instansi. Pegawai wajib mengganti
                      kata sandi dan membuat PIN 6 digit pribadi saat pertama login.
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="emp-nip" className="text-xs font-semibold text-slate-700">
                      NIP (18 digit)
                    </label>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">
                      {nip.length}/18
                    </span>
                  </div>
                  <input
                    id="emp-nip"
                    type="text"
                    inputMode="numeric"
                    required
                    disabled={Boolean(editingEmployee)}
                    maxLength={18}
                    placeholder="198503152010011002"
                    value={nip}
                    onChange={(e) => setNip(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tabular-nums disabled:opacity-60"
                  />
                </div>

                <div>
                  <label htmlFor="emp-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    id="emp-name"
                    type="text"
                    required
                    placeholder="Nama lengkap beserta gelar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="emp-role" className="block text-xs font-semibold text-slate-700 mb-1">
                      Peran Struktural
                    </label>
                    <select
                      id="emp-role"
                      value={role}
                      onChange={(e) =>
                        handleRoleChange(
                          e.target.value as 'kepala_bagian' | 'kepala_sub_bagian' | 'staff'
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="emp-pos" className="block text-xs font-semibold text-slate-700 mb-1">
                      Jabatan (Acuan Tukin)
                    </label>
                    <select
                      id="emp-pos"
                      value={positionLabel}
                      onChange={(e) => setPositionLabel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                      {POSITION_LABELS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="emp-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                    Bagian
                  </label>
                  <select
                    id="emp-dept"
                    value={departmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {role !== 'kepala_bagian' && (
                  <div>
                    <label
                      htmlFor="emp-subdept"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Subbagian (Acuan Jadwal WFH)
                    </label>
                    <select
                      id="emp-subdept"
                      value={subdepartmentId}
                      onChange={(e) => setSubdepartmentId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                      {currentDept.subdepartments.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-[#D52832] hover:bg-[#B91C1C] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Menyimpan...'
                        : editingEmployee
                        ? 'Simpan Perubahan'
                        : 'Buat Akun Pegawai'}
                    </span>
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
