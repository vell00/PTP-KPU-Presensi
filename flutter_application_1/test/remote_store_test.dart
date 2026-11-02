import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_application_1/core/data/workspace_repository.dart';
import 'package:flutter_application_1/core/data/app_store.dart';

class MemoryRepository implements WorkspaceRepository {
  int revision = 0, loads = 0, writes = 0;
  Map<String, dynamic> data = emptyWorkspace();
  bool conflict = false, failReads = false;
  @override
  Future<Map<String, dynamic>> load() async {
    loads++;
    if (failReads) throw const StorageException('Offline');
    return {'revision': revision, 'data': data};
  }

  @override
  Future<Map<String, dynamic>> save(
    int expected,
    Map<String, dynamic> next,
  ) async {
    writes++;
    if (conflict) {
      revision++;
      data = {...data, 'radius': 300};
      throw const StorageException('Konflik data');
    }
    expect(expected, revision);
    data = next;
    revision++;
    return {'revision': revision, 'data': data};
  }
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));
  test('cloud connection does not upload seeded local examples', () async {
    final repository = MemoryRepository();
    final store = await AppStore.connect(
      await SharedPreferences.getInstance(),
      repository,
    );
    expect(store.isRemote, isTrue);
    expect(store.requests, isEmpty);
    expect(repository.writes, 0);
    store.dispose();
  });
  test(
    'cloud writes use current revision and never persist data in local preferences',
    () async {
      final prefs = await SharedPreferences.getInstance();
      final repository = MemoryRepository()..revision = 4;
      final store = await AppStore.connect(prefs, repository);
      store.radius = 200;
      expect(await store.save(), isTrue);
      expect(repository.revision, 5);
      expect(store.radius, 200);
      expect(prefs.getDouble('radius'), isNull);
      store.dispose();
    },
  );
  test(
    'conflict restores the current server state and reports failed save',
    () async {
      final repository = MemoryRepository()..conflict = true;
      final store = await AppStore.connect(
        await SharedPreferences.getInstance(),
        repository,
      );
      String? error;
      store.onError = (e) => error = e;
      store.radius = 200;
      expect(await store.save(), isFalse);
      expect(store.radius, 300);
      expect(error, contains('Konflik data'));
      store.dispose();
    },
  );
  test(
    'offline cloud connection fails instead of loading local sample data',
    () async {
      final repository = MemoryRepository()..failReads = true;
      await expectLater(
        AppStore.connect(await SharedPreferences.getInstance(), repository),
        throwsA(isA<StorageException>()),
      );
      expect(repository.writes, 0);
    },
  );
}
