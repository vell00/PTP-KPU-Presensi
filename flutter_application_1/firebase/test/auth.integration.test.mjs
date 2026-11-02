import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {initializeApp as initializeAdmin,deleteApp as deleteAdmin} from 'firebase-admin/app';
import {getFirestore as getAdminFirestore} from 'firebase-admin/firestore';
import {getAuth as getAdminAuth} from 'firebase-admin/auth';
import {initializeApp,deleteApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator,doc,getDoc} from 'firebase/firestore';

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Jalankan test melalui emulator Auth dan Firestore.');
}
const projectId='demo-hadir-kpu';
const admin=initializeAdmin({projectId},'auth-test-admin');
const app=initializeApp({projectId,apiKey:'demo-api-key',appId:'demo-app'},'auth-test-client');
const auth=getAuth(app);
connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
const db=getFirestore(app);
connectFirestoreEmulator(db,'127.0.0.1',8085);
after(async()=>{await signOut(auth);await deleteApp(app);await deleteAdmin(admin);});
test('Firebase authentication enforces profile capability at the Firestore boundary',async()=>{
  const email=`admin-${Date.now()}@hadir.test`,password='Test-password-123!';
  const user=await getAdminAuth(admin).createUser({email,password});
  await signInWithEmailAndPassword(auth,email,password);
  await assert.rejects(getDoc(doc(db,'workspaces/kpu-sulut')),e=>e.code==='permission-denied');
  await getAdminAuth(admin).setCustomUserClaims(user.uid,{sessionVersion:'v1'});
  await getAdminFirestore(admin).doc(`users/${user.uid}`).set({active:true,isAdmin:true,mustChangePassword:false,sessionVersion:'v1'});
  await auth.currentUser.getIdToken(true);
  const result=await auth.currentUser.getIdTokenResult();
  assert.equal(result.claims.sessionVersion,'v1');
  await getDoc(doc(db,'workspaces/kpu-sulut'));
  await signOut(auth);
  await assert.rejects(getDoc(doc(db,'workspaces/kpu-sulut')),e=>e.code==='permission-denied');
  await getAdminAuth(admin).deleteUser(user.uid);
});
