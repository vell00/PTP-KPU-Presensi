import 'package:flutter/material.dart';
import '../core/data/app_store.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/presentation/firebase_login.dart';
import 'workspace.dart';

class PresensiApp extends StatelessWidget {
  final AppStore store;
  final bool firebaseEnabled;
  final String? configurationError;

  const PresensiApp({
    super.key,
    required this.store,
    this.firebaseEnabled = false,
    this.configurationError,
  });

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Presensi KPU Sulawesi Utara',
    debugShowCheckedModeBanner: false,
    theme: buildAppTheme(),
    home: configurationError != null
        ? Scaffold(
            body: SafeArea(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.settings_outlined, size: 42),
                      const SizedBox(height: 16),
                      const Text(
                        'Konfigurasi Firebase Belum Siap',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 10),
                      SelectableText(
                        configurationError!,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          )
        : !firebaseEnabled
        ? Workspace(store: store)
        : FirebaseLogin(
            prefs: store.prefs,
            workspace: (remote, logout) => Workspace(
              store: remote,
              onLogout: logout,
            ),
          ),
  );
}
