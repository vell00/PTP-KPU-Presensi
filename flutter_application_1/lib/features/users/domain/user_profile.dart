import 'organization.dart';

class UserProfile {
  final String uid, nip, name, departmentId;
  final String? subdepartmentId;
  final String? password;
  final String? pin;
  final JobRole role;
  final bool isAdmin, active, mustChangePassword, mustCreatePin;
  const UserProfile({
    required this.uid,
    required this.nip,
    required this.name,
    required this.role,
    required this.departmentId,
    this.subdepartmentId,
    this.password,
    this.pin,
    this.isAdmin = false,
    this.active = true,
    this.mustChangePassword = true,
    this.mustCreatePin = false,
  });
  factory UserProfile.fromJson(Map<String, dynamic> data) {
    final deptId = data['departmentId'] ?? 'keuangan_umum_logistik';
    final subdeptId = data['subdepartmentId'];
    final pinVal = data['pin']?.toString();
    final hasPin = pinVal != null && pinVal.length == 6;
    return UserProfile(
      uid: data['uid'] ?? '',
      nip: data['nip'] ?? '',
      name: data['name'] ?? data['nip'] ?? 'Pegawai',
      password: data['password'],
      pin: pinVal,
      role: data['role'] != null ? JobRole.parse(data['role']) : JobRole.staff,
      departmentId: deptId,
      subdepartmentId: subdeptId,
      isAdmin: data['isAdmin'] == true,
      active: data['active'] == true,
      mustChangePassword: data['mustChangePassword'] == true,
      mustCreatePin: !hasPin,
    );
  }
  Department get department {
    try {
      return departments.firstWhere((d) => d.id == departmentId);
    } catch (_) {
      return departments.first;
    }
  }
  String get unitName {
    if (subdepartmentId == null || subdepartmentId!.isEmpty) {
      return department.name;
    }
    try {
      return department.subdepartments
          .firstWhere((s) => s.id == subdepartmentId)
          .name;
    } catch (_) {
      for (final d in departments) {
        for (final s in d.subdepartments) {
          if (s.id == subdepartmentId) return s.name;
        }
      }
      return subdepartmentId!;
    }
  }
  Map<String, dynamic> assignment() => {
    'uid': uid,
    'nip': nip,
    'name': name,
    'role': role.id,
    'departmentId': departmentId,
    'subdepartmentId': subdepartmentId,
  };
}
