import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/config/app_constants.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'package:flutter_application_1/features/reports/services/pdf_reports.dart';
import '../domain/attendance.dart';
import '../data/demo_attendance.dart';

class AttendanceTable extends StatefulWidget {
  final AppStore store;
  final DateTime period;
  final bool preview;
  final VoidCallback? onViewAll;
  const AttendanceTable({
    super.key,
    required this.store,
    required this.period,
    this.preview = false,
    this.onViewAll,
  });
  @override
  State<AttendanceTable> createState() => _AttendanceTableState();
}

class _AttendanceTableState extends State<AttendanceTable> {
  AppStore get store => widget.store;
  String query = '', division = 'Semua subdivisi', status = 'Semua status';
  DateTime get period => widget.period;
  bool get preview => widget.preview;
  List<Attendance> get allRecords => [
    ...store.records,
    ...demoRecords(witaNow()),
  ];
  List<Attendance> get filtered => allRecords
      .where(
        (r) =>
            r.entered.year == period.year &&
            r.entered.month == period.month &&
            (division == 'Semua subdivisi' || r.division == division) &&
            (status == 'Semua status' ||
                r.status == status ||
                r.mode == status) &&
            r.name.toLowerCase().contains(query.toLowerCase()),
      )
      .toList();
  @override
  Widget build(BuildContext context) {
    final rows = filtered;
    return card(
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    text(
                      preview ? 'Kehadiran Hari Ini' : 'Daftar Kehadiran',
                      size: 15,
                      weight: FontWeight.w700,
                    ),
                    const SizedBox(height: 5),
                    text(
                      preview
                          ? 'Aktivitas presensi terbaru pegawai'
                          : '${months[period.month - 1]} ${period.year} • Waktu Indonesia Tengah',
                      size: 11,
                      color: muted,
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: preview
                    ? widget.onViewAll
                    : () => runUiAction(
                        context,
                        () => exportAttendanceReport(store, period),
                      ),
                child: Row(
                  children: [
                    Text(
                      preview ? 'Lihat semua' : 'Ekspor PDF',
                      style: const TextStyle(fontSize: 11),
                    ),
                    const SizedBox(width: 7),
                    Icon(
                      preview
                          ? Icons.arrow_forward
                          : Icons.file_download_outlined,
                      size: 15,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              SizedBox(
                width: 240,
                child: TextField(
                  onChanged: (v) => setState(() => query = v),
                  decoration: const InputDecoration(
                    hintText: 'Cari nama pegawai...',
                    prefixIcon: Icon(Icons.search, size: 19),
                    isDense: true,
                  ),
                ),
              ),
              SizedBox(
                width: 220,
                child: DropdownButtonFormField<String>(
                  initialValue: division,
                  isExpanded: true,
                  style: const TextStyle(fontSize: 11, color: ink),
                  decoration: const InputDecoration(isDense: true),
                  items: ['Semua subdivisi', ...divisions]
                      .map(
                        (s) => DropdownMenuItem(
                          value: s,
                          child: Text(s, overflow: TextOverflow.ellipsis),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => division = v!),
                ),
              ),
              SizedBox(
                width: 155,
                child: DropdownButtonFormField<String>(
                  initialValue: status,
                  isExpanded: true,
                  style: const TextStyle(fontSize: 11, color: ink),
                  decoration: const InputDecoration(isDense: true),
                  items:
                      ['Semua status', 'Tepat waktu', 'Terlambat', 'WFO', 'WFH']
                          .map(
                            (s) => DropdownMenuItem(value: s, child: Text(s)),
                          )
                          .toList(),
                  onChanged: (v) => setState(() => status = v!),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          LayoutBuilder(
            builder: (context, c) => SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: ConstrainedBox(
                constraints: BoxConstraints(minWidth: c.maxWidth),
                child: DataTable(
                  horizontalMargin: 0,
                  columnSpacing: 24,
                  headingRowHeight: 40,
                  dataRowMinHeight: 66,
                  dataRowMaxHeight: 66,
                  headingTextStyle: const TextStyle(
                    fontSize: 10,
                    color: muted,
                    fontWeight: FontWeight.w500,
                  ),
                  dividerThickness: .5,
                  columns: const [
                    DataColumn(label: Text('PEGAWAI')),
                    DataColumn(label: Text('SUBDIVISI')),
                    DataColumn(label: Text('POLA KERJA')),
                    DataColumn(label: Text('MASUK')),
                    DataColumn(label: Text('KELUAR')),
                    DataColumn(label: Text('STATUS')),
                  ],
                  rows: (preview ? rows.take(4) : rows)
                      .map(
                        (r) => DataRow(
                          cells: [
                            DataCell(
                              Row(
                                children: [
                                  avatar(r.name),
                                  const SizedBox(width: 10),
                                  Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      text(
                                        r.name,
                                        size: 11,
                                        weight: FontWeight.w600,
                                      ),
                                      const SizedBox(height: 4),
                                      text(
                                        store.records.contains(r)
                                            ? 'Presensi prototipe • ${dayKey(r.entered)}'
                                            : 'Data contoh • ${dayKey(r.entered)}',
                                        size: 9,
                                        color: muted,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            DataCell(text(r.division, size: 10, color: muted)),
                            DataCell(
                              pill(
                                r.mode,
                                r.mode == 'WFO'
                                    ? teal
                                    : const Color(0xFF6B81B3),
                              ),
                            ),
                            DataCell(
                              text(
                                clockText(r.entered),
                                size: 11,
                                weight: FontWeight.w500,
                              ),
                            ),
                            DataCell(
                              text(clockText(r.exited), size: 11, color: muted),
                            ),
                            DataCell(
                              pill(
                                r.status,
                                r.status == 'Tepat waktu'
                                    ? teal
                                    : const Color(0xFFC5923F),
                                icon: r.status == 'Tepat waktu'
                                    ? Icons.check_circle_outline
                                    : Icons.schedule,
                              ),
                            ),
                          ],
                        ),
                      )
                      .toList(),
                ),
              ),
            ),
          ),
          if (rows.isEmpty)
            Padding(
              padding: const EdgeInsets.all(30),
              child: Center(
                child: text(
                  'Tidak ada presensi pada filter ini.',
                  color: muted,
                ),
              ),
            ),
          const SizedBox(height: 13),
          text(
            'Menampilkan ${preview ? rows.take(4).length : rows.length} dari ${rows.length} presensi',
            size: 10,
            color: muted,
          ),
        ],
      ),
    );
  }
}
