import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/core/theme/app_theme.dart';
import 'package:flutter_application_1/features/auth/presentation/widgets/change_password_panel.dart';
import 'package:flutter_application_1/features/auth/presentation/widgets/create_pin_panel.dart';
import 'package:flutter_application_1/features/users/domain/organization.dart';
import 'package:flutter_application_1/features/users/domain/user_profile.dart';

void main() {
  testWidgets(
    'password onboarding blocks weak and mismatched input on mobile',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      String? submitted;
      await tester.pumpWidget(
        MaterialApp(
          theme: buildAppTheme(),
          home: ChangePasswordPanel(
            busy: false,
            onLogout: () {},
            onSubmit: (value) async {
              submitted = value;
            },
          ),
        ),
      );

      await tester.ensureVisible(find.text('Simpan Kata Sandi Baru'));
      await tester.tap(find.text('Simpan Kata Sandi Baru'));
      await tester.pumpAndSettle();
      expect(submitted, isNull);
      expect(
        find.text('Kata sandi belum memenuhi syarat keamanan'),
        findsOneWidget,
      );

      await tester.enterText(
        find.byType(TextFormField).first,
        'Personal-Password-123',
      );
      await tester.enterText(find.byType(TextFormField).last, 'wrong');
      await tester.ensureVisible(find.text('Simpan Kata Sandi Baru'));
      await tester.tap(find.text('Simpan Kata Sandi Baru'));
      await tester.pumpAndSettle();
      expect(find.text('Konfirmasi kata sandi tidak cocok'), findsOneWidget);
      expect(submitted, isNull);

      await tester.enterText(
        find.byType(TextFormField).last,
        'Personal-Password-123',
      );
      await tester.ensureVisible(find.text('Simpan Kata Sandi Baru'));
      await tester.tap(find.text('Simpan Kata Sandi Baru'));
      await tester.pumpAndSettle();
      expect(submitted, 'Personal-Password-123');
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('PIN onboarding rejects weak or mismatched PINs and saves valid PIN', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    String? submittedPin;
    await tester.pumpWidget(
      MaterialApp(
        theme: buildAppTheme(),
        home: CreatePinPanel(
          busy: false,
          onLogout: () {},
          onSubmit: (pin) async {
            submittedPin = pin;
          },
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField).first, '123456');
    await tester.enterText(find.byType(TextFormField).last, '123456');
    await tester.ensureVisible(find.text('Simpan PIN'));
    await tester.tap(find.text('Simpan PIN'));
    await tester.pumpAndSettle();
    expect(
      find.text('Hindari pola mudah ditebak seperti 123456'),
      findsOneWidget,
    );
    expect(submittedPin, isNull);

    await tester.enterText(find.byType(TextFormField).first, '482913');
    await tester.enterText(find.byType(TextFormField).last, '482910');
    await tester.ensureVisible(find.text('Simpan PIN'));
    await tester.tap(find.text('Simpan PIN'));
    await tester.pumpAndSettle();
    expect(find.text('Konfirmasi PIN tidak cocok'), findsOneWidget);
    expect(submittedPin, isNull);

    await tester.enterText(find.byType(TextFormField).last, '482913');
    await tester.ensureVisible(find.text('Simpan PIN'));
    await tester.tap(find.text('Simpan PIN'));
    await tester.pumpAndSettle();
    expect(submittedPin, '482913');
    expect(tester.takeException(), isNull);
  });

  test('UserProfile resolves canonical subdepartment slugs and unit labels', () {
    final canonical = UserProfile.fromJson({
      'uid': 'nip_199001012020011001',
      'nip': '199001012020011001',
      'name': 'Pegawai Uji',
      'role': 'staff',
      'departmentId': 'keuangan_umum_logistik',
      'subdepartmentId': 'keuangan',
      'active': true,
      'mustChangePassword': false,
      'hasPin': true,
    });
    expect(canonical.subdepartmentSlug, 'keuangan');
    expect(canonical.unitName, 'Keuangan');
    expect(canonical.mustCreatePin, isFalse);

    final legacy = UserProfile.fromJson({
      'uid': 'legacy-1',
      'nip': '199001012020011002',
      'name': 'Pegawai Legacy',
      'role': 'kepala_sub_bagian',
      'departmentId': 'perencanaan_sdm',
      'subdepartmentId': 'Partisipasi, Humas & SDM',
      'active': true,
      'mustChangePassword': false,
      'hasPin': false,
    });
    expect(legacy.role, JobRole.kepalaSubBagian);
    expect(legacy.subdepartmentSlug, 'partisipasi_humas_sdm');
    expect(legacy.mustCreatePin, isTrue);
  });
}
