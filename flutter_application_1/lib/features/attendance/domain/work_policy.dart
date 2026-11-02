import 'dart:math';

class WorkPolicy {
  static bool isWfh(DateTime day, bool eligible) =>
      day.weekday == DateTime.friday && eligible;
  static DateTime end(DateTime day) => DateTime(
    day.year,
    day.month,
    day.day,
    16,
    day.weekday == DateTime.friday ? 30 : 0,
  );
  // Default ISHOMA is an initial policy, pending institutional approval.
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
