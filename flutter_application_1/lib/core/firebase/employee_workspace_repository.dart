import 'package:cloud_firestore/cloud_firestore.dart';
import '../data/workspace_repository.dart';

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
      var generalSettings = <String, dynamic>{};
      try {
        final settings = await firestore.doc('settings/general').get();
        if (settings.exists && settings.data() != null) {
          generalSettings = settings.data()!;
        }
      } catch (_) {}

      final lat = (generalSettings['latitude'] as num?)?.toDouble() ?? 1.4748;
      final lng = (generalSettings['longitude'] as num?)?.toDouble() ?? 124.8421;
      final rad = (generalSettings['radius'] as num?)?.toDouble() ?? 100.0;

      policy = {
        ...emptyWorkspace(),
        'fridayWfh': true,
        'latitude': lat,
        'longitude': lng,
        'radius': rad,
      };

      final snapshot = await ref.get();
      return {
        'revision': snapshot.data()?['revision'] ?? 0,
        'data': {
          ...policy,
          ...?(snapshot.data()?['data'] as Map<String, dynamic>?),
        },
      };
    } catch (_) {
      return {
        'revision': 0,
        'data': {
          ...emptyWorkspace(),
          'fridayWfh': true,
          'latitude': 1.4748,
          'longitude': 124.8421,
          'radius': 100.0,
        },
      };
    }
  }

  @override
  Future<Map<String, dynamic>> save(
    int revision,
    Map<String, dynamic> data,
  ) async {
    final ownData = {
      'records': data['records'],
      'requests': data['requests'],
    };
    try {
      await ref.set({
        'revision': revision + 1,
        'data': ownData,
        'updatedBy': uid,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      return {
        'revision': revision + 1,
        'data': {...policy, ...ownData},
      };
    } catch (_) {
      return {
        'revision': revision + 1,
        'data': {...policy, ...ownData},
      };
    }
  }
}
