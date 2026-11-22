import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../../../core/firebase/employee_workspace_repository.dart';
import '../../../core/utils/date_time.dart';
import '../../users/domain/organization.dart';
import '../../users/domain/user_profile.dart';
import '../../attendance/data/presensi_sync_service.dart';
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
      await user.getIdTokenResult(true);
      final document = await firestore
          .collection('users')
          .doc(user.uid)
          .get(const GetOptions(source: Source.server));
      final data = document.data();
      if (data == null || data['active'] != true) {
        throw const StorageException(
          'Profil akun belum aktif atau tidak ditemukan. Hubungi admin.',
        );
      }
      data['uid'] = user.uid;
      profile = UserProfile.fromJson(data);
      if (profile!.mustChangePassword) return;

      final repository = profile!.isAdmin
          ? FirestoreWorkspaceRepository(firestore: firestore, uid: user.uid)
          : EmployeeWorkspaceRepository(firestore: firestore, uid: user.uid);
      final loaded = await AppStore.connect(prefs, repository);
      loaded.currentUser = profile;

      // Jika user belum memiliki PIN, tampilkan layar pembuatan PIN baru
      if (profile!.mustCreatePin) {
        store = loaded;
        return;
      }

      // Sinkronisasi data presensi hari ini dari Cloud Firestore agar durasi jam kerja langsung aktif dan tidak hilang saat login ulang
      try {
        final todayPresensi = await PresensiSyncService.ambilPresensiHariIni(
          profile!.nip,
          witaNow(),
        );
        if (todayPresensi != null) {
          final day = dayKey(todayPresensi.entered);
          final exists = loaded.records.any((r) => dayKey(r.entered) == day);
          if (!exists) {
            loaded.records.insert(0, todayPresensi);
          } else {
            final idx = loaded.records.indexWhere((r) => dayKey(r.entered) == day);
            if (idx != -1 && loaded.records[idx].exited == null && todayPresensi.exited != null) {
              loaded.records[idx].exited = todayPresensi.exited;
            }
          }
          await prefs.setString(
            'kpu_presensi_${profile!.nip}_$day',
            jsonEncode(todayPresensi.toJson()),
          );
        }
      } catch (_) {}
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

  Future<void> createInitialPin(String pin) async {
    if (busy) return;
    if (profile == null) return;
    busy = true;
    error = null;
    _notify();
    try {
      if (pin.length != 6 || !RegExp(r'^\d{6}$').hasMatch(pin)) {
        throw const StorageException('PIN harus berupa 6 digit angka.');
      }
      final user = auth.currentUser;
      if (user != null) {
        await firestore.collection('users').doc(user.uid).set({
          'pin': pin,
        }, SetOptions(merge: true));
      }
      // Perbarui profil lokal
      final updatedData = {
        'uid': user?.uid ?? profile!.uid,
        'nip': profile!.nip,
        'name': profile!.name,
        'role': profile!.role.name,
        'departmentId': profile!.departmentId,
        'subdepartmentId': profile!.subdepartmentId,
        'password': profile!.password,
        'pin': pin,
        'isAdmin': profile!.isAdmin,
        'active': profile!.active,
        'mustChangePassword': profile!.mustChangePassword,
      };
      profile = UserProfile.fromJson(updatedData);
      if (store != null) {
        store!.currentUser = profile;
      }
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
