import 'package:cloud_firestore/cloud_firestore.dart';
import '../data/workspace_repository.dart';
import 'firestore_workspace_repository.dart';

/// A signed-in employee can only access their own prototype attendance/requests.
class EmployeeWorkspaceRepository implements WorkspaceRepository {
  final FirebaseFirestore firestore;
  final String uid;
  EmployeeWorkspaceRepository({required this.firestore, required this.uid});
  DocumentReference<Map<String, dynamic>> get ref =>
      firestore.collection('employeeWorkspaces').doc(uid);
  Map<String, dynamic> policy = {...emptyWorkspace(), 'fridayWfh': false};
  @override
  Future<Map<String, dynamic>> load() async {
    try {
      final settings = await firestore
          .doc('policies/attendance')
          .get(const GetOptions(source: Source.server));
      policy = {...emptyWorkspace(), 'fridayWfh': false, ...?settings.data()};
      final snapshot = await ref.get(const GetOptions(source: Source.server));
      return {
        'revision': snapshot.data()?['revision'] ?? 0,
        'data': {
          ...policy,
          ...?(snapshot.data()?['data'] as Map<String, dynamic>?),
        },
      };
    } on FirebaseException catch (e) {
      throw StorageException(firebaseStorageMessage(e.code));
    }
  }

  @override
  Future<Map<String, dynamic>> save(
    int revision,
    Map<String, dynamic> data,
  ) async {
    try {
      return await firestore.runTransaction((transaction) async {
        final snapshot = await transaction.get(ref);
        if ((snapshot.data()?['revision'] ?? 0) != revision) {
          throw const StorageException(
            'Data berubah. Muat ulang sebelum menyimpan.',
          );
        }
        final ownData = {
          'records': data['records'],
          'requests': data['requests'],
        };
        transaction.set(ref, {
          'revision': revision + 1,
          'data': ownData,
          'updatedBy': uid,
          'updatedAt': FieldValue.serverTimestamp(),
        });
        return {
          'revision': revision + 1,
          'data': {...policy, ...ownData},
        };
      });
    } on FirebaseException catch (e) {
      throw StorageException(firebaseStorageMessage(e.code));
    }
  }
}
