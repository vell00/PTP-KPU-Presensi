import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'package:flutter_application_1/core/ui/month_picker.dart';
import 'package:flutter_application_1/features/reports/services/pdf_reports.dart';
import 'attendance_table.dart';

class AttendanceRecapPage extends StatefulWidget {
  final AppStore store;
  const AttendanceRecapPage({super.key, required this.store});
  @override
  State<AttendanceRecapPage> createState() => _AttendanceRecapPageState();
}

class _AttendanceRecapPageState extends State<AttendanceRecapPage> {
  AppStore get store => widget.store;
  DateTime period = DateTime(witaNow().year, witaNow().month);
  Widget get dateButton => MonthPicker(
    value: period,
    onChanged: (value) => setState(() => period = value),
  );
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      heading(
        'Rekap Kehadiran',
        'Pantau presensi, ketepatan waktu, dan jam kerja pegawai.',
        action: dateButton,
      ),
      AttendanceTable(store: store, period: period),
      const SizedBox(height: 16),
      Align(
        alignment: Alignment.centerRight,
        child: FilledButton.icon(
          onPressed: () =>
              runUiAction(context, () => exportAttendanceReport(store, period)),
          icon: const Icon(Icons.print_outlined, size: 18),
          label: const Text('Cetak laporan bulanan'),
        ),
      ),
    ],
  );
}
