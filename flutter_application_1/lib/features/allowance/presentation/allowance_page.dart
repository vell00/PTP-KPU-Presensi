import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'package:flutter_application_1/core/ui/month_picker.dart';
import 'package:flutter_application_1/features/reports/services/pdf_reports.dart';
import '../domain/tukin_calculator.dart';
import '../../../core/utils/currency.dart';

class AllowancePage extends StatefulWidget {
  final AppStore store;
  const AllowancePage({super.key, required this.store});
  @override
  State<AllowancePage> createState() => _AllowancePageState();
}

class _AllowancePageState extends State<AllowancePage> {
  AppStore get store => widget.store;
  DateTime period = DateTime(witaNow().year, witaNow().month);
  Widget get dateButton => MonthPicker(
    value: period,
    onChanged: (value) => setState(() => period = value),
  );
  double base = 5000000, deduction = 0, performance = 100;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      heading(
        'Tunjangan Kinerja',
        'Rekap dan simulasi tunjangan berdasarkan kehadiran serta prestasi kerja.',
        action: dateButton,
      ),
      card(
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            pill('ESTIMASI • BUKAN SLIP PEMBAYARAN', const Color(0xFFC5923F)),
            const SizedBox(height: 18),
            text('Dasar perhitungan KPU', size: 18, weight: FontWeight.w700),
            const SizedBox(height: 10),
            text(
              'Komponen kehadiran 40% + prestasi kerja 60%. Parameter potongan dan kelas jabatan perlu diverifikasi oleh pengelola kepegawaian.',
              color: muted,
            ),
            const SizedBox(height: 20),
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                SizedBox(
                  width: 240,
                  child: TextFormField(
                    initialValue: '5000000',
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Tukin dasar (Rp) — contoh',
                    ),
                    onChanged: (v) => setState(
                      () => base = double.tryParse(v)?.clamp(0, 100000000) ?? 0,
                    ),
                  ),
                ),
                SizedBox(
                  width: 220,
                  child: TextFormField(
                    initialValue: '0',
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Potongan kehadiran (%)',
                    ),
                    onChanged: (v) => setState(
                      () => deduction = double.tryParse(v)?.clamp(0, 100) ?? 0,
                    ),
                  ),
                ),
                SizedBox(
                  width: 220,
                  child: TextFormField(
                    initialValue: '100',
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Capaian prestasi (%)',
                    ),
                    onChanged: (v) => setState(
                      () =>
                          performance = double.tryParse(v)?.clamp(0, 100) ?? 0,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            text('Estimasi diterima', color: muted),
            const SizedBox(height: 8),
            text(
              'Rp ${money(tukinEstimate(base, deduction, performance))}',
              size: 32,
              color: teal,
              weight: FontWeight.w700,
            ),
            const SizedBox(height: 16),
            text(
              'Kehadiran: Rp ${money(base * .4 * (1 - deduction / 100))}    •    Prestasi: Rp ${money(base * .6 * performance / 100)}',
              size: 12,
            ),
            const Divider(height: 36),
            const SelectableText(
              'Referensi: Kepsekjen KPU 326/2022, diubah dengan 1090/2025.\nhttps://jdih.kpu.go.id/kepsekjen/download/365',
              style: TextStyle(color: muted, fontSize: 12),
            ),
            const SizedBox(height: 12),
            text(
              'Jadwal aplikasi mengikuti permintaan 08.00 WITA. Dokumen juknis menggunakan acuan waktu berbeda; potongan tidak diterapkan otomatis. Pengecualian cuti, penggantian keterlambatan, batas potongan dan status pegawai perlu ditelaah sebelum pembayaran.',
              size: 12,
              color: muted,
            ),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: () => runUiAction(
                context,
                () =>
                    exportAllowanceReport(period, base, deduction, performance),
              ),
              icon: const Icon(Icons.print_outlined, size: 18),
              label: const Text('Cetak simulasi tukin'),
            ),
          ],
        ),
      ),
    ],
  );
}
