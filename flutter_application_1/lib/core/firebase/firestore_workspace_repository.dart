import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../data/workspace_repository.dart';

/// Admin prototype snapshot. Writes are atomic and reject stale revisions.
/// Production attendance requires per-employee collections and server verification.
class FirestoreWorkspaceRepository implements WorkspaceRepository {
  final FirebaseFirestore firestore;
  final String uid;
  FirestoreWorkspaceRepository({required this.firestore, required this.uid});
  DocumentReference<Map<String, dynamic>> get _document =>
      firestore.collection('workspaces').doc('kpu-sulut');

  @override
  Future<Map<String, dynamic>> load() async {
    try {
      // Never present an offline cache as the latest authoritative version.
      final snapshot = await _document.get(
        const GetOptions(source: Source.server),
      );
      if (!snapshot.exists) return {'revision': 0, 'data': emptyWorkspace()};
      final value = snapshot.data()!;
      return {'revision': value['revision'], 'data': value['data']};
    } on FirebaseException catch (e) {
      throw StorageException(firebaseStorageMessage(e.code));
    }
  }

  @override
  Future<Map<String, dynamic>> save(
    int revision,
    Map<String, dynamic> data,
  ) async {
    // Leave headroom below Firestore's document limit. No silent truncation.
    if (utf8.encode(jsonEncode(data)).length > 700000) {
      throw const StorageException(
        'Data melebihi kapasitas workspace prototipe. Arsipkan data melalui pengelola sebelum melanjutkan.',
      );
    }
    try {
      return await firestore.runTransaction((transaction) async {
        final snapshot = await transaction.get(_document);
        final current = snapshot.data()?['revision'] ?? 0;
        if (current != revision) {
          throw const StorageException(
            'Data berubah di perangkat lain. Muat ulang sebelum menyimpan.',
          );
        }
        transaction.set(_document, {
          'revision': revision + 1,
          'data': data,
          'updatedAt': FieldValue.serverTimestamp(),
          'updatedBy': uid,
        });
        transaction.set(firestore.doc('policies/attendance'), {
          'fridayWfh': data['fridayWfh'],
          'latitude': data['latitude'],
          'longitude': data['longitude'],
          'radius': data['radius'],
        });
        return {'revision': revision + 1, 'data': data};
      });
    } on FirebaseException catch (e) {
      throw StorageException(firebaseStorageMessage(e.code));
    }
  }
}

String firebaseStorageMessage(String code) => switch (code) {
  'permission-denied' =>
    'Akses ditolak. Akun memerlukan peran admin dan Firestore Rules yang sesuai.',
  'unauthenticated' => 'Sesi berakhir. Silakan masuk kembali.',
  'unavailable' || 'deadline-exceeded' =>
    'Firestore tidak dapat dihubungi. Periksa koneksi internet.',
  'resource-exhausted' => 'Kuota atau kapasitas Firestore tidak tersedia.',
  _ => 'Penyimpanan Firebase gagal ($code). Silakan coba kembali.',
};
