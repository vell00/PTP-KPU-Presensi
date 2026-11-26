import 'organization.dart';

class UserProfile {
  final String uid, nip, name, departmentId;
  final String? subdepartmentId;
  final String? positionLabel;
  final JobRole role;
  final bool isAdmin, active, mustChangePassword, hasPin;

  const UserProfile({
    required this.uid,
    required this.nip,
    required this.name,
    required this.role,
    required this.departmentId,
    this.subdepartmentId,
    this.positionLabel,
    this.isAdmin = false,
    this.active = true,
    this.mustChangePassword = true,
    this.hasPin = false,
  });

  bool get mustCreatePin => !hasPin;

  factory UserProfile.fromJson(Map<String, dynamic> data) {
    final deptId = data['departmentId']?.toString() ?? 'keuangan_umum_logistik';
    final subdeptRaw = data['subdepartmentId']?.toString();
    final legacyPin = data['pin']?.toString();
    final hasPinVal =
        data['hasPin'] == true || (legacyPin != null && legacyPin.length == 6);

    return UserProfile(
      uid: data['uid']?.toString() ?? '',
      nip: data['nip']?.toString() ?? '',
      name: data['name']?.toString() ?? data['nip']?.toString() ?? 'Pegawai',
      role: data['role'] != null
          ? JobRole.parse(data['role'].toString())
          : JobRole.staff,
      departmentId: deptId,
      subdepartmentId: (subdeptRaw != null && subdeptRaw.isNotEmpty)
          ? subdeptRaw
          : null,
      positionLabel: data['positionLabel']?.toString(),
      isAdmin: data['isAdmin'] == true,
      active: data['active'] == true,
      mustChangePassword: data['mustChangePassword'] == true,
      hasPin: hasPinVal,
    );
  }

  Department get department {
    for (final d in departments) {
      if (d.id == departmentId) return d;
    }
    return departments.first;
  }

  /// Resolves canonical subdepartment slug (e.g. 'keuangan') even for legacy docs
  /// that stored a human-readable unit string in `subdepartmentId`.
  String? get subdepartmentSlug {
    final raw = subdepartmentId;
    if (raw == null || raw.isEmpty) return null;
    for (final d in departments) {
      for (final s in d.subdepartments) {
        if (s.id == raw) return s.id;
      }
    }
    final lower = raw.toLowerCase();
    if (lower.contains('keuangan')) return 'keuangan';
    if (lower.contains('umum') || lower.contains('logistik')) return 'umum_logistik';
    if (lower.contains('teknis')) return 'teknis_pemilu';
    if (lower.contains('hukum')) return 'hukum';
    if (lower.contains('perencanaan') || lower.contains('data')) return 'perencanaan_data';
    if (lower.contains('partisipasi') || lower.contains('humas') || lower.contains('sdm')) {
      return 'partisipasi_humas_sdm';
    }
    return null;
  }

  String get unitName {
    if (positionLabel != null && positionLabel!.trim().isNotEmpty) {
      return positionLabel!.trim();
    }
    if (subdepartmentId != null && subdepartmentId!.isNotEmpty) {
      for (final d in departments) {
        for (final s in d.subdepartments) {
          if (s.id == subdepartmentId) return s.name;
        }
      }
      return subdepartmentId!;
    }
    return department.name;
  }

  UserProfile copyWith({
    bool? hasPin,
    bool? mustChangePassword,
    String? name,
  }) => UserProfile(
    uid: uid,
    nip: nip,
    name: name ?? this.name,
    role: role,
    departmentId: departmentId,
    subdepartmentId: subdepartmentId,
    positionLabel: positionLabel,
    isAdmin: isAdmin,
    active: active,
    mustChangePassword: mustChangePassword ?? this.mustChangePassword,
    hasPin: hasPin ?? this.hasPin,
  );

  Map<String, dynamic> assignment() => {
    'uid': uid,
    'nip': nip,
    'name': name,
    'role': role.id,
    'departmentId': departmentId,
    'subdepartmentId': subdepartmentId,
    if (positionLabel != null) 'positionLabel': positionLabel,
  };
}
