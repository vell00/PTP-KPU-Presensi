import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'package:flutter_application_1/core/ui/month_picker.dart';
import '../../attendance/presentation/attendance_table.dart';
import 'dashboard_charts.dart';

class DashboardPage extends StatefulWidget {
  final AppStore store;
  final VoidCallback onViewAll;
  const DashboardPage({
    super.key,
    required this.store,
    required this.onViewAll,
  });
  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
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
        'Dashboard',
        'Selamat datang kembali, Admin 👋  Berikut ringkasan kehadiran hari ini.',
        action: dateButton,
      ),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 21),
        decoration: BoxDecoration(
          color: const Color(0xFFE9F3EF),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFD9E9E2)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .7),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.wb_sunny_outlined, color: teal, size: 25),
            ),
            const SizedBox(width: 17),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  text(
                    'Setiap kehadiran, bagian dari pengabdian.',
                    size: 16,
                    weight: FontWeight.w700,
                  ),
                  const SizedBox(height: 7),
                  text(
                    'Pantau kedisiplinan dan kelola kehadiran pegawai dalam satu tempat.',
                    size: 12,
                    color: const Color(0xFF618078),
                  ),
                ],
              ),
            ),
            if (MediaQuery.sizeOf(context).width > 800)
              pill('●  Hari kerja aktif', teal),
          ],
        ),
      ),
      const SizedBox(height: 22),
      LayoutBuilder(
        builder: (context, c) {
          final cards = [
            stat(
              'Total Pegawai',
              '48',
              'Pegawai terdaftar',
              Icons.people_outline,
              teal,
            ),
            stat(
              'Hadir Hari Ini',
              '42',
              '87,5% dari total pegawai',
              Icons.how_to_reg_outlined,
              teal,
            ),
            stat(
              'Izin & Cuti',
              '4',
              '2 pengajuan menunggu',
              Icons.event_available_outlined,
              const Color(0xFFD19B45),
            ),
            stat(
              'Belum Absen',
              '2',
              'Perlu tindak lanjut',
              Icons.person_off_outlined,
              const Color(0xFFD37765),
            ),
          ];
          return Wrap(
            spacing: 16,
            runSpacing: 16,
            children: cards
                .map(
                  (x) => SizedBox(
                    width:
                        (c.maxWidth - (c.maxWidth > 750 ? 48 : 16)) /
                        (c.maxWidth > 750 ? 4 : 2),
                    child: x,
                  ),
                )
                .toList(),
          );
        },
      ),
      const SizedBox(height: 22),
      LayoutBuilder(
        builder: (context, c) {
          final chart = chartCard();
          final summary = summaryCard();
          return c.maxWidth > 800
              ? Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(flex: 7, child: chart),
                    const SizedBox(width: 20),
                    Expanded(flex: 4, child: summary),
                  ],
                )
              : Column(children: [chart, const SizedBox(height: 18), summary]);
        },
      ),
      const SizedBox(height: 22),
      AttendanceTable(
        store: store,
        period: period,
        preview: true,
        onViewAll: widget.onViewAll,
      ),
      const SizedBox(height: 18),
      Row(
        children: [
          const Icon(Icons.info_outline, size: 13, color: muted),
          const SizedBox(width: 7),
          Expanded(
            child: text(
              'Ringkasan & grafik menampilkan data contoh. Catatan presensi disimpan sesuai mode penyimpanan aktif.',
              size: 10,
              color: muted,
            ),
          ),
          text(
            'HADIR  /  KPU SULUT',
            size: 9,
            color: muted,
            weight: FontWeight.w600,
          ),
        ],
      ),
    ],
  );
}
