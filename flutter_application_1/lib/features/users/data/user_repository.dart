import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../../../core/data/app_store.dart';
import '../domain/user_profile.dart';

abstract interface class UserRepository {
  Future<List<UserProfile>> list();
  Future<void> create(UserProfile user);
  Future<void> update(UserProfile user);
}

class FirebaseUserRepository implements UserRepository {
  final FirebaseFirestore firestore;
  final FirebaseFunctions functions;
  FirebaseUserRepository({
    FirebaseFirestore? firestore,
    FirebaseFunctions? functions,
  }) : firestore = firestore ?? FirebaseFirestore.instance,
       functions =
           functions ??
           FirebaseFunctions.instanceFor(region: 'asia-southeast2');
  @override
  Future<List<UserProfile>> list() async {
    final snapshot = await firestore
        .collection('users')
        .orderBy('name')
        .limit(500)
        .get(const GetOptions(source: Source.server));
    return snapshot.docs.map((d) => UserProfile.fromJson(d.data())).toList();
  }

  @override
  Future<void> create(UserProfile user) async {
    await functions.httpsCallable('createManagedUser').call(user.assignment());
  }

  @override
  Future<void> update(UserProfile user) async {
    await functions.httpsCallable('updateManagedUser').call(user.assignment());
  }
}

/// Local preview only; it does not create Firebase identities or store passwords.
class DemoUserRepository implements UserRepository {
  final AppStore store;
  DemoUserRepository(this.store);
  @override
  Future<List<UserProfile>> list() async => store.employees
      .where((e) => e.containsKey('role'))
      .map(
        (e) => UserProfile.fromJson({
          ...e,
          'subdepartmentId': e['subdepartmentId'] == ''
              ? null
              : e['subdepartmentId'],
          'active': true,
          'isAdmin': false,
          'mustChangePassword': true,
        }),
      )
      .toList();
  @override
  Future<void> create(UserProfile user) async {
    if (store.employees.any((e) => e['nip'] == user.nip)) {
      throw StateError('NIP sudah terdaftar.');
    }
    store.employees.add(
      user.assignment().map(
        (key, value) => MapEntry(key, value?.toString() ?? ''),
      ),
    );
    if (!await store.save()) throw StateError('Data belum tersimpan.');
  }

  @override
  Future<void> update(UserProfile user) async {
    final index = store.employees.indexWhere((e) => e['nip'] == user.nip);
    if (index < 0) throw StateError('Pengguna tidak ditemukan.');
    store.employees[index] = user.assignment().map(
      (key, value) => MapEntry(key, value?.toString() ?? ''),
    );
    if (!await store.save()) throw StateError('Data belum tersimpan.');
  }
}
