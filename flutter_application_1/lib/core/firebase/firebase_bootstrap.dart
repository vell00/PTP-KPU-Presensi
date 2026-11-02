import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../../firebase_options.dart';

const useFirebase = bool.fromEnvironment('USE_FIREBASE');
const useFirebaseEmulators = bool.fromEnvironment('FIREBASE_EMULATORS');

Future<void> initializeFirebase() async {
  if (!useFirebase) return;
  final host = const String.fromEnvironment('FIREBASE_EMULATOR_HOST');
  await Firebase.initializeApp(
    options: useFirebaseEmulators
        ? const FirebaseOptions(
            apiKey: 'demo-api-key',
            appId: '1:123456789:web:hadir-demo',
            messagingSenderId: '123456789',
            projectId: 'demo-hadir-kpu',
            authDomain: 'demo-hadir-kpu.firebaseapp.com',
          )
        : DefaultFirebaseOptions.currentPlatform,
  );
  // Avoid retaining sensitive admin data on shared browsers/devices.
  FirebaseFirestore.instance.settings = const Settings(
    persistenceEnabled: false,
  );
  if (kIsWeb) await FirebaseAuth.instance.setPersistence(Persistence.SESSION);
  if (useFirebaseEmulators) {
    final resolvedHost = host.isNotEmpty
        ? host
        : (!kIsWeb && defaultTargetPlatform == TargetPlatform.android
              ? '10.0.2.2'
              : '127.0.0.1');
    await FirebaseAuth.instance.useAuthEmulator(resolvedHost, 9099);
    FirebaseFirestore.instance.useFirestoreEmulator(resolvedHost, 8085);
    FirebaseFunctions.instanceFor(
      region: 'asia-southeast2',
    ).useFunctionsEmulator(resolvedHost, 5001);
  }
}
