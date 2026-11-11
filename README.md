# PTP-KPU-Presensi — KPU Sulawesi Utara

Implementasi MVP Flutter untuk Android, iOS dan dashboard web admin. **Prototipe, belum siap sebagai sistem presensi resmi.** Mode default menyimpan data dengan SharedPreferences. Mode Firebase menyediakan login NIP, manajemen pengguna, pergantian password awal wajib dan Cloud Firestore; lihat [panduan Firebase](docs/firebase.md). Proyek Firebase asli belum dikonfigurasi. Akun pegawai memiliki profil jabatan dan unit serta data presensi prototipe terisolasi. Peran dapat diganti melalui tombol panah pada profil sidebar.

## Menjalankan

```sh
flutter pub get
flutter run -d chrome
flutter run # pilih perangkat Android/iOS
flutter test
flutter analyze
flutter build web
```

Build iOS memerlukan macOS, Xcode, signing dan pengujian pada iPhone. Geolokasi dan kamera perlu diuji pada perangkat nyata. Versi SDK mengikuti pubspec.yaml; dependensi terkunci di pubspec.lock.

## Fitur

- Dashboard responsif dengan grafik dan data contoh yang diberi label.
- Filter nama, subdivisi, status dan bulan pada rekap.
- Direktori pegawai lokal: tambah/edit, validasi NIP 18 digit dan duplikasi.
- Pengajuan izin/cuti satu hari, persetujuan/penolakan dengan konfirmasi, status persisten.
- Presensi masuk/keluar demo pada Android/iOS, selfie kamera depan, timer efektif, riwayat dan pencegahan duplikasi harian.
- WITA (UTC+8): Senin–Kamis 08.00–16.00; Jumat 08.00–16.30. Akhir pekan diblokir. ISHOMA awal Senin–Kamis 12.00–13.00, Jumat 11.30–13.00. Jam ISHOMA adalah asumsi yang harus disetujui instansi.
- Pengecualian lokasi WFH hanya Jumat untuk subdivisi Keuangan, Umum & Logistik, dapat dimatikan di Pengaturan. Subdivisi tersebut dipilih sebagai contoh, bukan kebijakan resmi.
- WFO: izin lokasi, GPS aktif, timeout 20 detik, indikator `Position.isMocked`, akurasi maksimum 50 m, lokasi berumur maksimum satu menit, dan radius kantor dengan margin akurasi. Koordinat kantor sengaja belum diisi; admin harus memasukkan lokasi yang benar.
- PDF bulanan hanya memuat presensi lokal bulan terpilih, **tidak mengikutkan data contoh**. PDF diberi label demo.
- Simulasi tukin dengan input dasar, potongan kehadiran dan capaian prestasi; cetak PDF estimasi.

## Dasar tunjangan kinerja

Rujukan penelusuran 23 September 2026:

- JDIH KPU: Kepsekjen 326/2022 diubah melalui Kepsekjen 1090/2025.
- Dokumen 1090/2025: https://jdih.kpu.go.id/kepsekjen/download/365
- JDIH: https://jdih.kpu.go.id/kepsekjen/detail/EVTo0n8GsGd52yUwVACf0GQ1b0ZXY2hMVkpIdnYxdjRUTnFQOWc9PQ

Dokumen memuat bobot kehadiran 40% dan prestasi kerja 60%. Simulator menghitung dua komponen itu dengan parameter input manual. Ini bukan mesin payroll resmi: tabel potongan, pengecualian cuti/sakit/dinas, penggantian keterlambatan, ambang potongan, status CPNS/PPPK dan tarif kelas jabatan belum dimodelkan. Acuan waktu dalam juknis berbeda dengan jadwal 08.00 yang diminta; karena itu aplikasi tidak mengubah keterlambatan menjadi potongan tukin secara otomatis. Tidak menggunakan aturan TPP Pemprov Sulut atau Bawaslu untuk menggantikan aturan KPU.

## Batas keamanan dan pekerjaan produksi

