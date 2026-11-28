import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../domain/attendance.dart';
import '../../leave/domain/leave_request.dart';
import '../../../core/data/workspace_repository.dart';
import '../../../core/utils/date_time.dart';

class ServerAttendanceResponse {
  final String id;
  final String mode;
  final String dateKey;
  final DateTime entered;
  final DateTime? exited;
  final int lateMinutes;
  final int earlyLeaveMinutes;
  final int distanceMeters;
  final String status;

  const ServerAttendanceResponse({
    required this.id,
    required this.mode,
    required this.dateKey,
    required this.entered,
    this.exited,
    required this.lateMinutes,
    required this.earlyLeaveMinutes,
    required this.distanceMeters,
    required this.status,
  });
}

/// Centralized server-authoritative sync service for attendance & leave requests.
class PresensiSyncService {
  static FirebaseFirestore get _firestore => FirebaseFirestore.instance;
  static FirebaseFunctions get _functions =>
      FirebaseFunctions.instanceFor(region: 'asia-southeast2');

  /// Records check-in or check-out via authoritative `recordAttendance` Cloud Function
  /// (enforcing server WITA clock, holiday check, WFH schedule, geofence & PIN hash).
  static Future<ServerAttendanceResponse> catatPresensiServer({
    required bool isCheckOut,
    required String authMethod, // 'biometric' | 'pin'
    String? pin,
    double? latitude,
    double? longitude,
    double? accuracyMeters,
    bool isMocked = false,
    String? selfieUrl,
  }) async {
    try {
      final callable = _functions.httpsCallable('recordAttendance');
      final response = await callable.call(<String, dynamic>{
        'action': isCheckOut ? 'check_out' : 'check_in',
        'authMethod': authMethod,
        if (pin != null && pin.isNotEmpty) 'pin': pin,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (accuracyMeters != null) 'accuracyMeters': accuracyMeters,
        'isMocked': isMocked,
        if (selfieUrl != null && selfieUrl.isNotEmpty) 'selfieUrl': selfieUrl,
      });

      final data = Map<String, dynamic>.from(response.data as Map);
      return ServerAttendanceResponse(
        id: data['id']?.toString() ?? '',
        mode: data['mode']?.toString() ?? 'WFO',
        dateKey: data['dateKey']?.toString() ?? dayKey(witaNow()),
        entered: parseWitaIso(data['masukIso'].toString()),
        exited: data['keluarIso'] == null
            ? null
            : parseWitaIso(data['keluarIso'].toString()),
        lateMinutes: (data['lateMinutes'] as num?)?.toInt() ?? 0,
        earlyLeaveMinutes: (data['earlyLeaveMinutes'] as num?)?.toInt() ?? 0,
        distanceMeters: (data['distanceMeters'] as num?)?.toInt() ?? 0,
        status: data['status']?.toString() ?? 'Tepat Waktu',
      );
    } on FirebaseFunctionsException catch (e) {
      throw StorageException(
        e.message ?? 'Presensi gagal diproses oleh server (${e.code}).',
      );
    }
  }

  /// Fetches today's attendance directly from Firestore `presensi` for the signed-in employee.
  static Future<Attendance?> ambilPresensiHariIni(
    String uid,
    DateTime date,
  ) async {
    final docId = '${uid}_${dayKey(date)}';
    final snap = await _firestore.collection('presensi').doc(docId).get();
    if (!snap.exists || snap.data() == null) return null;
    return Attendance.fromJson(snap.data()!);
  }

  /// Submits a multi-day leave / correction request directly to shared `requests` collection
  /// so it appears immediately in the Next.js Admin Portal.
  static Future<LeaveRequest> kirimPengajuanIzin({
    required String nip,
    required String name,
    required String unit,
    required String type,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    String? attachmentUrl,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw const StorageException('Sesi login tidak aktif. Silakan masuk kembali.');
    }
    final startKey = dayKey(startDate);
    final endKey = dayKey(endDate);
    final daysCount = endDate.difference(startDate).inDays + 1;
    if (daysCount < 1 || daysCount > 60) {
      throw const StorageException('Rentang tanggal izin tidak valid (1–60 hari).');
    }

    final docRef = _firestore.collection('requests').doc();
    final payload = <String, dynamic>{
      'uid': user.uid,
      'nip': nip,
      'name': name,
      'unit': unit,
      'type': type,
      'startDate': startKey,
      'endDate': endKey,
      'daysCount': daysCount,
      'reason': reason.trim(),
      if (attachmentUrl != null && attachmentUrl.trim().isNotEmpty)
        'attachmentUrl': attachmentUrl.trim(),
      'status': 'Menunggu',
      'createdAt': FieldValue.serverTimestamp(),
    };

    await docRef.set(payload);

    return LeaveRequest(
      name,
      type,
      reason.trim(),
      startKey,
      'Menunggu',
      docRef.id,
      user.uid,
      nip,
      unit,
      endKey,
      daysCount,
      attachmentUrl,
    );
  }
}
