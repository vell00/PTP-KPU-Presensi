/// Cloud persistence contract; UI and AppStore do not depend on a database SDK.
abstract interface class WorkspaceRepository {
  Future<Map<String, dynamic>> load();
  Future<Map<String, dynamic>> save(int revision, Map<String, dynamic> data);
}

class StorageException implements Exception {
  final String message;
  const StorageException(this.message);
  @override
  String toString() => message;
}

Map<String, dynamic> emptyWorkspace() => {
  'records': <Map<String, dynamic>>[],
  'requests': <Map<String, dynamic>>[],
  'employees': <Map<String, String>>[],
  'fridayWfh': true,
  'latitude': null,
  'longitude': null,
  'radius': 100,
};
