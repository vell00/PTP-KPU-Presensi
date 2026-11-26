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

/// Employee authentication & mandatory onboarding controller.
/// Accounts are provisioned strictly by Administrators via Cloud Functions.
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
    notice = null;
    _notify();
    try {
      final cleanNip = nip.trim();
      if (!validNip(cleanNip)) {
        throw const StorageException('NIP harus terdiri dari tepat 18 digit angka.');
      }

      UserCredential credential;
      try {
        credential = await auth.signInWithEmailAndPassword(
          email: nipEmail(cleanNip),
          password: password,
        );
      } on FirebaseAuthException catch (e) {
        if (e.code == 'invalid-credential' ||
            e.code == 'user-not-found' ||
            e.code == 'invalid-email') {
          // Support legacy @kpu.go.id accounts during migration
          credential = await auth.signInWithEmailAndPassword(
            email: '$cleanNip@kpu.go.id',
            password: password,
          );
        } else {
          rethrow;
        }
      }

      final user = credential.user;
      if (user == null) {
        throw const StorageException('Login gagal. Silakan coba kembali.');
      }
      await user.getIdTokenResult(true);

      final document = await firestore
          .collection('users')
          .doc(user.uid)
          .get(const GetOptions(source: Source.server));
      final data = document.data();
      if (data == null || data['active'] != true) {
        throw const StorageException(
          'Akun belum aktif atau tidak ditemukan. Hubungi Administrator Sekretariat KPU Sulut.',
        );
      }
      data['uid'] = user.uid;
      profile = UserProfile.fromJson(data);
      if (profile!.mustChangePassword) return;

      final repository = EmployeeWorkspaceRepository(
        firestore: firestore,
        uid: user.uid,
        nip: profile!.nip,
      );
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
        'user-not-found' => 'NIP atau kata sandi salah.',
        'invalid-email' => 'Format NIP tidak valid.',
        'user-disabled' => 'Akun dinonaktifkan. Hubungi Administrator Sekretariat.',
        'too-many-requests' => 'Terlalu banyak percobaan gagal. Coba beberapa menit lagi.',
        'network-request-failed' => 'Tidak ada koneksi internet. Periksa jaringan Anda.',
        _ => 'Gagal masuk (${e.code}).',
      };
      try {
        await auth.signOut();
      } catch (_) {}
    } catch (e) {
      profile = null;
      error = e.toString().replaceFirst('Exception: ', '');
      try {
        await auth.signOut();
      } catch (_) {}
    } finally {
      busy = false;
      _notify();
    }
  }

  /// Securely hashes and stores the employee's initial 6-digit PIN via Cloud Function
  /// (zero plaintext PIN stored in Firestore, preserves original JobRole).
  Future<void> createInitialPin(String pin) async {
    if (busy || profile == null) return;
    busy = true;
    error = null;
    _notify();
    try {
      final cleanPin = pin.trim();
      if (!RegExp(r'^\d{6}$').hasMatch(cleanPin)) {
        throw const StorageException('PIN harus terdiri dari tepat 6 digit angka.');
      }
      await FirebaseFunctions.instanceFor(region: 'asia-southeast2')
          .httpsCallable('setAttendancePin')
          .call({'newPin': cleanPin});

      profile = profile!.copyWith(hasPin: true);
      if (store != null) {
        store!.currentUser = profile;
        await store!.refresh();
      }
    } on FirebaseFunctionsException catch (e) {
      error = e.message ?? 'Gagal menyimpan PIN presensi.';
    } catch (e) {
      error = e.toString().replaceFirst('Exception: ', '');
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
          'Kata sandi berhasil diperbarui. Silakan masuk kembali menggunakan NIP dan kata sandi baru Anda.';
    } on FirebaseFunctionsException catch (e) {
      error = e.message ?? 'Perubahan kata sandi belum berhasil.';
    } catch (_) {
      error = 'Sesi berubah. Masuk kembali menggunakan kata sandi terbaru.';
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
