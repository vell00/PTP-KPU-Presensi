import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/features/auth/presentation/widgets/login_panel.dart';

void main() {
  testWidgets('Login fits mobile and validates input before submitting', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    String? submitted;
    await tester.pumpWidget(
      MaterialApp(
        home: LoginPanel(
          busy: false,
          onSubmit: (email, password) async {
            submitted = '$email|$password';
          },
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    await tester.ensureVisible(find.text('Masuk'));
    await tester.tap(find.text('Masuk'));
    await tester.pumpAndSettle();
    expect(find.text('NIP harus 18 digit'), findsOneWidget);
    expect(submitted, isNull);
    await tester.enterText(
      find.byType(TextFormField).first,
      '199001012020011001',
    );
    await tester.enterText(find.byType(TextFormField).last, 'my-password');
    await tester.tap(find.byTooltip('Tampilkan password'));
    await tester.pumpAndSettle();
    expect(
      tester.widget<TextField>(find.byType(TextField).last).obscureText,
      isFalse,
    );
    await tester.ensureVisible(find.text('Masuk'));
    await tester.tap(find.text('Masuk'));
    await tester.pumpAndSettle();
    expect(submitted, '199001012020011001|my-password');
    expect(tester.takeException(), isNull);
  });
}
