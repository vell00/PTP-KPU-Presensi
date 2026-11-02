import 'package:flutter_test/flutter_test.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_application_1/core/data/workspace_repository.dart';
import 'package:flutter_application_1/core/firebase/firestore_workspace_repository.dart';

void main() {
  test(
    'first write stores the author, revision and server timestamp',
    () async {
      final firestore = FakeFirebaseFirestore();
      final repository = FirestoreWorkspaceRepository(
        firestore: firestore,
        uid: 'admin-user',
      );
      expect((await repository.load())['revision'], 0);
      final data = emptyWorkspace()..['radius'] = 200;
      expect((await repository.save(0, data))['revision'], 1);
      final saved = (await firestore.doc('workspaces/kpu-sulut').get()).data()!;
      expect(saved['updatedBy'], 'admin-user');
      expect(saved['updatedAt'], isA<Timestamp>());
      expect((await repository.load())['data']['radius'], 200);
    },
  );
  test(
    'a stale administrator cannot overwrite another administrator update',
    () async {
      final firestore = FakeFirebaseFirestore();
      final first = FirestoreWorkspaceRepository(
        firestore: firestore,
        uid: 'first',
      );
      final second = FirestoreWorkspaceRepository(
        firestore: firestore,
        uid: 'second',
      );
      final snapshot = await second.load();
      await first.save(0, emptyWorkspace()..['radius'] = 300);
      await expectLater(
        second.save(snapshot['revision'], emptyWorkspace()),
        throwsA(isA<StorageException>()),
      );
      expect((await first.load())['data']['radius'], 300);
    },
  );
  test('oversize workspace is rejected before creating a document', () async {
    final firestore = FakeFirebaseFirestore();
    final repository = FirestoreWorkspaceRepository(
      firestore: firestore,
      uid: 'admin',
    );
    final data = emptyWorkspace();
    data['records'] = [
      {'payload': 'x' * 700001},
    ];
    await expectLater(
      repository.save(0, data),
      throwsA(isA<StorageException>()),
    );
    expect((await firestore.doc('workspaces/kpu-sulut').get()).exists, isFalse);
  });
}
