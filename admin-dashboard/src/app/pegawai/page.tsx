'use client';

import React, { useState } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { DEPARTMENTS, ROLES } from '@/lib/constants';
import { Employee } from '@/types';
import { UserPlus, Pencil, Trash2, Search, X, Check, Key } from 'lucide-react';

export default function PegawaiPage() {
  const { data, addEmployee, updateEmployee, deleteEmployee } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [nip, setNip] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'kepala_bagian' | 'kepala_sub_bagian' | 'staff'>('staff');
  const [departmentId, setDepartmentId] = useState(DEPARTMENTS[0].id);
  const [subdepartmentId, setSubdepartmentId] = useState(
    DEPARTMENTS[0].subdepartments[0]?.id || ''
  );
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const currentDept = DEPARTMENTS.find((d) => d.id === departmentId);

  const openAddModal = () => {
    setEditingEmployee(null);
    setNip('');
    setName('');
    setPassword('');
    setRole('staff');
    setDepartmentId(DEPARTMENTS[0].id);
    setSubdepartmentId(DEPARTMENTS[0].subdepartments[0]?.id || '');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setNip(emp.nip);
    setName(emp.name);
    setPassword('');
    setRole(emp.role);
    setDepartmentId(emp.departmentId);
    setSubdepartmentId(emp.subdepartmentId || '');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!name.trim()) {
      setFormError('Nama pegawai tidak boleh kosong.');
      return;
    }

    if (editingEmployee) {
      const res = updateEmployee({
        id: editingEmployee.id,
        nip,
        name,
        role,
        departmentId,
        subdepartmentId: subdepartmentId || undefined,
      });
      if (!res.success) {
        setFormError(res.message || 'Gagal menyimpan perubahan.');
        return;
      }
      setIsModalOpen(false);
    } else {
      if (!password || password.length < 6) {
        setFormError('Password minimal 6 karakter.');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await addEmployee({
          nip,
          name,
          password,
          role,
          departmentId,
          subdepartmentId: subdepartmentId || undefined,
        });
        if (!res.success) {
          setFormError(res.message || 'Gagal menambahkan pegawai.');
          return;
        }
        setFormSuccess('Pegawai berhasil ditambahkan ke Firebase!');
        setTimeout(() => setIsModalOpen(false), 1500);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filteredEmployees = data.employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nip.includes(searchTerm)
  );

  return (
    <>
      <Topbar title="Manajemen Pegawai" />
      <main className="p-4 sm:p-8 space-y-6 max-w-7xl">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama atau NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai</span>
          </button>
        </div>

        {/* Mobile cards / Desktop table */}
        {/* Desktop Table */}
        <div className="hidden sm:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Nama & NIP</th>
                <th className="px-6 py-3.5">Jabatan</th>
                <th className="px-6 py-3.5">Subbagian</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEmployees.map((emp) => {
                const dept = DEPARTMENTS.find((d) => d.id === emp.departmentId);
                const subdept = dept?.subdepartments.find((s) => s.id === emp.subdepartmentId);
                const roleObj = ROLES.find((r) => r.id === emp.role);

                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-xs font-mono text-slate-500">{emp.nip}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {roleObj?.label ?? emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {subdept?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus pegawai "${emp.name}" dari sistem?`)) {
                              deleteEmployee(emp.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Tidak ada pegawai ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-3">
          {filteredEmployees.map((emp) => {
            const dept = DEPARTMENTS.find((d) => d.id === emp.departmentId);
            const subdept = dept?.subdepartments.find((s) => s.id === emp.subdepartmentId);
            const roleObj = ROLES.find((r) => r.id === emp.role);

            return (
              <div key={emp.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{emp.name}</p>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{emp.nip}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(emp)} className="p-1.5 text-slate-500 hover:text-teal-600 rounded-lg">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus "${emp.name}"?`)) deleteEmployee(emp.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {roleObj?.label ?? emp.role}
                  </span>
                  <span className="text-[11px] text-slate-500">{subdept?.name ?? '—'}</span>
                </div>
              </div>
            );
          })}
          {filteredEmployees.length === 0 && (
            <p className="text-center text-slate-400 py-8 text-sm">Tidak ada pegawai ditemukan.</p>
          )}
        </div>

        {/* Modal Form Tambah / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  {editingEmployee ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700">
                    {formSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP (18 digit) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    placeholder="198503152010011002"
                    value={nip}
                    onChange={(e) => setNip(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {nip.length}/18 digit
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama pegawai"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {!editingEmployee && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      <Key className="w-3 h-3 inline mr-1" />
                      Password Login *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Password untuk login ke aplikasi mobile
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subbagian *</label>
                  <select
                    value={subdepartmentId}
                    onChange={(e) => {
                      const subId = e.target.value;
                      setSubdepartmentId(subId);
                      // Auto-set parent department
                      const parentDept = DEPARTMENTS.find((d) =>
                        d.subdepartments.some((s) => s.id === subId)
                      );
                      if (parentDept) setDepartmentId(parentDept.id);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {DEPARTMENTS.flatMap((d) =>
                      d.subdepartments.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'Menyimpan...' : editingEmployee ? 'Simpan' : 'Tambah Pegawai'}</span>
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
