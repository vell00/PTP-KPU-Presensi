import {randomUUID} from 'node:crypto';
import {FieldValue} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {departments,roles,nipEmail} from './organization.js';

export function validateAssignment(input) {
  if(!input||typeof input!=='object')throw new HttpsError('invalid-argument','Data pengguna wajib diisi.');
  const {name,nip,role,departmentId,subdepartmentId}=input;
  if(typeof name!=='string'||name.trim().length<2||name.length>150)throw new HttpsError('invalid-argument','Nama harus 2–150 karakter.');
  if(typeof nip!=='string'||!/^\d{18}$/.test(nip))throw new HttpsError('invalid-argument','NIP harus 18 digit.');
  const department=departments.find(d=>d.id===departmentId);
  if(!roles.includes(role)||!department)throw new HttpsError('invalid-argument','Jabatan atau bagian tidak valid.');
  if(role==='kepala_bagian'&&subdepartmentId!==null)throw new HttpsError('invalid-argument','Kepala Bagian ditugaskan pada bagian, tanpa subbagian.');
  if(role!=='kepala_bagian'&&!department.subdepartments.some(s=>s.id===subdepartmentId))throw new HttpsError('invalid-argument','Subbagian harus berada di bawah bagian yang dipilih.');
  return {name:name.trim(),nip,role,departmentId,subdepartmentId};
}
function passwordValid(value) {
  return typeof value==='string'&&value.length>=12&&value.length<=128&&/[a-z]/.test(value)&&/[A-Z]/.test(value)&&/\d/.test(value);
}
export function createUserService({auth,db,initialPassword,fieldValue=FieldValue}) {
  async function ownProfile(request,{ready=true}={}) {
    if(!request.auth)throw new HttpsError('unauthenticated','Silakan masuk.');
    const snapshot=await db.collection('users').doc(request.auth.uid).get();
    const profile=snapshot.data();
    if(!profile||profile.active!==true||request.auth.token.sessionVersion!==profile.sessionVersion)throw new HttpsError('permission-denied','Sesi atau profil tidak valid. Silakan masuk kembali.');
    if(ready&&profile.mustChangePassword!==false)throw new HttpsError('failed-precondition','Ganti password awal terlebih dahulu.');
    return {profile,ref:snapshot.ref};
  }
  async function requireAdmin(request){const value=await ownProfile(request);if(value.profile.isAdmin!==true)throw new HttpsError('permission-denied','Hanya administrator yang dapat mengelola akun.');return value;}
  return {
    async createManagedUser(request) {
      await requireAdmin(request);
      const data=validateAssignment(request.data);
      const password=initialPassword();
      if(!passwordValid(password))throw new HttpsError('failed-precondition','Password awal belum dikonfigurasi pengelola.');
      const uid=`nip_${data.nip}`;
      let created=false,profileCreated=false;
      try {
        // Disabled until both profile and claims are ready. Deterministic UID prevents duplicate NIPs.
        await auth.createUser({uid,email:nipEmail(data.nip),password,displayName:data.name,disabled:true});created=true;
        const sessionVersion=randomUUID();
        await auth.setCustomUserClaims(uid,{sessionVersion});
        await db.collection('users').doc(uid).create({...data,uid,isAdmin:false,active:true,mustChangePassword:true,sessionVersion,createdAt:fieldValue.serverTimestamp(),createdBy:request.auth.uid});
        profileCreated=true;
        await auth.updateUser(uid,{disabled:false});
        return {uid};
      }catch(e){
        if(created){await auth.deleteUser(uid).catch(()=>{});if(profileCreated)await db.collection('users').doc(uid).delete().catch(()=>{});}
        if(['auth/uid-already-exists','auth/email-already-exists'].includes(e.code))throw new HttpsError('already-exists','NIP sudah terdaftar.');
        throw new HttpsError('internal','Akun belum berhasil dibuat. Silakan coba kembali.');
      }
    },
    async updateManagedUser(request) {
      await requireAdmin(request);
      const data=validateAssignment(request.data);
      const uid=request.data.uid;
      if(typeof uid!=='string'||uid!==`nip_${data.nip}`)throw new HttpsError('invalid-argument','NIP akun tidak dapat diubah.');
      const ref=db.collection('users').doc(uid);
      await db.runTransaction(async transaction=>{
        const current=await transaction.get(ref);
        if(!current.exists)throw new HttpsError('not-found','Pengguna tidak ditemukan.');
        transaction.update(ref,{...data,updatedAt:fieldValue.serverTimestamp(),updatedBy:request.auth.uid});
      });
      // Firestore profile is authoritative; displayName is cosmetic.
      await auth.updateUser(uid,{displayName:data.name}).catch(()=>{});
      return {uid};
    },
    async completeInitialPasswordChange(request) {
      const {ref,profile:initialProfile}=await ownProfile(request,{ready:false});
      const password=request.data?.password;
      if(!passwordValid(password)||password===initialPassword())throw new HttpsError('invalid-argument','Gunakan password baru 12–128 karakter, dengan huruf besar, huruf kecil dan angka; berbeda dari password awal.');
      // Serialize cross-service password changes. Failures keep the access gate closed.
      const operation=randomUUID();
      await db.runTransaction(async transaction=>{
        const snapshot=await transaction.get(ref),profile=snapshot.data();
        if(!profile?.mustChangePassword)throw new HttpsError('failed-precondition','Password awal sudah diganti.');
        if(profile.passwordChangeLockAt&&Date.now()-profile.passwordChangeLockAt.toMillis()<300000)throw new HttpsError('aborted','Perubahan password sedang diproses. Coba lagi nanti.');
        transaction.update(ref,{passwordChangeOperation:operation,passwordChangeLockAt:fieldValue.serverTimestamp()});
      });
      try {
        const uid=request.auth.uid;
        await auth.updateUser(uid,{password});
        const user=await auth.getUser(uid),sessionVersion=randomUUID();
        await auth.setCustomUserClaims(uid,{...user.customClaims,sessionVersion});
        await auth.revokeRefreshTokens(uid);
        await ref.update({mustChangePassword:false,sessionVersion,passwordChangedAt:fieldValue.serverTimestamp(),passwordChangeOperation:fieldValue.delete(),passwordChangeLockAt:fieldValue.delete()});
        return {requiresLogin:true};
      }catch(_){
        // Restore the onboarding session version if cross-service completion failed.
        // The password may already be updated, so the user retries with the latest password.
        const latest=await ref.get().catch(()=>null);
        if(latest?.data()?.mustChangePassword===true){
          const user=await auth.getUser(request.auth.uid).catch(()=>null);
          if(user)await auth.setCustomUserClaims(user.uid,{...user.customClaims,sessionVersion:initialProfile.sessionVersion}).catch(()=>{});
        }
        await ref.update({passwordChangeLockAt:fieldValue.delete(),passwordChangeOperation:fieldValue.delete()}).catch(()=>{});
        throw new HttpsError('internal','Perubahan belum selesai. Masuk kembali menggunakan password terbaru, lalu coba kembali bila masih diminta.');
      }
    },
  };
}
