import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_application_1/app/presensi_app.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'package:flutter_application_1/features/users/domain/organization.dart';
import 'package:flutter_application_1/features/users/domain/user_profile.dart';

void main() {
  Future<AppStore> launch(WidgetTester tester, Size size) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    SharedPreferences.setMockInitialValues({});
    final store = AppStore(await SharedPreferences.getInstance())
      ..currentUser = const UserProfile(
        uid: 'nip_199001012020011001',
        nip: '199001012020011001',
        name: 'Andreas Manoppo',
        role: JobRole.staff,
        departmentId: 'keuangan_umum_logistik',
        subdepartmentId: 'keuangan',
        mustChangePassword: false,
        hasPin: true,
      );
    await tester.pumpWidget(PresensiApp(store: store));
    await tester.pump();
    return store;
  }

  testWidgets(
    'Employee shell renders 4 bottom tabs and submits leave request on mobile',
    (tester) async {
      await launch(tester, const Size(390, 844));
      expect(find.text('Halo, Andreas Manoppo'), findsOneWidget);
      expect(find.text('Durasi Kerja Efektif'), findsOneWidget);
      expect(tester.takeException(), isNull);

      // Navigate to Riwayat tab
      await tester.tap(find.text('Riwayat'));
      await tester.pump();
      expect(find.text('Riwayat Kehadiran'), findsOneWidget);
      expect(tester.takeException(), isNull);

      // Navigate to Izin & Cuti tab and submit a leave request
      await tester.tap(find.text('Izin & Cuti'));
      await tester.pump();
      expect(find.text('Izin & Cuti Saya'), findsOneWidget);

      await tester.tap(find.text('Ajukan'));
      await tester.pumpAndSettle();
      expect(find.text('Ajukan Izin / Cuti'), findsOneWidget);

      await tester.enterText(
        find.byType(TextField).first,
        'Mengurus administrasi keluarga di dinas kependudukan',
      );
      await tester.ensureVisible(find.text('Kirim Pengajuan'));
      await tester.tap(find.text('Kirim Pengajuan'));
      await tester.pumpAndSettle();

      expect(find.text('Menunggu'), findsOneWidget);
      expect(
        find.text('Mengurus administrasi keluarga di dinas kependudukan'),
        findsOneWidget,
      );
      expect(tester.takeException(), isNull);

      // Navigate to Profil tab
      await tester.tap(find.text('Profil'));
      await tester.pump();
      expect(find.text('Penugasan Organisasi'), findsOneWidget);
      expect(find.text('Jadwal WFH Subbagian Anda'), findsOneWidget);
      expect(find.text('Ganti PIN Presensi'), findsOneWidget);
      expect(tester.takeException(), isNull);

      await tester.pumpWidget(const SizedBox());
    },
  );

  testWidgets('Employee shell fits tablet viewport cleanly', (tester) async {
    await launch(tester, const Size(768, 1024));
    expect(find.text('Halo, Andreas Manoppo'), findsOneWidget);
    expect(find.text('Presensi'), findsOneWidget);
    expect(find.text('Riwayat'), findsOneWidget);
    expect(find.text('Izin & Cuti'), findsOneWidget);
    expect(find.text('Profil'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.pumpWidget(const SizedBox());
  });
}
