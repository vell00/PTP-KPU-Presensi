import '../../../core/config/app_constants.dart';
import '../domain/attendance.dart';

List<Attendance> demoRecords(DateTime now) => List.generate(
  7,
  (i) => Attendance(
    demoNames[i],
    divisions[i % 4],
    i == 3 ? 'WFH' : 'WFO',
    DateTime(
      now.year,
      now.month,
      now.day,
      i == 2 ? 8 : 7,
      i == 2 ? 12 : 42 + i * 2,
    ),
  ),
);
