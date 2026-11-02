class Attendance {
  final String name, division, mode;
  final DateTime entered;
  DateTime? exited;
  Attendance(this.name, this.division, this.mode, this.entered, [this.exited]);
  String get status =>
      entered.hour > 8 || (entered.hour == 8 && entered.minute > 0)
      ? 'Terlambat'
      : 'Tepat waktu';
  Map<String, dynamic> toJson() => {
    'name': name,
    'division': division,
    'mode': mode,
    'entered': entered.toIso8601String(),
    'exited': exited?.toIso8601String(),
  };
  factory Attendance.fromJson(Map<String, dynamic> j) => Attendance(
    j['name'],
    j['division'],
    j['mode'],
    DateTime.parse(j['entered']),
    j['exited'] == null ? null : DateTime.parse(j['exited']),
  );
}
