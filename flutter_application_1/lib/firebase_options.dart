import 'package:firebase_core/firebase_core.dart';

/// Placeholder until a real Firebase project is created.
/// Replace this file with: flutterfire configure --platforms=android,ios,web
/// Demo mode and the local emulator do not require project credentials.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform => throw StateError(
    'Konfigurasi Firebase belum tersedia. Buat proyek Firebase, lalu jalankan '
    'flutterfire configure --platforms=android,ios,web. '
    'Untuk pengembangan lokal gunakan FIREBASE_EMULATORS=true.',
  );
}
