# Admin Portal • Hadir KPU Sulawesi Utara

Web Admin Portal khusus pengelola dan administrator KPU Provinsi Sulawesi Utara. Dibuat terpisah dari aplikasi mobile presensi pegawai.

## Teknologi
- **Framework**: Next.js 15 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS
- **Ikon**: Lucide React
- **Penyimpanan**: LocalStorage (Mirror schema AppStore Flutter) / Siap dihubungkan ke Firebase Cloud Firestore

## Fitur Portal Admin
1. **Ringkasan Dashboard (`/`)**:
   - Kartu metrik total pegawai, presensi hari ini (WFO vs WFH), rasio ketepatan waktu, dan pengajuan izin yang pending.
   - Tabel ringkasan aktivitas kehadiran masuk secara real-time.
2. **Rekapitulasi Kehadiran (`/rekap`)**:
   - Filter pencarian nama pegawai.
   - Filter subdivisi organisasi.
   - Filter metode kerja (WFO / WFH).
   - Filter status ketepatan waktu (Tepat Waktu / Terlambat).
   - Tombol unduh laporan rekap.
3. **Manajemen Pegawai (`/pegawai`)**:
   - Direktori daftar seluruh pegawai KPU.
   - Tambah & Edit data pegawai.
   - Validasi ketat NIP 18-digit angka dan pencegahan NIP duplikat.
   - Pemilihan Bagian & Subbagian terstruktur sesuai organisasi KPU Sulut.
4. **Persetujuan Izin & Cuti (`/izin`)**:
   - Antrean daftar permohonan izin/cuti pegawai.
   - Tombol aksi Setujui / Tolak dengan dialog konfirmasi persisten.
5. **Pengaturan Lokasi & Kebijakan (`/pengaturan`)**:
   - Titik Geolocation kantor KPU Sulut (Latitude & Longitude).
   - Radius toleransi presensi kantor (meter).
   - Kebijakan izin WFH hari Jumat.

## Cara Menjalankan

```bash
# Masuk ke direktori admin-dashboard
cd admin-dashboard

# Install dependensi (jika belum)
npm install

# Jalankan server development
npm run dev
```

Buka browser di [http://localhost:3000](http://localhost:3000).
