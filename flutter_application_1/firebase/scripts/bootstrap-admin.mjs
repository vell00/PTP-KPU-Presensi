// Explicit trusted-machine bootstrap, never called by Flutter.
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {createUserService} from '../../functions/src/user_service.js';
const [projectId,nip,name]=process.argv.slice(2);
if(!projectId||!nip||!name)throw Error('Usage: npm run admin:bootstrap -- PROJECT_ID NIP "Nama Admin"');
if(process.env.FIREBASE_AUTH_EMULATOR_HOST||process.env.FIRESTORE_EMULATOR_HOST)throw Error('Gunakan seed:emulator untuk akun lokal.');
const password=process.env.INITIAL_USER_PASSWORD;
if(!password)throw Error('INITIAL_USER_PASSWORD harus tersedia di environment mesin tepercaya.');
initializeApp({credential:applicationDefault(),projectId});
const db=getFirestore();
// Bootstrap authority exists only for this trusted server process.
const authority=`bootstrap_${Date.now()}`;
await db.doc(`users/${authority}`).create({active:true,isAdmin:true,mustChangePassword:false,sessionVersion:authority});
try {
 const service=createUserService({auth:getAuth(),db,initialPassword:()=>password,fieldValue:FieldValue});
 const {uid}=await service.createManagedUser({auth:{uid:authority,token:{sessionVersion:authority}},data:{nip,name,role:'kepala_bagian',departmentId:'keuangan_umum_logistik',subdepartmentId:null}});
 await db.doc(`users/${uid}`).update({isAdmin:true});
 console.log('Akun awal berhasil dibuat. Wajib mengganti password saat login; sesuaikan jabatan melalui Manajemen Pengguna.');
}finally{await db.doc(`users/${authority}`).delete();}
