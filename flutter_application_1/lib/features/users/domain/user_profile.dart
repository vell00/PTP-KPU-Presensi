import 'organization.dart';

class UserProfile {
  final String uid, nip, name, departmentId;
  final String? subdepartmentId;
  final JobRole role;
  final bool isAdmin, active, mustChangePassword;
  const UserProfile({
    required this.uid,
    required this.nip,
    required this.name,
    required this.role,
    required this.departmentId,
    this.subdepartmentId,
    this.isAdmin = false,
    this.active = true,
    this.mustChangePassword = true,
  });
  factory UserProfile.fromJson(Map<String, dynamic> data) => UserProfile(
    uid: data['uid'],
    nip: data['nip'],
    name: data['name'],
    role: JobRole.parse(data['role']),
    departmentId: data['departmentId'],
    subdepartmentId: data['subdepartmentId'],
    isAdmin: data['isAdmin'] == true,
    active: data['active'] == true,
    mustChangePassword: data['mustChangePassword'] == true,
  );
  Department get department =>
      departments.firstWhere((d) => d.id == departmentId);
  String get unitName => subdepartmentId == null
      ? department.name
      : department.subdepartments
            .firstWhere((s) => s.id == subdepartmentId)
            .name;
  Map<String, dynamic> assignment() => {
    'uid': uid,
    'nip': nip,
    'name': name,
    'role': role.id,
    'departmentId': departmentId,
    'subdepartmentId': subdepartmentId,
  };
}
