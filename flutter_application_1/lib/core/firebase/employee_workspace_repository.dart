import 'package:cloud_firestore/cloud_firestore.dart';
import '../data/workspace_repository.dart';
import '../../features/attendance/domain/attendance.dart';
import '../../features/leave/domain/leave_request.dart';

/// Employee repository synchronized directly with normalized Firestore collections:
/// - `settings/general` (office geofence, WFH schedule per subdepartment, work hours, holidays)
/// - `presensi` (employee's own attendance history)
/// - `requests` (employee's own leave/cuti requests & admin review statuses)
class EmployeeWorkspaceRepository implements WorkspaceRepository {
  final FirebaseFirestore firestore;
  final String uid;
  final String? nip;

  EmployeeWorkspaceRepository({
    required this.firestore,
    required this.uid,
    this.nip,
  });

  @override
  Future<Map<String, dynamic>> load() async {
    final settingsSnap = await firestore.doc('settings/general').get();
    final settings = settingsSnap.exists && settingsSnap.data() != null
        ? settingsSnap.data()!
        : <String, dynamic>{};

    final presensiSnap = await firestore
        .collection('presensi')
        .where('uid', isEqualTo: uid)
        .get();

    final records = presensiSnap.docs
        .map((d) => Attendance.fromJson(d.data()).toJson())
        .toList()
      ..sort(
        (a, b) => (b['entered'] as String).compareTo(a['entered'] as String),
      );

    final requestsSnap = await firestore
        .collection('requests')
        .where('uid', isEqualTo: uid)
        .get();

    final requests = requestsSnap.docs
        .map((d) => LeaveRequest.fromJson(d.data(), docId: d.id).toJson())
        .toList()
      ..sort(
        (a, b) =>
            (b['startDate'] as String).compareTo(a['startDate'] as String),
      );

    return {
      'revision': DateTime.now().millisecondsSinceEpoch,
      'data': {
        'records': records,
        'requests': requests,
        'fridayWfh': true,
        'latitude': (settings['latitude'] as num?)?.toDouble() ?? 1.4748,
        'longitude': (settings['longitude'] as num?)?.toDouble() ?? 124.8421,
        'radius': (settings['radius'] as num?)?.toDouble() ?? 100.0,
        if (settings['wfhSchedule'] is Map)
          'wfhSchedule': settings['wfhSchedule'],
        if (settings['workHours'] is Map) 'workHours': settings['workHours'],
        if (settings['holidays'] is List) 'holidays': settings['holidays'],
      },
    };
  }

  @override
  Future<Map<String, dynamic>> save(
    int revision,
    Map<String, dynamic> data,
  ) async {
    // Individual records and requests are persisted atomically via
    // `PresensiSyncService.recordAttendance` and `PresensiSyncService.kirimPengajuanIzin`.
    // Re-load authoritative server state instead of writing a monolithic blob.
    return load();
  }
}
