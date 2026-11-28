# PTP-KPU-Presensi — KPU Sulawesi Utara

Sistem Presensi KPU Sulawesi Utara terpisah menjadi dua aplikasi independen:
1. **`flutter_application_1/`**: Aplikasi Mobile Flutter khusus **Pegawai** (Presensi WFO/WFH, verifikasi geolokasi/GPS, foto selfie, timer jam kerja, riwayat presensi).
2. **`admin-dashboard/`**: Portal Web Next.js + TypeScript khusus **Administrator** (Dashboard ringkasan, rekapitulasi kehadiran dengan filter, direktori & manajemen NIP pegawai, persetujuan izin/cuti, dan pengaturan titik koordinat kantor).

---

## 1. Menjalankan Aplikasi Mobile Pegawai (Flutter)

```sh
cd flutter_application_1
flutter pub get
flutter run # Menjalankan pada perangkat fisik Android/iOS atau emulator (Pixel 9)
flutter test # Menjalankan seluruh automated unit test suite
```

## 2. Menjalankan Web Portal Admin (Next.js)

```sh
cd admin-dashboard
npm install
npm run dev # Buka http://localhost:3000 di browser
```

---

## 3. Evaluasi & Kekurangan Sistem yang Perlu Diperbaiki

Berikut adalah catatan hasil audit sistem yang perlu diperbaiki oleh tim pengembang sebelum masuk ke tahap produksi:

### A. Celah Keamanan & Anti-Fraud Presensi (Prioritas Tinggi)
1. **Waktu Presensi Masih Menggunakan Jam Perangkat (Client Clock)**:
   - *Masalah*: Di `employee_attendance_page.dart`, waktu jam masuk diambil dari `DateTime.now()` perangkat HP lokal.
   - *Risiko*: Pegawai yang terlambat dapat memundurkan waktu di pengaturan HP mereka untuk memanipulasi status menjadi "Tepat Waktu".
   - *Solusi*: Waktu presensi wajib diperoleh dari server tepercaya (NTP server atau `FieldValue.serverTimestamp()` di Firebase Firestore).
2. **Bukti Foto Selfie Belum Disimpan**:
   - *Masalah*: Kamera hanya membuka alur pengambilan gambar di HP, namun file foto selfie belum diunggah ke cloud storage (Firebase Storage).
   - *Solusi*: Unggah dan tautkan URL foto selfie pada transaksi presensi harian sebagai bukti otentik, serta pertimbangkan integrasi face liveness detection.
3. **Deteksi Fake GPS / Mock Location Masih Terbatas**:
   - *Masalah*: Hanya mengandalkan properti `position.isMocked` bawaan plugin geolocator, yang dapat di-bypass pada perangkat yang di-*root* atau dimodifikasi.
   - *Solusi*: Tambahkan verifikasi integritas perangkat (*Play Integrity API* untuk Android dan *DeviceCheck* untuk iOS).

### B. Arsitektur Database (Firestore Data Modeling)
1. **Model Monolithic Document (Satu Dokumen untuk Seluruh Kantor)**:
   - *Masalah*: Pada `FirestoreWorkspaceRepository`, seluruh catatan presensi, direktori pegawai, dan izin ditumpuk dalam satu dokumen (`workspaces/kpu-sulut`) dengan batas manual 700 KB.
   - *Risiko*: Firestore membatasi kapasitas maksimal 1 MB per dokumen. Jika transaksi presensi bertambah setiap hari, dokumen ini akan melebihi kuota dan menyebabkan kegagalan sistem.
   - *Solusi*: Pecah data menjadi koleksi transaksi independen:
     - `attendances/{attendanceId}` (1 dokumen per transaksi masuk/pulang)
     - `users/{userId}` (1 dokumen per profil pegawai)
     - `leave_requests/{requestId}` (1 dokumen per permohonan izin)

### C. Logika Bisnis & Regulasi
1. **Pengajuan Izin Masih Terbatas 1 Hari**:
   - Perlu penambahan fitur izin/cuti dengan rentang tanggal (multi-day) dan opsi melampirkan berkas bukti (misal: surat sakit PDF/JPG).
2. **Kalender Hari Libur Nasional Dinamis**:
   - Saat ini validasi hari kerja hanya mengecek akhir pekan (`weekday > 5`). Perlu integrasi API atau daftar tanggal merah / cuti bersama resmi pemerintah.

---

## 4. Rekomendasi Restrukturisasi Folder (Mobile Pegawai vs Web Admin)

Agar proses *debugging* cepat dan developer tidak bingung ketika terjadi bug, struktur kode dipisahkan secara tegas:

### A. Struktur Mobile Pegawai (`flutter_application_1/lib/`)
Fokus hanya pada pengalaman pegawai, hapus halaman admin yang tidak diperlukan dari mobile:
```text
lib/
├── main.dart
├── app/
│   ├── app.dart                    # Inisialisasi MaterialApp & Theme
│   └── routes.dart                 # Rute halaman mobile pegawai
├── core/
│   ├── services/
│   │   ├── location_service.dart   # GPS & verifikasi radius kantor
│   │   └── camera_service.dart     # Pengambilan foto selfie
│   ├── constants/                  # Jam kerja WITA, aturan ISHOMA
│   └── utils/                      # Formatter tanggal & mata uang
└── features/
    ├── auth/                       # Login NIP pegawai & ganti password
    ├── attendance/                 # Presensi WFO, WFH, indikator radius, timer
    ├── history/                    # Riwayat presensi bulanan pegawai bersangkutan
    └── leave/                      # Formulir pengajuan izin / cuti mandiri
```

### B. Struktur Web Admin (`admin-dashboard/src/`)
Fokus pada rekapitulasi, persetujuan, dan manajemen instansi:
```text
src/
├── app/
│   ├── page.tsx                    # Ringkasan dashboard & metrik kehadiran
│   ├── rekap/page.tsx              # Rekapitulasi presensi & filter
│   ├── pegawai/page.tsx            # Direktori & CRUD pegawai KPU
│   ├── izin/page.tsx               # Persetujuan (approval) izin & cuti
│   └── pengaturan/page.tsx         # Titik Geolocation kantor KPU & WFH Jumat
├── components/                     # Sidebar, Topbar, Modals
├── lib/                            # Store state lokal & integrasi API/Firebase
└── types/                          # Definisi tipe TypeScript
```
