'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/lib/auth';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  MapPin,
  Clock,
  Coins,
  FileCheck2,
} from 'lucide-react';

export default function AdminLoginPage() {
  const { login, configured } = useAdminAuth();

  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNip = nip.trim();
    if (!cleanNip) {
      setError('Nomor Induk Pegawai (NIP) wajib diisi.');
      return;
    }
    if (!/^[0-9]{18}$/.test(cleanNip)) {
      setError('NIP harus terdiri dari tepat 18 digit angka.');
      return;
    }
    if (!password) {
      setError('Kata sandi wajib diisi.');
      return;
    }

    setBusy(true);
    const res = await login(cleanNip, password);
    setBusy(false);
    if (!res.success) {
      setError(res.error || 'Gagal masuk ke portal administrator.');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#040C1D] text-slate-100 flex flex-col overflow-x-hidden">
      {/* Institutional Office Backdrop */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/kantor_kpu_sulut.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none opacity-30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#040C1D]/95 via-[#07142F]/90 to-[#0B1F45]/92"
      />

      {/* Top Institutional Bar */}
      <header className="relative z-10 w-full border-b border-white/10 bg-[#07142F]/60">
        <div className="max-w-7xl mx-auto px-5 sm:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo_kpu_sulut.jpg"
              alt="Logo KPU Provinsi Sulawesi Utara"
              width={42}
              height={42}
              className="w-10 h-10 rounded-full object-cover border border-white/25 shrink-0"
            />
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-slate-300 leading-tight">
                Komisi Pemilihan Umum
              </p>
              <p className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight mt-0.5">
                Provinsi Sulawesi Utara
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold text-slate-100">
            <ShieldCheck className="w-4 h-4 text-[#F87171]" />
            <span>Portal Administrator</span>
          </div>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-5 sm:px-10 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Institutional Context */}
        <section className="lg:col-span-7 space-y-6 max-w-xl">
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-[-0.025em] leading-[1.15]">
            Sistem Presensi &amp; Tunjangan Kinerja KPU Sulawesi Utara
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Pusat kendali kehadiran aparatur Sekretariat KPU Provinsi Sulawesi Utara — memantau
            presensi WFO/WFH berbasis geofencing, verifikasi izin &amp; cuti, serta rekapitulasi
            tunjangan kinerja secara terpadu.
          </p>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/15">
            <div className="space-y-1.5">
              <dt className="flex items-center gap-2 text-xs font-semibold text-white">
                <Clock className="w-4 h-4 text-sky-300 shrink-0" />
                Presensi WITA Real-Time
              </dt>
              <dd className="text-xs text-slate-300 leading-relaxed">
                Pencatatan waktu server UTC+8 dengan validasi radius kantor dan bukti foto.
              </dd>
            </div>
            <div className="space-y-1.5">
              <dt className="flex items-center gap-2 text-xs font-semibold text-white">
                <FileCheck2 className="w-4 h-4 text-emerald-300 shrink-0" />
                Persetujuan Izin &amp; Cuti
              </dt>
              <dd className="text-xs text-slate-300 leading-relaxed">
                Tinjauan pengajuan multi-hari terhubung langsung ke aplikasi pegawai.
              </dd>
            </div>
            <div className="space-y-1.5">
              <dt className="flex items-center gap-2 text-xs font-semibold text-white">
                <Coins className="w-4 h-4 text-amber-300 shrink-0" />
                Kalkulasi Tukin Resmi
              </dt>
              <dd className="text-xs text-slate-300 leading-relaxed">
                Mengacu Perpres 126/2017 &amp; Perpres 11/2016 (40% disiplin + 60% SKP).
              </dd>
            </div>
          </dl>

          <div className="flex items-center gap-2 text-xs text-slate-300 pt-2">
            <MapPin className="w-4 h-4 text-[#F87171] shrink-0" />
            <span>Jl. Diponegoro No. 25, Manado, Sulawesi Utara</span>
          </div>
        </section>

        {/* Right Sign-In Panel */}
        <section className="lg:col-span-5 w-full max-w-md lg:ml-auto">
          <div className="bg-[#0E1B36] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Masuk Administrator</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Gunakan 18 digit NIP dan kata sandi akun administrator terdaftar.
              </p>
            </div>

            {!configured && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-200 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Variabel lingkungan Firebase (<code className="font-mono">.env.local</code>) belum
                  terdeteksi. Lengkapi konfigurasi proyek untuk mengaktifkan login.
                </span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-100 leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="admin-nip" className="text-xs font-semibold text-slate-100">
                    Nomor Induk Pegawai (NIP)
                  </label>
                  <span className="text-xs font-mono tabular-nums text-slate-300">
                    {nip.length}/18
                  </span>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-nip"
                    type="text"
                    inputMode="numeric"
                    autoComplete="username"
                    required
                    maxLength={18}
                    placeholder="198001012005011001"
                    value={nip}
                    onChange={(e) => setNip(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#172544] border border-slate-600/80 rounded-xl text-sm font-mono tabular-nums text-white placeholder:text-slate-400 focus:border-[#D52832] focus:ring-2 focus:ring-[#D52832]/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-slate-100 mb-1.5"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 bg-[#172544] border border-slate-600/80 rounded-xl text-sm text-white placeholder:text-slate-400 focus:border-[#D52832] focus:ring-2 focus:ring-[#D52832]/30 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-2 py-2.5 px-4 bg-[#D52832] hover:bg-[#B91C1C] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {busy ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Portal Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-700/70 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
              <p>
                Akses terbatas bagi Administrator Sekretariat KPU Sulut. Pendaftaran mandiri
                dinonaktifkan demi keamanan data kepegawaian.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#07142F]/50">
        <div className="max-w-7xl mx-auto px-5 sm:px-10 py-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <span>© 2026 Komisi Pemilihan Umum Provinsi Sulawesi Utara</span>
          <span>Zona Waktu Operasional: WITA (UTC+8)</span>
        </div>
      </footer>
    </div>
  );
}
