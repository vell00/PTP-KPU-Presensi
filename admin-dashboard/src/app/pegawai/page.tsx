'use client';

import React, { useState } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { DEPARTMENTS, ROLES } from '@/lib/constants';
import { Employee } from '@/types';
import { UserPlus, Pencil, Trash2, Search, X, Check } from 'lucide-react';

export default function PegawaiPage() {
  const { data, addEmployee, updateEmployee, deleteEmployee } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [nip, setNip] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'kepala_bagian' | 'kepala_sub_bagian' | 'staff'>('staff');
  const [departmentId, setDepartmentId] = useState(DEPARTMENTS[0].id);
  const [subdepartmentId, setSubdepartmentId] = useState(
    DEPARTMENTS[0].subdepartments[0]?.id || ''
  );
  const [formError, setFormError] = useState('');

  const currentDept = DEPARTMENTS.find((d) => d.id === departmentId);

  const openAddModal = () => {
    setEditingEmployee(null);
    setNip('');
    setName('');
    setRole('staff');
    setDepartmentId(DEPARTMENTS[0].id);
    setSubdepartmentId(DEPARTMENTS[0].subdepartments[0]?.id || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setNip(emp.nip);
    setName(emp.name);
    setRole(emp.role);
    setDepartmentId(emp.departmentId);
    setSubdepartmentId(emp.subdepartmentId || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

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
    } else {
      const res = addEmployee({
        nip,
        name,
        role,
        departmentId,
        subdepartmentId: subdepartmentId || undefined,
      });
      if (!res.success) {
        setFormError(res.message || 'Gagal menambahkan pegawai.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  const filteredEmployees = data.employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nip.includes(searchTerm)
  );

  return (
    <>
      <Topbar title="Manajemen & Direktori Pegawai" />
      <main className="p-8 space-y-6 max-w-7xl">
        {/* Actions bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau 18-digit NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai Baru</span>
          </button>
        </div>

        {/* Tabel Pegawai */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Nama & NIP</th>
                <th className="px-6 py-3.5">Jabatan</th>
                <th className="px-6 py-3.5">Bagian (Satuan Kerja)</th>
                <th className="px-6 py-3.5">Subbagian / Unit</th>
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
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {dept?.name ?? emp.departmentId}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {subdept?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Pegawai"
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
                          title="Hapus Pegawai"
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
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada pegawai ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Form Tambah / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Induk Pegawai (NIP) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    placeholder="18 digit angka (contoh: 198503152010011002)"
                    value={nip}
                    onChange={(e) => setNip(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Panjang saat ini: {nip.length}/18 digit
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Michelle W. Runtuwene, S.IP"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan *
                  </label>
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as 'kepala_bagian' | 'kepala_sub_bagian' | 'staff')
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bagian Organisasi *
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => {
                      const newDeptId = e.target.value;
                      setDepartmentId(newDeptId);
                      const dept = DEPARTMENTS.find((d) => d.id === newDeptId);
                      setSubdepartmentId(dept?.subdepartments[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subbagian / Unit Kerja
                  </label>
                  <select
                    value={subdepartmentId}
                    onChange={(e) => setSubdepartmentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {currentDept?.subdepartments.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
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
                    className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingEmployee ? 'Simpan Perubahan' : 'Tambah Pegawai'}</span>
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
