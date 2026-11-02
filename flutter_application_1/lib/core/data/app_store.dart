import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../features/attendance/domain/attendance.dart';
import '../../features/leave/domain/leave_request.dart';
import '../utils/date_time.dart';
import 'package:flutter/foundation.dart';
import 'workspace_repository.dart';
import '../../features/users/domain/user_profile.dart';

class AppStore extends ChangeNotifier {
  final SharedPreferences prefs;
  UserProfile? currentUser;
  bool get canAccessAdmin => !isRemote || currentUser?.isAdmin == true;
  WorkspaceRepository? _repository;
  int _revision = 0;
  bool _saving = false;
  Map<String, dynamic>? _committed;
  void Function(String)? onError;
  bool get isRemote => _repository != null;

  static Future<AppStore> connect(
    SharedPreferences prefs,
    WorkspaceRepository repository,
  ) async {
    final store = AppStore(prefs);
    store._repository = repository;
    await store.refresh();
    return store;
  }

  Map<String, dynamic> snapshot() => {
    'records': records.map((r) => r.toJson()).toList(),
    'requests': requests.map((r) => r.toJson()).toList(),
    'employees': employees,
    'fridayWfh': fridayWfh,
    'latitude': latitude,
    'longitude': longitude,
    'radius': radius,
  };
  void _apply(Map<String, dynamic> data) {
    records = (data['records'] as List)
        .map((e) => Attendance.fromJson(e))
        .toList();
    requests = (data['requests'] as List)
        .map((e) => LeaveRequest.fromJson(e))
        .toList();
    employees = (data['employees'] as List)
        .map((e) => Map<String, String>.from(e))
        .toList();
    fridayWfh = data['fridayWfh'];
    latitude = (data['latitude'] as num?)?.toDouble();
    longitude = (data['longitude'] as num?)?.toDouble();
    radius = (data['radius'] as num).toDouble();
  }

  void _accept(Map<String, dynamic> result) {
    if ((result['revision'] as int) < _revision) return;
    _revision = result['revision'];
    _committed = jsonDecode(jsonEncode(result['data']));
    _apply(_committed!);
    notifyListeners();
  }

  Future<void> refresh() async {
    if (_saving) throw StorageException('Penyimpanan masih berjalan.');
    if (_repository != null) _accept(await _repository!.load());
  }

  Future<bool> save() async {
    if (_saving) {
      onError?.call(
        'Penyimpanan sebelumnya masih berjalan. Ulangi perubahan setelah selesai.',
      );
      return false;
    }
    if (_repository == null) {
      await _saveLocal();
      notifyListeners();
      return true;
    }
    _saving = true;
    // Copy before awaiting network so subsequent UI edits cannot change payload.
    final pending = jsonDecode(jsonEncode(snapshot())) as Map<String, dynamic>;
    try {
      _accept(await _repository!.save(_revision, pending));
      return true;
    } catch (e) {
      if (_committed != null) _apply(_committed!);
      // Reconcile conflicts and ambiguous timeouts without resubmitting a write.
      try {
        _accept(await _repository!.load());
      } catch (_) {
        /* Keep last confirmed data. */
      }
      notifyListeners();
      onError?.call(
        '$e Perubahan belum dikonfirmasi. Periksa data terbaru sebelum mencoba lagi.',
      );
      return false;
    } finally {
      _saving = false;
    }
  }

  List<Attendance> records = [];
  List<LeaveRequest> requests = [];
  List<Map<String, String>> employees = [];
  bool fridayWfh = true;
  double? latitude, longitude;
  double radius = 100;
  AppStore(this.prefs) {
    records = (jsonDecode(prefs.getString('records') ?? '[]') as List)
        .map((e) => Attendance.fromJson(e))
        .toList();
    employees = (jsonDecode(prefs.getString('employees') ?? '[]') as List)
        .map((e) => Map<String, String>.from(e))
        .toList();
    final saved = prefs.getString('requests');
    requests = saved == null
        ? [
            LeaveRequest(
              'Michelle W. Runtuwene',
              'Cuti tahunan',
              'Keperluan keluarga',
              dayKey(witaNow()),
            ),
            LeaveRequest(
              'Rizky A. Mamonto',
              'Izin',
              'Keperluan pribadi',
              dayKey(witaNow()),
            ),
          ]
        : (jsonDecode(saved) as List)
              .map((e) => LeaveRequest.fromJson(e))
              .toList();
    fridayWfh = prefs.getBool('fridayWfh') ?? true;
    latitude = prefs.getDouble('latitude');
    longitude = prefs.getDouble('longitude');
    radius = prefs.getDouble('radius') ?? 100;
  }
  Future<void> _saveLocal() async {
    await prefs.setString(
      'records',
      jsonEncode(records.map((e) => e.toJson()).toList()),
    );
    await prefs.setString(
      'requests',
      jsonEncode(requests.map((e) => e.toJson()).toList()),
    );
    await prefs.setString('employees', jsonEncode(employees));
    await prefs.setBool('fridayWfh', fridayWfh);
    if (latitude != null) await prefs.setDouble('latitude', latitude!);
    if (longitude != null) await prefs.setDouble('longitude', longitude!);
    await prefs.setDouble('radius', radius);
  }
}
