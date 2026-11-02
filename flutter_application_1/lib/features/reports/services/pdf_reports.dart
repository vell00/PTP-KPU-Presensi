import 'package:flutter_application_1/core/config/app_constants.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../../core/utils/currency.dart';
import '../../allowance/domain/tukin_calculator.dart';

Future<void> exportAttendanceReport(AppStore store, DateTime period) async {
  final rows = store.records
      .where(
        (r) => r.entered.year == period.year && r.entered.month == period.month,
      )
      .toList();
  if (rows.isEmpty) {
    throw StateError(
      'Belum ada catatan presensi pada bulan ini. Data contoh tidak diekspor.',
    );
  }
  final doc = pw.Document();
  doc.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      build: (context) => [
        pw.Header(level: 0, text: 'KPU SULAWESI UTARA'),
        pw.Text(
          'REKAP PRESENSI DEMO - ${months[period.month - 1]} ${period.year}',
        ),
        pw.SizedBox(height: 20),
        pw.TableHelper.fromTextArray(
          headers: ['Nama', 'Tanggal', 'Pola', 'Masuk', 'Keluar', 'Status'],
          data: rows
              .map(
                (r) => [
                  r.name,
                  dayKey(r.entered),
                  r.mode,
                  clockText(r.entered),
                  clockText(r.exited),
                  r.status,
                ],
              )
              .toList(),
        ),
        pw.SizedBox(height: 20),
        pw.Text(
          'Data prototipe pengujian. Bukti presensi belum diverifikasi server. Semua waktu WITA.',
        ),
      ],
    ),
  );
  try {
    await Printing.layoutPdf(
      onLayout: (_) => doc.save(),
      name: 'rekap-${period.year}-${period.month}.pdf',
    );
  } catch (e) {
    throw StateError('Laporan belum dapat dicetak: $e');
  }
}

Future<void> exportAllowanceReport(
  DateTime period,
  double base,
  double deduction,
  double performance,
) async {
  final doc = pw.Document();
  doc.addPage(
    pw.Page(
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Header(text: 'SIMULASI TUKIN - KPU SULUT'),
          pw.Text(
            '${months[period.month - 1]} ${period.year} | Bukan slip pembayaran',
          ),
          pw.SizedBox(height: 24),
          pw.Text(
            'Dasar: Rp ${money(base)}\nPotongan kehadiran: $deduction%\nCapaian prestasi: $performance%\nEstimasi: Rp ${money(tukinEstimate(base, deduction, performance))}',
          ),
          pw.SizedBox(height: 24),
          pw.Text(
            'Bobot: kehadiran 40%, prestasi 60%. Parameter input manual. Perlu verifikasi pengelola kepegawaian terhadap Kepsekjen KPU 326/2022 dan perubahan 1090/2025.',
          ),
        ],
      ),
    ),
  );
  try {
    await Printing.layoutPdf(
      onLayout: (_) => doc.save(),
      name: 'simulasi-tukin.pdf',
    );
  } catch (e) {
    throw StateError('Gagal mencetak: $e');
  }
}
