import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../../../core/firebase/employee_workspace_repository.dart';
import '../../users/domain/organization.dart';
import '../../users/domain/user_profile.dart';
import '../../../core/data/app_store.dart';
import '../../../core/data/workspace_repository.dart';
import '../../../core/firebase/firestore_workspace_repository.dart';

/// Profile capabilities and mandatory password onboarding determine access.
class AuthController extends ChangeNotifier {
  final SharedPreferences prefs;
  final FirebaseAuth auth;
  final FirebaseFirestore firestore;
  AuthController({
    required this.prefs,
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
  }) : auth = auth ?? FirebaseAuth.instance,
       firestore = firestore ?? FirebaseFirestore.instance {
    _subscription = this.auth.authStateChanges().listen((user) {
      if (user == null && (store != null || profile != null)) {
        _clearStore();
        profile = null;
        if (!busy) error = 'Sesi berakhir. Silakan masuk kembali.';
        _notify();
      }
    });
  }
  late final StreamSubscription<User?> _subscription;
  AppStore? store;
  UserProfile? profile;
  String? notice;
  bool busy = false;
  String? error;
  bool _disposed = false;
  void _notify() {
    if (!_disposed) notifyListeners();
  }

  void _clearStore() {
    final previous = store;
    store = null;
    Future<void>.delayed(Duration.zero, () => previous?.dispose());
  }

  Future<void> login(String nip, String password) async {
    if (busy) return;
    busy = true;
    error = null;
    _notify();
    try {
      if (!validNip(nip.trim())) {
        throw const StorageException('NIP harus 18 digit.');
      }
      final credential = await auth.signInWithEmailAndPassword(
        email: nipEmail(nip),
        password: password,
      );
      final user = credential.user;
      if (user == null) {
        throw const StorageException('Login gagal. Silakan coba kembali.');
      }
      final token = await user.getIdTokenResult(true);
      final document = await firestore
          .collection('users')
          .doc(user.uid)
          .get(const GetOptions(source: Source.server));
      final data = document.data();
      if (data == null ||
          data['active'] != true ||
          data['sessionVersion'] != token.claims?['sessionVersion']) {
        throw const StorageException(
          'Profil akun belum aktif atau sesi tidak valid. Hubungi admin.',
        );
      }
      profile = UserProfile.fromJson(data);
      if (profile!.mustChangePassword) return;
      final repository = profile!.isAdmin
          ? FirestoreWorkspaceRepository(firestore: firestore, uid: user.uid)
          : EmployeeWorkspaceRepository(firestore: firestore, uid: user.uid);
      final loaded = await AppStore.connect(prefs, repository);
      loaded.currentUser = profile;
      if (_disposed) {
        loaded.dispose();
        return;
      }
      store = loaded;
    } on FirebaseAuthException catch (e) {
      profile = null;
      error = switch (e.code) {
        'invalid-credential' ||
        'wrong-password' ||
        'user-not-found' => 'NIP atau password salah.',
        'invalid-email' => 'NIP tidak valid.',
        'user-disabled' => 'Akun dinonaktifkan. Hubungi pengelola.',
        'too-many-requests' => 'Terlalu banyak percobaan. Coba lagi nanti.',
        'network-request-failed' => 'Koneksi gagal. Periksa internet Anda.',
        'operation-not-allowed' =>
          'Login email/password belum diaktifkan oleh pengelola Firebase.',
        _ => 'Login Firebase gagal (${e.code}).',
      };
      try {
        await auth.signOut();
      } catch (_) {
        /* Keep the workspace closed. */
      }
    } catch (e) {
      profile = null;
      error = e.toString();
      try {
        await auth.signOut();
      } catch (_) {
        /* Keep the workspace closed. */
      }
    } finally {
      busy = false;
      _notify();
    }
  }

  Future<void> changeInitialPassword(String password) async {
    if (busy) return;
    busy = true;
    error = null;
    _notify();
    try {
      await FirebaseFunctions.instanceFor(region: 'asia-southeast2')
          .httpsCallable('completeInitialPasswordChange')
          .call({'password': password});
      await auth.signOut();
      profile = null;
      notice =
          'Password berhasil diganti. Masuk kembali menggunakan NIP dan password baru.';
    } on FirebaseFunctionsException catch (e) {
      error = e.message ?? 'Perubahan password belum berhasil.';
    } catch (_) {
      error =
          'Sesi berubah. Keluar lalu masuk kembali menggunakan password terbaru.';
    } finally {
      busy = false;
      _notify();
    }
  }

  Future<void> logout() async {
    if (busy) return;
    busy = true;
    try {
      await auth.signOut();
      _clearStore();
      profile = null;
      error = null;
    } catch (_) {
      error = 'Tidak dapat mengakhiri sesi. Coba lagi.';
    } finally {
      busy = false;
      _notify();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _subscription.cancel();
    store?.dispose();
    super.dispose();
  }
}
