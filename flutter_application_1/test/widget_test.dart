import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_application_1/app/presensi_app.dart';
import 'package:flutter_application_1/core/data/app_store.dart';

void main() {
  Future<void> launch(WidgetTester tester, Size size) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final originalError = FlutterError.onError;
    FlutterError.onError = (details) {
      debugPrint(details.toString());
      originalError?.call(details);
    };
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(
      PresensiApp(
        initialAdmin: true,
        store: AppStore(await SharedPreferences.getInstance()),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('Dashboard renders and navigation opens leave approvals', (
    tester,
  ) async {
    await launch(tester, const Size(1440, 1100));
    expect(find.text('Tren Kehadiran'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.tap(find.text('Izin & Cuti').first);
    await tester.pumpAndSettle();
    expect(find.text('Setujui pengajuan'), findsNWidgets(2));
    await tester.tap(find.text('Setujui pengajuan').first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Konfirmasi'));
    await tester.pumpAndSettle();
    expect(find.text('Disetujui'), findsOneWidget);
    expect(find.text('Setujui pengajuan'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });
  testWidgets('Dashboard fits a narrow Android viewport', (tester) async {
    await launch(tester, const Size(390, 844));
    expect(find.text('Tren Kehadiran'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Ganti tampilan demo'));
    await tester.pumpAndSettle();
    Navigator.of(tester.element(find.byType(Drawer))).pop();
    await tester.pumpAndSettle();
    expect(find.text('Halo, Andreas 👋'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
  });
  testWidgets('Feature pages retain working navigation after extraction', (
    tester,
  ) async {
    await launch(tester, const Size(1440, 1100));
    for (final entry in {
      'Manajemen Pengguna': 'Tambah pengguna',
      'Tunjangan Kinerja': 'Estimasi diterima',
      'Pengaturan': 'Simpan pengaturan',
    }.entries) {
      await tester.tap(find.text(entry.key).first);
      await tester.pumpAndSettle();
      expect(find.text(entry.value), findsOneWidget);
      expect(tester.takeException(), isNull);
    }
    await tester.ensureVisible(find.text('Buka tampilan pegawai'));
    await tester.tap(find.text('Buka tampilan pegawai'));
    await tester.pumpAndSettle();
    expect(find.text('Halo, Andreas 👋'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });
}
