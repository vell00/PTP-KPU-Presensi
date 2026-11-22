import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../domain/attendance.dart';
import '../../../core/utils/date_time.dart';

/// Sinkronisasi presensi pegawai ke Firestore secara terpusat untuk Dashboard Admin Next.js
/// dan sinkronisasi status presensi hari ini agar durasi kerja tetap berlanjut
class PresensiSyncService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Simpan atau perbarui data presensi (Masuk / Keluar) pada Firestore
  static Future<void> kirimPresensi({
    required Attendance record,
    double? latitude,
    double? longitude,
    String? nip,
    String? nama,
  }) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      final effectiveNip = nip ?? user?.email?.split('@').first ?? '198001012005011001';
      final docId = '${effectiveNip}_${dayKey(record.entered)}';

      final Map<String, dynamic> data = {
        'userId': user?.uid ?? 'offline-demo',
        'email': user?.email ?? '$effectiveNip@nip.hadir.invalid',
        'nip': effectiveNip,
        'nama': nama ?? record.name,
        'unit': record.division,
        'mode': record.mode, // WFO / WFH
        'waktu': FieldValue.serverTimestamp(),
        'masuk': record.entered.toIso8601String(),
        'keluar': record.exited?.toIso8601String(),
        'durasiDetik': record.exited?.difference(record.entered).inSeconds,
        'latitude': latitude,
        'longitude': longitude,
        'status': 'Hadir',
      };

      await _firestore
          .collection('presensi')
          .doc(docId)
          .set(data, SetOptions(merge: true));
    } catch (e) {
      // Tidak memblokir alur utama jika jaringan terputus
      // ignore: avoid_print
      print('PresensiSyncService gagal mengirim ke Firestore: $e');
    }
  }

  /// Ambil presensi hari ini langsung dari Firestore berdasarkan NIP
  /// Memastikan durasi jam kerja tidak hilang saat aplikasi ditutup atau ter-logout
  static Future<Attendance?> ambilPresensiHariIni(String nip, DateTime date) async {
    try {
      final docId = '${nip}_${dayKey(date)}';
      final doc = await _firestore.collection('presensi').doc(docId).get();
      if (doc.exists && doc.data() != null) {
        final data = doc.data()!;
        final masukStr = data['masuk'] as String?;
        if (masukStr != null) {
          final entered = DateTime.parse(masukStr);
          final keluarStr = data['keluar'] as String?;
          final exited = keluarStr != null ? DateTime.parse(keluarStr) : null;
          final mode = data['mode'] as String? ?? 'WFO';
          final nama = data['nama'] as String? ?? 'Pegawai';
          final unit = data['unit'] as String? ?? 'Subbagian';

          final att = Attendance(nama, unit, mode, entered);
          att.exited = exited;
          return att;
        }
      }
    } catch (e) {
      // ignore: avoid_print
      print('PresensiSyncService gagal mengambil data hari ini: $e');
    }
    return null;
  }
}
