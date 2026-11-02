import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/features/attendance/domain/attendance.dart';
import 'package:flutter_application_1/features/attendance/domain/work_policy.dart';
import 'package:flutter_application_1/features/allowance/domain/tukin_calculator.dart';

void main() {
  test('Friday WFH is only granted to eligible subdivision', () {
    final friday = DateTime(2026, 9, 25);
    expect(WorkPolicy.isWfh(friday, true), isTrue);
    expect(WorkPolicy.isWfh(friday, false), isFalse);
    expect(WorkPolicy.isWfh(DateTime(2026, 9, 24), true), isFalse);
    expect(WorkPolicy.end(friday).minute, 30);
  });
  test('Effective duration excludes only the overlapping ISHOMA interval', () {
    expect(
      WorkPolicy.worked(DateTime(2026, 9, 24, 8), DateTime(2026, 9, 24, 16)),
      const Duration(hours: 7),
    );
    expect(
      WorkPolicy.worked(
        DateTime(2026, 9, 25, 8),
        DateTime(2026, 9, 25, 16, 30),
      ),
      const Duration(hours: 7),
    );
    expect(
      WorkPolicy.worked(
        DateTime(2026, 9, 25, 12),
        DateTime(2026, 9, 25, 12, 30),
      ),
      Duration.zero,
    );
    expect(
      WorkPolicy.worked(DateTime(2026, 9, 25, 11), DateTime(2026, 9, 25, 12)),
      const Duration(minutes: 30),
    );
  });
  test('Tukin combines attendance and performance and clamps deductions', () {
    expect(tukinEstimate(5000000, 10, 100), 4800000);
    expect(tukinEstimate(5000000, 200, 100), 3000000);
    expect(tukinEstimate(5000000, 0, 0), 2000000);
  });
  test('Attendance survives serialization', () {
    final r = Attendance(
      'Nama',
      'SDM',
      'WFO',
      DateTime(2026, 9, 24, 8),
      DateTime(2026, 9, 24, 16),
    );
    final restored = Attendance.fromJson(r.toJson());
    expect(restored.exited, r.exited);
    expect(restored.status, 'Tepat waktu');
  });
}
