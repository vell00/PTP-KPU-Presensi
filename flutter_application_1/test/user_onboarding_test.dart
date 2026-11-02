import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/features/auth/presentation/widgets/change_password_panel.dart';
import 'package:flutter_application_1/features/users/presentation/user_editor.dart';
import 'package:flutter_application_1/features/users/domain/user_profile.dart';
import 'package:flutter_application_1/features/users/domain/organization.dart';
import 'package:flutter_application_1/features/users/data/user_repository.dart';

class MemoryUsers implements UserRepository {
  UserProfile? saved;
  @override
  Future<List<UserProfile>> list() async => [];
  @override
  Future<void> create(UserProfile user) async {
    saved = user;
  }

  @override
  Future<void> update(UserProfile user) async {
    saved = user;
  }
}

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
          home: ChangePasswordPanel(
            busy: false,
            onLogout: () {},
            onSubmit: (value) async {
              submitted = value;
            },
          ),
        ),
      );
      await tester.tap(find.text('Simpan password baru'));
      await tester.pumpAndSettle();
      expect(submitted, isNull);
      expect(find.text('Password belum memenuhi ketentuan'), findsOneWidget);
      await tester.enterText(
        find.byType(TextFormField).first,
        'Personal-Password-123',
      );
      await tester.enterText(find.byType(TextFormField).last, 'wrong');
      await tester.ensureVisible(find.text('Simpan password baru'));
      await tester.tap(find.text('Simpan password baru'));
      await tester.pumpAndSettle();
      expect(find.text('Password tidak sama'), findsOneWidget);
      expect(submitted, isNull);
      await tester.enterText(
        find.byType(TextFormField).last,
        'Personal-Password-123',
      );
      await tester.ensureVisible(find.text('Simpan password baru'));
      await tester.tap(find.text('Simpan password baru'));
      await tester.pumpAndSettle();
      expect(submitted, 'Personal-Password-123');
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets('head assignment removes subdivision and saves NIP', (
    tester,
  ) async {
    final repo = MemoryUsers();
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: TextButton(
              onPressed: () => showUserEditor(context, repo),
              child: const Text('Open'),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byType(TextFormField).first,
      'Kepala Pengujian',
    );
    await tester.enterText(
      find.byType(TextFormField).last,
      '199001012020011001',
    );
    await tester.tap(find.byType(DropdownButtonFormField<JobRole>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Kepala Bagian').last);
    await tester.pumpAndSettle();
    expect(find.text('Subbagian'), findsNothing);
    await tester.ensureVisible(find.text('Buat akun'));
    await tester.tap(find.text('Buat akun'));
    await tester.pumpAndSettle();
    expect(repo.saved?.role, JobRole.kepalaBagian);
    expect(repo.saved?.subdepartmentId, isNull);
    expect(repo.saved?.nip, '199001012020011001');
    expect(tester.takeException(), isNull);
  });
}
