# Firebase — Hadir KPU Sulawesi Utara

Firebase Authentication menangani kredensial; Firestore menyimpan profil; Cloud Functions membuat akun dan menyelesaikan penggantian password pertama. Proyek cloud belum dibuat. Demo lokal tetap tersedia tanpa Firebase.

## Jalankan emulator tanpa proyek cloud

Memerlukan Flutter, Node.js 22 dan Java 21+. Pada komputer ini Java dapat diaktifkan dengan `export PATH="/home/kai/android-studio/android-studio/jbr/bin:$PATH"`.

Dari root proyek:

```sh
npm --prefix functions ci
npm --prefix firebase ci
cp functions/.secret.local.example functions/.secret.local
npm --prefix firebase run emulators
```

Di terminal kedua:

```sh
npm --prefix firebase run seed:emulator
flutter run -d web-server --web-hostname localhost --web-port 8080 \
  --dart-define=USE_FIREBASE=true --dart-define=FIREBASE_EMULATORS=true
```

Admin lokal: NIP `198001012005011001`, password `Demo-Hadir-123!`. Login pertama wajib mengganti password lalu login ulang. Password awal akun yang dibuat admin juga `Demo-Hadir-123!`, khusus emulator. Menjalankan ulang seed mengembalikan admin demo ke password awal.

Emulator memakai proyek `demo-hadir-kpu`: Auth 9099, Firestore 8085, Functions 5001, UI 4000. Data hilang saat emulator berhenti tanpa export/import. Android emulator memakai `10.0.2.2`; perangkat nyata memerlukan konfigurasi jaringan/transport pengembangan tersendiri atau proyek Firebase asli.

## Struktur pengguna dan akses

- Menu admin **Manajemen Pengguna**: tambah akun, cari NIP/nama/unit/jabatan, edit jabatan dan penempatan. NIP 18 digit harus unik dan tidak dapat diubah.
- Tiga bagian dan enam subbagian ditentukan di `lib/features/users/domain/organization.dart` dan divalidasi ulang oleh `functions/src/organization.js`.
- Kepala Bagian berada pada tingkat bagian, tanpa subbagian. Kepala Sub Bagian dan Staf wajib memilih subbagian di bawah bagian yang dipilih.
- Jabatan terpisah dari hak administrator (`isAdmin`). Jabatan Kepala Bagian tidak otomatis memberikan hak mengelola akun. Pengelola tepercaya dapat memberikan hak admin menggunakan skrip `admin:grant`.
- Login NIP dipetakan secara internal ke `${nip}@nip.hadir.invalid` untuk Firebase Email/Password. Alamat ini bukan kotak surat; pemulihan melalui email belum tersedia.
- Password awal bersama disimpan sebagai secret server `INITIAL_USER_PASSWORD`, bukan dalam Flutter atau dokumen pengguna. Pengelola memberikan password awal kepada pengguna melalui saluran internal.
- Profil `users/{uid}` hanya dapat ditulis server. Pengguna hanya dapat membaca profil sendiri; admin yang telah mengganti password dapat membaca daftar pengguna.
- `mustChangePassword` memblokir dashboard, data dan fungsi admin sebelum password diganti. Password baru 12–128 karakter dengan huruf besar, kecil, angka dan berbeda dari password awal.
- Penggantian pertama merotasi `sessionVersion`, mencabut refresh token dan meminta login ulang. Token sesi awal tidak dapat mengakses data setelah gate terbuka. Jika proses lintas layanan gagal, akses tetap tertutup; masuk kembali dengan password terbaru dan ulangi bila diminta.

## Hubungkan proyek cloud asli

1. Buat proyek Firebase dan aktifkan Email/Password di Authentication serta database Firestore `(default)` dalam production mode. [Cloud Functions memerlukan paket Blaze untuk deployment](https://firebase.google.com/docs/functions/get-started).
2. Konfigurasikan aplikasi:

```sh
firebase login
dart pub global activate flutterfire_cli
flutterfire configure --project=PROJECT_ID --platforms=android,ios,web
```

Perintah mengganti placeholder `lib/firebase_options.dart`. iOS minimal 15. Kredensial service-account tidak boleh dimasukkan ke Flutter atau repository.

3. Tentukan password awal bersama melalui prompt rahasia, kemudian deploy:

```sh
firebase functions:secrets:set INITIAL_USER_PASSWORD --project PROJECT_ID
firebase deploy --only functions,firestore:rules,firestore:indexes --project PROJECT_ID
```

4. Dari mesin tepercaya dengan Application Default Credentials yang diizinkan mengelola Auth/Firestore, buat admin pertama. Isi environment `INITIAL_USER_PASSWORD` dengan nilai yang sama dengan secret tersebut; jangan menulis password pada argumen perintah atau Git. Contoh Bash:

```sh
read -rs -p 'Password awal: ' INITIAL_USER_PASSWORD
export INITIAL_USER_PASSWORD
npm --prefix firebase run admin:bootstrap -- PROJECT_ID 198001012005011001 "Nama Admin"
unset INITIAL_USER_PASSWORD
```

Gunakan NIP admin sebenarnya. Akun bootstrap diberi penempatan awal Kepala Bagian Keuangan Umum dan Logistik; sesuaikan melalui editor setelah masuk. Skrip menolak NIP yang sudah ada. Untuk memberi hak admin kepada akun yang telah dibuat:

```sh
npm --prefix firebase run admin:grant -- PROJECT_ID nip_NIP_PENGGUNA
```

5. Jalankan atau build Flutter dengan `--dart-define=USE_FIREBASE=true`. Tanpa flag ini aplikasi adalah demo lokal. Konfigurasi Firebase yang tidak lengkap menampilkan pesan konfigurasi, bukan diam-diam menyimpan secara lokal.

## Batas presensi prototipe

Manajemen akun menggunakan Firebase Auth yang sebenarnya. Penyimpanan presensi masih prototipe: admin memakai `workspaces/kpu-sulut`; pegawai memakai `employeeWorkspaces/{uid}` yang terisolasi. Pengaturan kantor berada pada `policies/attendance`. Rekap admin dan persetujuan izin belum mengagregasi workspace individual pegawai. Pratinjau pegawai oleh admin menggunakan data workspace admin.

Dokumen presensi memakai transaksi revision, server timestamp dan pemeriksaan penulis; batas 500 catatan/200 pengajuan per workspace. Ini belum merupakan bukti presensi resmi: pencocokan wajah, liveness, validasi lokasi/waktu di server, alur pengajuan terpusat dan audit immutable masih perlu dituntaskan sebelum produksi. WFH Jumat sementara mengikuti pengaturan Keuangan; unit lain tetap WFO. Tukin tetap estimasi, bukan payroll resmi.

Mode demo lokal tidak membuat akun Firebase dan tidak menyimpan password. MongoDB di `legacy/mongodb` hanya arsip.

## Pengujian

```sh
flutter analyze
flutter test
npm --prefix firebase run test:rules
npm --prefix firebase run test:functions
```

Pengujian emulator mencakup login, hierarki bagian/subbagian, duplikasi NIP, larangan mengangkat diri menjadi admin, penggantian password, penolakan password lama, gate onboarding, isolasi data pegawai dan revisi data.

Rujukan: [Firebase Flutter](https://firebase.google.com/docs/flutter/setup), [Admin user management](https://firebase.google.com/docs/auth/admin/manage-users), [Callable functions](https://firebase.google.com/docs/functions/callable), [Secrets](https://firebase.google.com/docs/functions/config-env).
