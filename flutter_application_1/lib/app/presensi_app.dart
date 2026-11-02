import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../core/data/app_store.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/presentation/firebase_login.dart';
import 'workspace.dart';

class PresensiApp extends StatelessWidget {
  final AppStore store;
  final bool initialAdmin;
  final bool firebaseEnabled;
  final String? configurationError;
  const PresensiApp({
    super.key,
    required this.store,
    this.initialAdmin = kIsWeb,
    this.firebaseEnabled = false,
    this.configurationError,
  });
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Hadir • KPU Sulawesi Utara',
    debugShowCheckedModeBanner: false,
    theme: buildAppTheme(),
    home: configurationError != null
        ? Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.settings_outlined, size: 40),
                    const SizedBox(height: 16),
                    const Text(
                      'Firebase belum siap',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SelectableText(
                      configurationError!,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          )
        : !firebaseEnabled
        ? Workspace(store: store, initialAdmin: initialAdmin)
        : FirebaseLogin(
            prefs: store.prefs,
            workspace: (remote, logout) => Workspace(
              store: remote,
              initialAdmin: remote.currentUser?.isAdmin == true,
              onLogout: logout,
            ),
          ),
  );
}
