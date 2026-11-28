import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import 'package:flutter_application_1/features/attendance/domain/attendance.dart';
import 'package:flutter_application_1/features/attendance/domain/work_policy.dart';

void main() {
  test('WFH schedule matches policy per subdepartment and weekdays', () {
    final tuesday = DateTime(2026, 9, 22);
    final thursday = DateTime(2026, 9, 24);
    final friday = DateTime(2026, 9, 25);
    final saturday = DateTime(2026, 9, 26);

    expect(WorkPolicy.isWfh(friday, true), isTrue);
    expect(WorkPolicy.isWfh(tuesday, true), isTrue);
    expect(WorkPolicy.isWfh(friday, false), isFalse);
    expect(WorkPolicy.isWfh(thursday, true), isFalse);
    expect(WorkPolicy.end(friday).minute, 30);

    const schedule = {
      'keuangan': ['Selasa', 'Jumat'],
      'hukum': ['Rabu'],
    };
    expect(WorkPolicy.isWfhForSchedule(tuesday, 'keuangan', schedule), isTrue);
    expect(WorkPolicy.isWfhForSchedule(thursday, 'keuangan', schedule), isFalse);
    expect(WorkPolicy.isWfhForSchedule(saturday, 'keuangan', schedule), isFalse);
    expect(WorkPolicy.isWfhForSchedule(friday, 'hukum', schedule), isFalse);
    expect(WorkPolicy.isWfhForSchedule(friday, null, schedule), isFalse);
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
    expect(
      WorkPolicy.targetDailyDuration(DateTime(2026, 9, 24)),
      const Duration(hours: 7),
    );
    expect(
      WorkPolicy.targetDailyDuration(DateTime(2026, 9, 25)),
      const Duration(hours: 7),
    );
  });

  test('Late and early leave minutes respect work hours configuration', () {
    const config = WorkHoursConfig(toleranceMinutes: 5);
    expect(
      WorkPolicy.lateMinutes(DateTime(2026, 9, 24, 8, 5), config: config),
      0,
    );
    expect(
      WorkPolicy.lateMinutes(DateTime(2026, 9, 24, 8, 20), config: config),
      15,
    );
    expect(
      WorkPolicy.earlyLeaveMinutes(
        DateTime(2026, 9, 24, 15, 30),
        config: config,
      ),
      30,
    );
    expect(
      WorkPolicy.earlyLeaveMinutes(
        DateTime(2026, 9, 25, 16, 0),
        config: config,
      ),
      30,
    );
  });

  test('WITA ISO parsing preserves wall-clock across offsets and legacy strings', () {
    final fromUtc = parseWitaIso('2026-11-26T00:15:00.000Z');
    expect(fromUtc.year, 2026);
    expect(fromUtc.month, 11);
    expect(fromUtc.day, 26);
    expect(fromUtc.hour, 8);
    expect(fromUtc.minute, 15);

    final fromWita = parseWitaIso('2026-11-26T08:15:00+08:00');
    expect(fromWita.hour, 8);
    expect(fromWita.minute, 15);

    final fromLegacy = parseWitaIso('2026-11-26T08:15:00.000');
    expect(fromLegacy.hour, 8);
    expect(fromLegacy.minute, 15);

    expect(
      witaIsoString(DateTime(2026, 11, 26, 8, 15, 0)),
      '2026-11-26T08:15:00+08:00',
    );
  });

  test('Attendance survives serialization and computes status accurately', () {
    final onTime = Attendance(
      'Budi Santoso',
      'Keuangan',
      'WFO',
      DateTime(2026, 9, 24, 8, 0),
      DateTime(2026, 9, 24, 16, 0),
    );
    final restored = Attendance.fromJson(onTime.toJson());
    expect(restored.exited, onTime.exited);
    expect(restored.status, 'Tepat Waktu');

    final lateAndEarly = Attendance(
      'Budi Santoso',
      'Keuangan',
      'WFO',
      DateTime(2026, 9, 24, 8, 25),
      DateTime(2026, 9, 24, 15, 30),
    );
    expect(lateAndEarly.status, 'Terlambat & Pulang Cepat');

    final missed = Attendance(
      'Budi Santoso',
      'Keuangan',
      'WFO',
      DateTime(2025, 1, 10, 8, 0),
      null,
    );
    expect(missed.isMissedCheckOut, isTrue);
    expect(missed.status, 'Tidak Absen Pulang');
  });
}
