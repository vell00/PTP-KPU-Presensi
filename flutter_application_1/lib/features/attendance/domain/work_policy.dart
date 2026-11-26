import 'dart:math';
import '../../../core/utils/date_time.dart';

class WorkHoursConfig {
  final int startHour;
  final int startMinute;
  final int endHourMonThu;
  final int endMinuteMonThu;
  final int endHourFri;
  final int endMinuteFri;
  final int toleranceMinutes;

  const WorkHoursConfig({
    this.startHour = 8,
    this.startMinute = 0,
    this.endHourMonThu = 16,
    this.endMinuteMonThu = 0,
    this.endHourFri = 16,
    this.endMinuteFri = 30,
    this.toleranceMinutes = 0,
  });

  factory WorkHoursConfig.fromJson(Map<String, dynamic>? j) {
    if (j == null) return const WorkHoursConfig();
    return WorkHoursConfig(
      startHour: (j['startHour'] as num?)?.toInt() ?? 8,
      startMinute: (j['startMinute'] as num?)?.toInt() ?? 0,
      endHourMonThu: (j['endHourMonThu'] as num?)?.toInt() ?? 16,
      endMinuteMonThu: (j['endMinuteMonThu'] as num?)?.toInt() ?? 0,
      endHourFri: (j['endHourFri'] as num?)?.toInt() ?? 16,
      endMinuteFri: (j['endMinuteFri'] as num?)?.toInt() ?? 30,
      toleranceMinutes: (j['toleranceMinutes'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'startHour': startHour,
    'startMinute': startMinute,
    'endHourMonThu': endHourMonThu,
    'endMinuteMonThu': endMinuteMonThu,
    'endHourFri': endHourFri,
    'endMinuteFri': endMinuteFri,
    'toleranceMinutes': toleranceMinutes,
  };
}

class WorkPolicy {
  /// Default schedule check (backwards-compatible helper).
  static bool isWfh(DateTime day, bool eligible) =>
      (day.weekday == DateTime.tuesday || day.weekday == DateTime.friday) &&
      eligible;

  /// Policy-driven check matching Admin Portal `settings/general.wfhSchedule`.
  static bool isWfhForSchedule(
    DateTime day,
    String? subdepartmentSlug,
    Map<String, List<String>> wfhSchedule,
  ) {
    if (day.weekday > 5 || subdepartmentSlug == null) return false;
    final allowedDays = wfhSchedule[subdepartmentSlug];
    if (allowedDays == null || allowedDays.isEmpty) return false;
    return allowedDays.contains(witaDayName(day));
  }

  static DateTime end(
    DateTime day, {
    WorkHoursConfig config = const WorkHoursConfig(),
  }) => DateTime(
    day.year,
    day.month,
    day.day,
    day.weekday == DateTime.friday ? config.endHourFri : config.endHourMonThu,
    day.weekday == DateTime.friday
        ? config.endMinuteFri
        : config.endMinuteMonThu,
  );

  static int lateMinutes(
    DateTime entered, {
    WorkHoursConfig config = const WorkHoursConfig(),
  }) {
    final cutoff =
        config.startHour * 60 + config.startMinute + config.toleranceMinutes;
    final actual = entered.hour * 60 + entered.minute;
    return max(0, actual - cutoff);
  }

  static int earlyLeaveMinutes(
    DateTime exited, {
    WorkHoursConfig config = const WorkHoursConfig(),
  }) {
    final target = end(exited, config: config);
    final diff = target.difference(exited).inMinutes;
    return max(0, diff);
  }

  /// Target effective working minutes per day (excluding 60m Mon-Thu / 90m Fri ISHOMA).
  static Duration targetDailyDuration(
    DateTime day, {
    WorkHoursConfig config = const WorkHoursConfig(),
  }) {
    final start = DateTime(
      day.year,
      day.month,
      day.day,
      config.startHour,
      config.startMinute,
    );
    return worked(start, end(day, config: config));
  }

  /// Effective worked duration excluding ISHOMA break (12:00–13:00 Mon–Thu, 11:30–13:00 Fri).
  static Duration worked(DateTime start, DateTime end) {
    if (end.isBefore(start)) return Duration.zero;
    final pauseStart = DateTime(
      start.year,
      start.month,
      start.day,
      start.weekday == DateTime.friday ? 11 : 12,
      start.weekday == DateTime.friday ? 30 : 0,
    );
    final pauseEnd = DateTime(start.year, start.month, start.day, 13);
    final overlap = max(
      0,
      min(end.millisecondsSinceEpoch, pauseEnd.millisecondsSinceEpoch) -
          max(start.millisecondsSinceEpoch, pauseStart.millisecondsSinceEpoch),
    );
    return Duration(
      milliseconds: end.difference(start).inMilliseconds - overlap.toInt(),
    );
  }
}
