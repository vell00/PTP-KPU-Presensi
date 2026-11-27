import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../features/attendance/domain/attendance.dart';
import '../../features/attendance/domain/work_policy.dart';
import '../../features/leave/domain/leave_request.dart';
import '../../features/users/domain/user_profile.dart';
import '../utils/date_time.dart';
import 'workspace_repository.dart';

class AppStore extends ChangeNotifier {
  final SharedPreferences prefs;
  UserProfile? currentUser;
  WorkspaceRepository? _repository;
  int _revision = 0;
  bool _saving = false;
  Map<String, dynamic>? _committed;
  void Function(String)? onError;

  bool get isRemote => _repository != null;

  void setCurrentUser(UserProfile? user) {
    currentUser = user;
    notifyListeners();
  }

  List<Attendance> records = [];
  List<LeaveRequest> requests = [];
  bool fridayWfh = true;
  double? latitude, longitude;
  double radius = 100;
  Map<String, List<String>> wfhSchedule = {
    'keuangan': ['Selasa', 'Jumat'],
    'umum_logistik': ['Selasa', 'Jumat'],
    'teknis_pemilu': ['Selasa', 'Jumat'],
    'hukum': ['Selasa', 'Jumat'],
    'perencanaan_data': ['Selasa', 'Jumat'],
    'partisipasi_humas_sdm': ['Selasa', 'Jumat'],
  };
  WorkHoursConfig workHours = const WorkHoursConfig();
  List<Map<String, String>> holidays = [];

  static Future<AppStore> connect(
    SharedPreferences prefs,
    WorkspaceRepository repository,
  ) async {
    final store = AppStore(prefs);
    store._repository = repository;
    await store.refresh();
    return store;
  }

  bool isWfhForDay(DateTime day) {
    if (day.weekday > 5) return false;
    final slug = currentUser?.subdepartmentSlug;
    if (slug != null && wfhSchedule.containsKey(slug)) {
      return WorkPolicy.isWfhForSchedule(day, slug, wfhSchedule);
    }
    // Fallback when running offline demo without subdepartment slug
    return !isRemote && WorkPolicy.isWfh(day, fridayWfh);
  }

  List<String> get currentUserWfhDays {
    final slug = currentUser?.subdepartmentSlug;
    if (slug != null && wfhSchedule.containsKey(slug)) {
      return wfhSchedule[slug] ?? const [];
    }
    return const [];
  }

  String? holidayNameFor(DateTime day) {
    final key = dayKey(day);
    for (final h in holidays) {
      if (h['date'] == key) return h['name'] ?? 'Hari Libur Nasional';
    }
    return null;
  }

  Map<String, dynamic> snapshot() => {
    'records': records.map((r) => r.toJson()).toList(),
    'requests': requests.map((r) => r.toJson()).toList(),
    'fridayWfh': fridayWfh,
    'latitude': latitude,
    'longitude': longitude,
    'radius': radius,
    'wfhSchedule': wfhSchedule,
    'workHours': workHours.toJson(),
    'holidays': holidays,
  };

  void _apply(Map<String, dynamic> data) {
    records = ((data['records'] as List?) ?? const [])
        .map((e) => Attendance.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    requests = ((data['requests'] as List?) ?? const [])
        .map((e) => LeaveRequest.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    fridayWfh = data['fridayWfh'] != false;
    latitude = (data['latitude'] as num?)?.toDouble();
    longitude = (data['longitude'] as num?)?.toDouble();
    radius = (data['radius'] as num?)?.toDouble() ?? 100;

    final rawWfh = data['wfhSchedule'];
    if (rawWfh is Map) {
      final parsed = <String, List<String>>{};
      rawWfh.forEach((k, v) {
        if (v is List) {
          parsed[k.toString()] = v.map((item) => item.toString()).toList();
        }
      });
      if (parsed.isNotEmpty) wfhSchedule = parsed;
    }

    if (data['workHours'] is Map) {
      workHours = WorkHoursConfig.fromJson(
        Map<String, dynamic>.from(data['workHours'] as Map),
      );
    }

    if (data['holidays'] is List) {
      holidays = (data['holidays'] as List)
          .whereType<Map>()
          .map(
            (m) => {
              'date': m['date']?.toString() ?? '',
              'name': m['name']?.toString() ?? 'Hari Libur',
            },
          )
          .where((m) => m['date']!.isNotEmpty)
          .toList();
    }
  }

  void _accept(Map<String, dynamic> result) {
    final nextRev = (result['revision'] as int?) ?? 0;
    if (nextRev < _revision) return;
    _revision = nextRev;
    _committed = jsonDecode(jsonEncode(result['data'])) as Map<String, dynamic>;
    _apply(_committed!);
    notifyListeners();
  }

  Future<void> refresh() async {
    if (_saving) throw const StorageException('Penyimpanan masih berjalan.');
    if (_repository != null) {
      _accept(await _repository!.load());
    }
  }

  Future<bool> save() async {
    if (_saving) {
      onError?.call(
        'Penyimpanan sebelumnya masih berjalan. Tunggu hingga selesai.',
      );
      return false;
    }
    if (_repository == null) {
      await _saveLocal();
      notifyListeners();
      return true;
    }
    _saving = true;
    final pending = jsonDecode(jsonEncode(snapshot())) as Map<String, dynamic>;
    try {
      _accept(await _repository!.save(_revision, pending));
      return true;
    } catch (e) {
      if (_committed != null) _apply(_committed!);
      try {
        _accept(await _repository!.load());
      } catch (_) {}
      notifyListeners();
      onError?.call(
        '$e Perubahan belum tersimpan ke server. Periksa koneksi Anda lalu coba lagi.',
      );
      return false;
    } finally {
      _saving = false;
    }
  }

  AppStore(this.prefs) {
    records = (jsonDecode(prefs.getString('records') ?? '[]') as List)
        .map((e) => Attendance.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    final savedReqs = prefs.getString('requests');
    requests = savedReqs == null
        ? []
        : (jsonDecode(savedReqs) as List)
              .map(
                (e) => LeaveRequest.fromJson(Map<String, dynamic>.from(e as Map)),
              )
              .toList();
    fridayWfh = prefs.getBool('fridayWfh') ?? true;
    latitude = prefs.getDouble('latitude') ?? 1.4748;
    longitude = prefs.getDouble('longitude') ?? 124.8421;
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
    await prefs.setBool('fridayWfh', fridayWfh);
    if (latitude != null) await prefs.setDouble('latitude', latitude!);
    if (longitude != null) await prefs.setDouble('longitude', longitude!);
    await prefs.setDouble('radius', radius);
  }
}
