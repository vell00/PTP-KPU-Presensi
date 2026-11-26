import '../../../core/utils/date_time.dart';
import 'work_policy.dart';

class Attendance {
  final String name, division, mode;
  final DateTime entered;
  DateTime? exited;
  final int? lateMinutes;
  final int? earlyLeaveMinutes;
  final int? distanceMeters;
  final String? selfiePath;
  final String? selfieUrl;
  final String? authMethod;
  final String? statusOverride;

  Attendance(
    this.name,
    this.division,
    this.mode,
    this.entered, [
    this.exited,
    this.lateMinutes,
    this.earlyLeaveMinutes,
    this.distanceMeters,
    this.selfiePath,
    this.selfieUrl,
    this.authMethod,
    this.statusOverride,
  ]);

  bool get isMissedCheckOut =>
      exited == null && dayKey(entered) != dayKey(witaNow());

  int get computedLateMinutes =>
      lateMinutes ?? WorkPolicy.lateMinutes(entered);

  int get computedEarlyLeaveMinutes =>
      earlyLeaveMinutes ??
      (exited != null ? WorkPolicy.earlyLeaveMinutes(exited!) : 0);

  String get status {
    if (isMissedCheckOut) return 'Tidak Absen Pulang';
    if (statusOverride != null &&
        statusOverride!.isNotEmpty &&
        statusOverride != 'Hadir') {
      return statusOverride!;
    }
    final late = computedLateMinutes > 0;
    final early = exited != null && computedEarlyLeaveMinutes > 0;
    if (late && early) return 'Terlambat & Pulang Cepat';
    if (late) return 'Terlambat';
    if (early) return 'Pulang Cepat';
    return 'Tepat Waktu';
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'division': division,
    'mode': mode,
    'entered': witaIsoString(entered),
    'exited': exited == null ? null : witaIsoString(exited!),
    if (lateMinutes != null) 'lateMinutes': lateMinutes,
    if (earlyLeaveMinutes != null) 'earlyLeaveMinutes': earlyLeaveMinutes,
    if (distanceMeters != null) 'distanceMeters': distanceMeters,
    if (selfiePath != null) 'selfiePath': selfiePath,
    if (selfieUrl != null) 'selfieUrl': selfieUrl,
    if (authMethod != null) 'authMethod': authMethod,
    if (statusOverride != null) 'status': statusOverride,
  };

  factory Attendance.fromJson(Map<String, dynamic> j) => Attendance(
    j['name']?.toString() ?? j['nama']?.toString() ?? 'Pegawai',
    j['division']?.toString() ?? j['unit']?.toString() ?? 'Sekretariat KPU',
    j['mode']?.toString() ?? 'WFO',
    parseWitaIso((j['entered'] ?? j['masukIso'] ?? j['masuk']).toString()),
    (j['exited'] ?? j['keluarIso'] ?? j['keluar']) == null
        ? null
        : parseWitaIso((j['exited'] ?? j['keluarIso'] ?? j['keluar']).toString()),
    (j['lateMinutes'] as num?)?.toInt(),
    (j['earlyLeaveMinutes'] as num?)?.toInt(),
    (j['distanceMeters'] as num?)?.toInt(),
    j['selfiePath']?.toString(),
    j['selfieUrl']?.toString() ?? j['checkInSelfieUrl']?.toString(),
    j['authMethod']?.toString(),
    j['status']?.toString(),
  );
}
