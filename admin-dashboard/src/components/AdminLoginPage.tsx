'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/lib/auth';
import { ALL_UNITS_AND_POSITIONS } from '@/lib/constants';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  MapPin,
  CheckCircle2,
  Briefcase,
  Fingerprint,
  Clock,
  Building2,
} from 'lucide-react';

export default function AdminLoginPage() {
  const { login, signUpAdmin } = useAdminAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [nip, setNip] = useState('');
  const [name, setName] = useState('');
  const [unitJabatan, setUnitJabatan] = useState(ALL_UNITS_AND_POSITIONS[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanNip = nip.trim();
    if (!cleanNip) {
      setError('Nomor Induk Pegawai (NIP) wajib diisi.');
      return;
    }
    if (!/^[0-9]{18}$/.test(cleanNip)) {
      setError('NIP harus terdiri dari 18 digit angka.');
      return;
    }
    if (!password) {
      setError('Kata sandi wajib diisi.');
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setError('Nama lengkap wajib diisi.');
        return;
      }
      if (password.length < 6) {
        setError('Kata sandi minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Konfirmasi kata sandi tidak cocok.');
        return;
      }

      setBusy(true);
      const res = await signUpAdmin(cleanNip, name, unitJabatan, password);
      setBusy(false);
      if (!res.success) {
        setError(res.error || 'Pendaftaran admin gagal.');
      } else {
        setSuccessMsg('Akun Administrator berhasil didaftarkan! Mengalihkan ke dashboard...');
      }
    } else {
      setBusy(true);
      const res = await login(cleanNip, password);
      setBusy(false);
      if (!res.success) {
        setError(res.error || 'Gagal masuk ke portal admin.');
      }
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#040C1D',
        color: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Background Foto Kantor KPU Sulut */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/kantor_kpu_sulut.jpg"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Overlay Biru Tua Transparan */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(135deg, rgba(4,12,29,0.95) 0%, rgba(7,20,47,0.90) 50%, rgba(11,30,66,0.87) 100%)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Radial Glow Aksen */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '2.5rem',
          width: '24rem',
          height: '24rem',
          background: 'rgba(22,54,108,0.4)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ===== NAVBAR ===== */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          padding: '1.25rem 3.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(7,20,47,0.40)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {/* Logo KPU - pakai img biasa, bukan next/image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo_kpu_sulut.jpg"
            alt="Logo KPU Sulawesi Utara"
            width={44}
            height={44}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid rgba(255,255,255,0.20)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              flexShrink: 0,
            }}
          />
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#B5C6DE',
              }}
            >
              KOMISI PEMILIHAN UMUM
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '15px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                lineHeight: 1,
                marginTop: '2px',
              }}
            >
              Provinsi Sulawesi Utara
            </span>
          </div>
        </div>

        {/* Badge Admin */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            borderRadius: '9999px',
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: '11px',
            fontWeight: 700,
            color: '#e2e8f0',
          }}
        >
          <ShieldCheck style={{ width: '14px', height: '14px', color: '#D52832' }} />
          <span>PORTAL ADMINISTRATOR</span>
        </div>
      </header>

      {/* ===== KONTEN UTAMA SPLIT LAYOUT ===== */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          width: '100%',
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '4rem 3rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4rem',
          flexWrap: 'wrap',
        }}
      >
        {/* ===== SISI KIRI: HERO BRANDING ===== */}
        <div style={{ flex: '1 1 360px', maxWidth: '480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '20px', height: '2px', background: '#D52832' }} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#94a3b8',
              }}
            >
              PTP-KPU PRESENSI
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}
          >
            Platform Terpadu{' '}
            <span style={{ color: '#94a3b8' }}>Penunjang KPU.</span>
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#B5C6DE',
              lineHeight: 1.75,
              marginBottom: '2rem',
              maxWidth: '400px',
            }}
          >
            Satu akses terintegrasi untuk pusat kendali kehadiran pegawai, pemantauan radius geofencing kantor, verifikasi izin &amp; cuti, serta rekapitulasi tunjangan kinerja Sekretariat KPU Provinsi Sulawesi Utara.
          </p>

          {/* Feature Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { icon: <Fingerprint style={{ width: '16px', height: '16px', color: '#f87171' }} />, title: 'Geofencing Presensi', desc: 'Radius kantor KPU Sulut akurat' },
              { icon: <Clock style={{ width: '16px', height: '16px', color: '#60a5fa' }} />, title: 'Rekapitulasi Kehadiran', desc: 'Data real-time masuk & kepulangan' },
              { icon: <Building2 style={{ width: '16px', height: '16px', color: '#34d399' }} />, title: 'Tunjangan Kinerja', desc: 'Kalkulasi 40% hadir + 60% SKP' },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  padding: '0.875rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  {f.icon}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{f.title}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: '#64748b' }}>
            <MapPin style={{ width: '14px', height: '14px', color: '#D52832', flexShrink: 0 }} />
            <span>Kantor KPU Provinsi Sulawesi Utara, Jl. Diponegoro No. 25, Manado</span>
          </div>
        </div>

        {/* ===== SISI KANAN: CARD LOGIN ===== */}
        <div style={{ flex: '0 0 auto', width: '100%', maxWidth: '420px' }}>
          <div
            style={{
              background: 'rgba(20,31,54,0.92)',
              border: '1px solid rgba(46,63,95,0.90)',
              borderRadius: '1.25rem',
              padding: '2rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Card Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid rgba(38,53,80,1)',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(213,40,50,0.15)',
                  border: '1px solid rgba(213,40,50,0.30)',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#EE5A62',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                }}
              >
                <Lock style={{ width: '12px', height: '12px' }} />
                <span>{isSignUp ? 'DAFTAR ADMIN BARU' : 'AKSES ADMINISTRATOR'}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>KPU Sulut</span>
            </div>

            <h2
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                marginBottom: '0.25rem',
              }}
            >
              {isSignUp ? 'Registrasi Administrator' : 'Selamat datang'}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '1.5rem' }}>
              {isSignUp
                ? 'Daftarkan akun administrator baru untuk mengelola portal.'
                : 'Silakan masuk menggunakan NIP dan kata sandi akun Admin.'}
            </p>

            {/* Error / Success Alert */}
            {error && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.30)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  fontSize: '12px',
                  color: '#fca5a5',
                }}
              >
                <AlertCircle style={{ width: '16px', height: '16px', color: '#D52832', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ lineHeight: 1.5 }}>{error}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.30)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  fontSize: '12px',
                  color: '#6ee7b7',
                }}
              >
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ lineHeight: 1.5 }}>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Field NIP */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.375rem' }}>
                  Nomor Induk Pegawai (NIP) *
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                  <input
                    type="text"
                    required
                    maxLength={18}
                    placeholder="Contoh: 198001012005011001"
                    value={nip}
                    onChange={(e) => setNip(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      paddingLeft: '2.5rem',
                      paddingRight: '1rem',
                      paddingTop: '0.625rem',
                      paddingBottom: '0.625rem',
                      background: '#1E2B45',
                      border: '1px solid #2E3F5F',
                      borderRadius: '0.75rem',
                      fontSize: '13px',
                      color: '#fff',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#D52832'; e.target.style.boxShadow = '0 0 0 2px rgba(213,40,50,0.25)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#2E3F5F'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <span style={{ fontSize: '10px', color: '#475569', display: 'block', marginTop: '4px' }}>
                  Gunakan 18 digit NIP resmi yang terdaftar sebagai Admin.
                </span>
              </div>

              {/* Sign Up Extra Fields */}
              {isSignUp && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.375rem' }}>
                      Nama Lengkap Admin *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap beserta gelar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.625rem 1rem',
                        background: '#1E2B45',
                        border: '1px solid #2E3F5F',
                        borderRadius: '0.75rem',
                        fontSize: '13px',
                        color: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#D52832'; e.target.style.boxShadow = '0 0 0 2px rgba(213,40,50,0.25)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#2E3F5F'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.375rem' }}>
                      Unit / Jabatan *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                      <select
                        value={unitJabatan}
                        onChange={(e) => setUnitJabatan(e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.5rem',
                          paddingRight: '1rem',
                          paddingTop: '0.625rem',
                          paddingBottom: '0.625rem',
                          background: '#1E2B45',
                          border: '1px solid #2E3F5F',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          color: '#fff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      >
                        {ALL_UNITS_AND_POSITIONS.map((u) => (
                          <option key={u} value={u} style={{ background: '#141F36', color: '#fff' }}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Kata Sandi */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.375rem' }}>
                  Kata Sandi *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '2.5rem',
                      paddingRight: '2.75rem',
                      paddingTop: '0.625rem',
                      paddingBottom: '0.625rem',
                      background: '#1E2B45',
                      border: '1px solid #2E3F5F',
                      borderRadius: '0.75rem',
                      fontSize: '13px',
                      color: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#D52832'; e.target.style.boxShadow = '0 0 0 2px rgba(213,40,50,0.25)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#2E3F5F'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}
                  >
                    {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Kata Sandi (Sign Up only) */}
              {isSignUp && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.375rem' }}>
                    Konfirmasi Kata Sandi *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Ulangi kata sandi"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        paddingLeft: '2.5rem',
                        paddingRight: '1rem',
                        paddingTop: '0.625rem',
                        paddingBottom: '0.625rem',
                        background: '#1E2B45',
                        border: '1px solid #2E3F5F',
                        borderRadius: '0.75rem',
                        fontSize: '13px',
                        color: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#D52832'; e.target.style.boxShadow = '0 0 0 2px rgba(213,40,50,0.25)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#2E3F5F'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
              )}

              {/* Tombol Submit */}
              <div style={{ paddingTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: busy ? 'rgba(213,40,50,0.5)' : '#D52832',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '14px',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'background 0.2s',
                    boxShadow: '0 8px 24px rgba(213,40,50,0.30)',
                  }}
                  onMouseEnter={(e) => { if (!busy) (e.currentTarget as HTMLButtonElement).style.background = '#B91C1C'; }}
                  onMouseLeave={(e) => { if (!busy) (e.currentTarget as HTMLButtonElement).style.background = '#D52832'; }}
                >
                  {busy ? (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid #fff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                  ) : (
                    <>
                      <span>{isSignUp ? 'Daftar Sebagai Admin' : 'Masuk ke Portal Admin'}</span>
                      <ArrowRight style={{ width: '16px', height: '16px' }} />
                    </>
                  )}
                </button>
              </div>

              {/* Toggle Login / Sign Up */}
              <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                  {isSignUp ? 'Sudah memiliki akun admin? ' : 'Perlu akses administrator baru? '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      color: '#EE5A62',
                      textDecoration: 'underline',
                      fontSize: '12px',
                    }}
                  >
                    {isSignUp ? 'Masuk di sini' : 'Daftar Akun Admin'}
                  </button>
                </p>
              </div>
            </form>

            {/* Footer Card */}
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(38,53,80,1)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.625rem',
                fontSize: '11px',
                color: '#475569',
                lineHeight: 1.6,
              }}
            >
              <ShieldCheck style={{ width: '16px', height: '16px', color: '#475569', flexShrink: 0, marginTop: '1px' }} />
              <span>
                <strong style={{ color: '#64748b' }}>Khusus Hak Akses Admin:</strong> Akun pegawai biasa tidak diizinkan masuk ke portal ini. Kredensial diproteksi oleh Firebase Authentication.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          padding: '1rem 3.5rem',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(7,20,47,0.40)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#475569',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span>© 2026 Komisi Pemilihan Umum Provinsi Sulawesi Utara</span>
        <span>Platform Terpadu Penunjang KPU (PTP-KPU) • Versi Admin 2.0</span>
      </footer>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          main { flex-direction: column !important; padding: 2rem 1.5rem !important; }
          header { padding: 1rem 1.5rem !important; }
          footer { padding: 0.75rem 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
