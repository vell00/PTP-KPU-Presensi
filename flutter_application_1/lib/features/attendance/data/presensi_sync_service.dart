import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/attendance.dart';

/// Sinkronisasi presensi pegawai ke Firestore secara terpusat untuk Dashboard Admin Next.js
class PresensiSyncService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  static Future<void> kirimPresensi({
    required Attendance record,
    double? latitude,
    double? longitude,
    String? nip,
    String? nama,
  }) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      await _firestore.collection('presensi').add({
        'userId': user?.uid ?? 'offline-demo',
        'email': user?.email ?? '${nip ?? "198001012005011001"}@nip.hadir.invalid',
        'nip': nip ?? '198001012005011001',
        'nama': nama ?? record.name,
        'unit': record.division,
        'mode': record.mode, // WFO / WFH
        'waktu': FieldValue.serverTimestamp(),
        'masuk': record.entered.toIso8601String(),
        'keluar': record.exited?.toIso8601String(),
        'latitude': latitude,
        'longitude': longitude,
        'status': 'Hadir',
      });
    } catch (e) {
      // Tidak memblokir alur utama jika jaringan terputus
      // ignore: avoid_print
      print('PresensiSyncService gagal mengirim ke Firestore: $e');
    }
  }
}
