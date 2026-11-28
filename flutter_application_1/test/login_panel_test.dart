import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/core/theme/app_theme.dart';
import 'package:flutter_application_1/features/auth/presentation/widgets/login_panel.dart';

void main() {
  testWidgets('Login fits mobile, validates NIP/password, and submits cleanly', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    String? submitted;
    await tester.pumpWidget(
      MaterialApp(
        theme: buildAppTheme(),
        home: LoginPanel(
          busy: false,
          onSubmit: (nip, password) async {
            submitted = '$nip|$password';
          },
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.text('0/18'), findsOneWidget);

    await tester.ensureVisible(find.text('Masuk ke Portal'));
    await tester.tap(find.text('Masuk ke Portal'));
    await tester.pumpAndSettle();
    expect(find.text('NIP harus terdiri dari 18 digit angka'), findsOneWidget);
    expect(find.text('Kata sandi wajib diisi'), findsOneWidget);
    expect(submitted, isNull);

    await tester.enterText(
      find.byType(TextFormField).first,
      '199001012020011001',
    );
    await tester.pump();
    expect(find.text('18/18'), findsOneWidget);

    await tester.enterText(find.byType(TextFormField).last, 'my-password');
    await tester.tap(find.byTooltip('Tampilkan kata sandi'));
    await tester.pumpAndSettle();
    expect(
      tester.widget<TextField>(find.byType(TextField).last).obscureText,
      isFalse,
    );

    await tester.ensureVisible(find.text('Masuk ke Portal'));
    await tester.tap(find.text('Masuk ke Portal'));
    await tester.pumpAndSettle();
    expect(submitted, '199001012020011001|my-password');
    expect(tester.takeException(), isNull);
  });

  testWidgets('Forgot password link opens admin reset instructions dialog', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        theme: buildAppTheme(),
        home: LoginPanel(busy: false, onSubmit: (_, _) async {}),
      ),
    );

    await tester.tap(find.text('Lupa kata sandi?'));
    await tester.pumpAndSettle();
    expect(find.text('Lupa Kata Sandi?'), findsOneWidget);
    await tester.tap(find.text('Mengerti'));
    await tester.pumpAndSettle();
    expect(find.text('Lupa Kata Sandi?'), findsNothing);
  });
}
