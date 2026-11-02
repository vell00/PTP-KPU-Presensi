// Run manually from a trusted machine using Application Default Credentials.
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
const [projectId,uid]=process.argv.slice(2);
if(!projectId||!uid)throw new Error('Usage: npm run admin:grant -- PROJECT_ID AUTH_USER_UID');
if(process.env.FIREBASE_AUTH_EMULATOR_HOST)throw new Error('Hapus FIREBASE_AUTH_EMULATOR_HOST untuk mengelola akun proyek asli.');
initializeApp({credential:applicationDefault(),projectId});
const auth=getAuth();
const user=await auth.getUser(uid);
const ref=getFirestore().doc(`users/${user.uid}`);
if(!(await ref.get()).exists)throw new Error('Profil NIP harus dibuat terlebih dahulu.');
await ref.update({isAdmin:true});
console.log('Hak administrator diberikan. Pengguna perlu login ulang untuk memperbarui tampilan.');
