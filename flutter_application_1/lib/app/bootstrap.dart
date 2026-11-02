import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/data/app_store.dart';
import '../core/firebase/firebase_bootstrap.dart';
import 'presensi_app.dart';

Future<void> bootstrap() async {
  WidgetsFlutterBinding.ensureInitialized();
  final store = AppStore(await SharedPreferences.getInstance());
  String? error;
  try {
    await initializeFirebase();
  } catch (e) {
    error = e.toString();
  }
  runApp(
    PresensiApp(
      store: store,
      firebaseEnabled: useFirebase,
      configurationError: error,
    ),
  );
}