- Selfie hanya menguji alur kamera. Tidak ada pencocokan wajah, enrollment atau liveness; foto tidak dijadikan bukti tersimpan. Catatan hanya demo dan memerlukan konfirmasi eksplisit.
- `isMocked` adalah sinyal dari OS/plugin, bukan jaminan mendeteksi semua spoofing. Aplikasi tidak dapat mematikan aplikasi lain. Presensi WFO diblokir saat sinyal mock aktif. Geolokasi sengaja tidak diminta pada WFH.
- Web hanya untuk admin/pratinjau. Presensi web diblokir karena pemeriksaan perangkat setara mobile tidak tersedia.
- Repository Firestore, Firebase Auth dan Security Rules sudah tersedia. Sebelum penggunaan nyata, lengkapi agregasi presensi/pengajuan antarpegawai, waktu server untuk presensi, kebijakan subdivisi, indeks unik pegawai/tanggal dan audit. SharedPreferences, jam perangkat, serta pergantian peran demo tidak memenuhi persyaratan keamanan produksi.
- Integrasikan verifikasi wajah/liveness dan device attestation (Play Integrity/App Attest) pada server. Uji izin ditolak, mock location, GPS buruk, batas radius, restart dan WFH pada Android/iPhone nyata.
- Direktori pegawai lokal belum mengubah identitas pegawai demo. Ringkasan/grafik memakai data contoh, bukan metrik instansi.
- Kalender hari libur nasional, cuti multi-hari/lampiran, approval berjenjang, payroll per pegawai dan integrasi backend masih perlu dibangun.

## Struktur modular

```text
lib/
  main.dart                     # Bootstrap saja (3 baris)
  app/                          # MaterialApp, shell dan navigasi
    widgets/                    # Sidebar dan topbar
  core/
    config/                     # Konstanta aplikasi
    data/                       # AppStore dan kontrak repository, ChangeNotifier
    firebase/                   # Bootstrap dan repository Firestore
    theme/                      # Warna dan ThemeData
    ui/                         # Komponen bersama, pemilih bulan
    utils/                      # Format tanggal WITA dan rupiah
  features/
    auth/                       # Controller sesi, login, ilustrasi
    dashboard/                  # Ringkasan, grafik dan painter
    attendance/                 # Model, aturan kerja, GPS/kamera, rekap, timer
    users/                  # Direktori dan editor pegawai
    leave/                      # Model izin, pengajuan dan persetujuan
    allowance/                  # Rumus dan halaman simulator tukin
    settings/                   # Pengaturan jadwal dan formulir lokasi
    reports/                    # Ekspor PDF tanpa ketergantungan BuildContext
```

Halaman menyimpan state formulir/filter masing-masing. `AppStore` memberi notifikasi hanya saat data berubah; shell tidak menjalankan timer. Timer satu detik hanya aktif di `WorkDuration` selama presensi berjalan. Layanan perangkat dan PDF terpisah dari widget agar bisa diganti/dikembangkan tanpa mengubah bootstrap. Filter tabel dihitung sekali per build. Tidak ada dependensi state-management baru.

### Status referensi Figma

Referensi: https://www.figma.com/make/52X3AnmuOWd4mLoPLHCMtY/Sistem-Presensi-KPU-Sulut

Thumbnail publik berhasil dibaca. Halaman login mode Firebase disesuaikan dengan elemen yang terlihat: latar navy, kartu putih membulat, tombol merah, ilustrasi kantor. Ilustrasi dibuat dengan CustomPainter dan ikon pemilu generik, bukan logo resmi KPU. Detail frame/kode Figma dan halaman lainnya belum tersedia melalui koneksi desain; kesetaraan seluruh frontend belum terverifikasi. Login dapat dibuka dengan konfigurasi USE_FIREBASE=true, sedangkan mode demo tetap langsung ke dashboard.

## Firebase

Penyimpanan cloud menggunakan **Cloud Firestore**, login menggunakan **Firebase Authentication**. Integrasi dapat dicoba dengan emulator lokal sebelum membuat proyek Firebase. Panduan lengkap ada di [docs/firebase.md](docs/firebase.md).

```sh
flutter run --dart-define=USE_FIREBASE=true --dart-define=FIREBASE_EMULATORS=true
```

Jalankan emulator dan seed admin terlebih dahulu sesuai panduan. Backend MongoDB sebelumnya diarsipkan di `legacy/mongodb/` dan tidak lagi dipanggil aplikasi. Konfigurasi `API_BASE_URL` lama sudah tidak digunakan.
