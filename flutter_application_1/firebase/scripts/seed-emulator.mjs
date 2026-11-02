// Local emulator only; resets this demo administrator to first-login state.
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {randomUUID} from 'node:crypto';
process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8085';
initializeApp({projectId:'demo-hadir-kpu'});
const auth=getAuth(),nip='198001012005011001',uid=`nip_${nip}`,password='Demo-Hadir-123!';
try {await auth.getUser(uid);await auth.updateUser(uid,{password});}
catch(e){if(e.code!=='auth/user-not-found')throw e;await auth.createUser({uid,email:`${nip}@nip.hadir.invalid`,password});}
const sessionVersion=randomUUID();
await auth.setCustomUserClaims(uid,{sessionVersion});
await getFirestore().doc(`users/${uid}`).set({uid,nip,name:'Administrator KPU',role:'kepala_bagian',departmentId:'keuangan_umum_logistik',subdepartmentId:null,isAdmin:true,active:true,mustChangePassword:true,sessionVersion});
console.log(`Admin emulator: NIP ${nip} / ${password}. Wajib ganti password saat masuk.`);
