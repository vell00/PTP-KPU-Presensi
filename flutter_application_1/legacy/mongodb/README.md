> ARSIP: aplikasi aktif sekarang memakai Firebase. Ikuti ../../docs/firebase.md. Perintah di bawah hanya dokumentasi implementasi lama.

# Hadir API — MongoDB Atlas

Backend penyimpanan **workspace prototipe admin** untuk aplikasi Flutter yang ada. Bukan backend presensi produksi: belum ada akun pegawai, verifikasi wajah/liveness, bukti lokasi server, dan payroll resmi. Seluruh endpoint data membutuhkan sesi admin.

## 1. Siapkan Atlas

1. Buat cluster/deployment pada MongoDB Atlas.
2. Buat **database user** khusus aplikasi dengan hak `readWrite` hanya pada database `hadir_kpu`. Ini berbeda dari akun login dashboard Atlas maupun admin aplikasi.
3. Pada Network Access, izinkan IP keluar server backend. Flutter tidak perlu akses langsung ke Atlas. Hindari membuka akses ke seluruh internet.
4. Buka Connect → Drivers, salin connection string Node.js.
5. Di direktori `server`, salin `.env.example` menjadi `.env`. Isi `MONGODB_URI` sesuai cluster, username dan password database (URL-encode karakter khusus pada password URI). Isi `ADMIN_EMAIL` serta `ADMIN_PASSWORD` unik minimal 12 karakter.

Jangan masukkan `.env`, URI atau password ke repository, `--dart-define`, maupun chat. `.env` sudah diabaikan Git. Backend memerlukan Node.js 22+.

```sh
cd server
npm ci
cp .env.example .env
# Edit .env dengan konfigurasi Atlas milik Anda.
npm run seed:admin
npm start
```

`seed:admin` membuat akun admin dengan hash scrypt. Akun yang sudah ada tidak ditimpa. Setelah seed, hapus nilai ADMIN_PASSWORD dari `.env`; server normal tidak memerlukannya. Token sesi acak hanya disimpan di memori Flutter, hash token disimpan di MongoDB dengan TTL 8 jam. Refresh penuh browser memerlukan login ulang.

## 2. Jalankan Flutter

Development web dengan port tetap untuk CORS:

```sh
flutter run -d web-server --web-hostname localhost --web-port 8080 --dart-define=API_BASE_URL=http://localhost:3000
```

Buka `http://localhost:8080` di browser. `.env` default memuat `CORS_ORIGINS=http://localhost:8080`. Jangan gunakan port/origin lain tanpa menambahkannya (daftar dipisahkan koma).

Deployment Android/iOS/web:

```sh
flutter run --dart-define=API_BASE_URL=https://api.domain-anda.id
flutter build web --dart-define=API_BASE_URL=https://api.domain-anda.id
```

Backend default bind ke `127.0.0.1:3000`; letakkan reverse proxy TLS/HTTPS di depannya. Alamat API adalah server Node.js, **bukan** connection string Atlas. Ponsel fisik tidak bisa memakai localhost komputer. Android/iOS memerlukan endpoint HTTPS untuk konfigurasi platform yang ada. Tidak ada pelemahan kebijakan cleartext global.

Tanpa API_BASE_URL, aplikasi tetap dalam demo lokal SharedPreferences. Saat API_BASE_URL diisi, login server wajib; tidak ada fallback diam-diam ke data lokal. Data lokal/contoh tidak diunggah otomatis. Tombol sinkronisasi memuat ulang server; pembaruan belum realtime.

## API

- `GET /health`: konektivitas database.
- `POST /api/auth/login`: `{email,password}` → token admin.
- `POST /api/auth/logout`: membatalkan token.
- `GET /api/workspace`: `{revision,data}`.
- `PUT /api/workspace`: `{revision,data}` → versi berikutnya; `409` bila versi sudah tertinggal.

Semua endpoint kecuali health/login memakai `Authorization: Bearer <token>`. Request JSON maksimal 4 MB. Login dibatasi per IP. CORS dibatasi ke origin konfigurasi. Data divalidasi dan NIP duplikat ditolak. PUT menggunakan pembaruan atomik bersyarat revision, sehingga dua klien tidak diam-diam menimpa data. Bila respons tulis hilang, Flutter memuat ulang untuk rekonsiliasi, bukan mengulang tulis otomatis.

## Model penyimpanan MVP

- `users`: email unik, passwordHash, role admin.
- `sessions`: hash token, userId, expiresAt dengan TTL index. Masa berlaku juga diperiksa pada setiap request.
- `workspaces`: satu dokumen `demo-admin` berisi records, requests, employees, pengaturan, revision dan waktu pembaruan server.

Dokumen workspace dipilih agar struktur aplikasi demo tersimpan atomik pada Atlas tanpa mensyaratkan transaksi multi-dokumen. Batas: 5.000 presensi, 2.000 izin dan 1.000 pegawai; bukan rancangan untuk arsip presensi besar. Sebelum produksi, pisahkan koleksi presensi/izin/pegawai dengan ID dan indeks unik pegawai+tanggal, endpoint berbasis peran, pagination, audit immutable, waktu server, dan pemeriksaan bukti presensi. Pergantian tampilan pegawai pada prototipe tetap berada dalam sesi admin dan tidak mewakili akun pegawai.

## Pengujian

```sh
npm test
```

Tes memakai MongoDB sementara (`mongodb-memory-server`), tidak menyentuh cluster Atlas. Binary MongoDB resmi akan diunduh bila belum tersedia. Menguji login, validasi, persistensi sesudah inisialisasi ulang, konflik revision, serta logout.

Dokumentasi resmi: https://www.mongodb.com/docs/drivers/node/current/connect/ dan https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/
