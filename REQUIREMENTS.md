# System Requirements Specification
## PTP-KPU-Presensi — KPU Provinsi Sulawesi Utara

Dokumen ini memuat spesifikasi perangkat lunak, dependensi, dan prasyarat perangkat keras untuk menjalankan sistem Presensi KPU Sulawesi Utara yang terdiri dari:
1. **Aplikasi Mobile Pegawai** (`flutter_application_1`)
2. **Portal Web Admin** (`admin-dashboard`)

---

## 1. Prasyarat Lingkungan (Environment Prerequisites)

| Komponen | Versi Minimal | Versi Rekomendasi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Sistem Operasi** | Windows 10 (64-bit) | Windows 11 / macOS | Mendukung build Android & Web |
| **Flutter SDK** | `3.38.0` | `3.38.4` | Framework aplikasi mobile pegawai |
| **Dart SDK** | `3.10.0` | `3.10.3` | Bahasa pemrograman mobile |
| **Node.js** | `18.x` | `22.x LTS` | Runtime untuk web admin portal |
| **Package Manager** | `npm 10.x` | `npm 11.x` | Pengelola paket dependensi web |
| **Android SDK** | API Level 24 (Android 7.0) | API Level 34 (Android 14) | Untuk menjalankan aplikasi di HP/Emulator |
| **Browser** | Chrome 115+ | Chrome versi terbaru | Akses dashboard admin web |

---

## 2. Dependensi Aplikasi Mobile Pegawai (`flutter_application_1`)

| Paket | Versi | Fungsi Utama |
| :--- | :--- | :--- |
| `geolocator` | `^14.0.3` | Mengambil titik koordinat GPS, menghitung radius jarak kantor, cek mock location |
| `image_picker` | `^1.2.3` | Membuka kamera depan untuk pengambilan foto selfie presensi |
| `shared_preferences` | `^2.5.5` | Menyimpan preferensi sesi dan data presensi offline / mode demo |
| `firebase_core` | `^4.15.0` | Inisialisasi koneksi layanan Firebase |
| `firebase_auth` | `^6.7.0` | Manajemen login NIP pegawai dan reset password pertama kali |
| `cloud_firestore` | `^6.10.0` | Sinkronisasi data presensi dan kebijakan presensi secara cloud |
| `cloud_functions` | `^6.5.0` | Menjalankan logika backend terverifikasi di server |
| `pdf` & `printing` | `^3.12.0` / `^5.14.3` | Membuat dan mencetak rekap bukti presensi serta estimasi tukin |

---

## 3. Dependensi Portal Web Admin (`admin-dashboard`)

| Paket | Versi | Fungsi Utama |
| :--- | :--- | :--- |
| `next` | `^15.1.4` | Framework web React modern dengan App Router |
| `react` & `react-dom`| `^19.0.0` | Library utama antarmuka pengguna |
| `lucide-react` | `^1.16.0` | Paket ikon SVG modern dan ringan |
| `tailwindcss` | `^3.4.17` | Utility-first CSS framework untuk antarmuka responsif |
| `typescript` | `^5.7.3` | Pengecekan tipe data statis untuk mencegah bug saat runtime |
| `clsx` & `tailwind-merge` | `^2.1.1` / `^2.6.0` | Penggabungan class conditional CSS yang aman |

---

## 4. Izin Perangkat Mobile (Android / iOS Permissions)

Aplikasi mobile membutuhkan izin berikut pada `AndroidManifest.xml` & `Info.plist`:
* `ACCESS_FINE_LOCATION`: Akurasi tinggi GPS untuk memastikan pegawai berada di dalam radius kantor.
* `ACCESS_COARSE_LOCATION`: Perkiraan lokasi berbasis jaringan/BTS seluler.
* `CAMERA`: Mengambil foto wajah pegawai saat melakukan presensi masuk dan pulang.
* `INTERNET`: Sinkronisasi data ke cloud server.

---

## 5. Port & Jaringan Default

* **Web Admin Dev Server**: `http://localhost:3000`
* **Flutter Chrome Debug**: `http://localhost:<random-port>`
* **Region Firebase Cloud**: `asia-southeast2` (Jakarta)
* **Zona Waktu Standar Operasional**: WITA (Waktu Indonesia Tengah / UTC+8)
