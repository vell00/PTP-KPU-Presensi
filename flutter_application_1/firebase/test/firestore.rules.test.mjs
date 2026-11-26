import {readFile} from 'node:fs/promises';
import {before,after,beforeEach,test} from 'node:test';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,updateDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';
let env;
before(async()=>{
  env=await initializeTestEnvironment({projectId:'demo-hadir-kpu',firestore:{host:'127.0.0.1',port:8085,rules:await readFile(new URL('../../firestore.rules',import.meta.url),'utf8')}});
});
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async ctx=>{
 for(const [uid,isAdmin,mustChangePassword] of [['admin-user',true,false],['employee',false,false],['other-emp',false,false],['new-user',true,true]]){
   await setDoc(doc(ctx.firestore(),`users/${uid}`),{isAdmin,mustChangePassword,active:true,sessionVersion:'v1',nip:'199001012020011001',name:uid});
 }
});});
after(async()=>env?.cleanup());
const state=()=>({records:[],requests:[],employees:[],fridayWfh:true,latitude:null,longitude:null,radius:100});
const payload=(revision=1)=>({revision,data:state(),updatedAt:serverTimestamp(),updatedBy:'admin-user'});
const ref=ctx=>doc(ctx.firestore(),'workspaces/kpu-sulut');
const admin=()=>env.authenticatedContext('admin-user',{sessionVersion:'v1'});
const emp=()=>env.authenticatedContext('employee',{sessionVersion:'v1'});

test('anonymous and ordinary users cannot read or write admin workspace',async()=>{
  for(const ctx of [env.unauthenticatedContext(),env.authenticatedContext('employee')]){
    await assertFails(getDoc(ref(ctx)));
    await assertFails(setDoc(ref(ctx),payload()));
  }
});
test('administrator may create and update with server timestamp and next revision',async()=>{
  const target=ref(admin());
  await assertSucceeds(setDoc(target,payload()));
  await assertSucceeds(getDoc(target));
  await assertSucceeds(setDoc(target,payload(2)));
  await assertFails(setDoc(target,payload(2)));
  await assertFails(deleteDoc(target));
});
test('rules reject forged author, client time and invalid office settings',async()=>{
  const target=ref(admin());
  await assertFails(setDoc(target,{...payload(),updatedBy:'another-user'}));
  await assertFails(setDoc(target,{...payload(),updatedAt:new Date(0)}));
  await assertFails(setDoc(target,{...payload(),data:{...state(),radius:0}}));
  await assertFails(setDoc(target,{...payload(),data:{...state(),latitude:1}}));
  await assertFails(setDoc(target,{...payload(),extra:'unexpected'}));
});
test('users cannot grant themselves admin access or touch userSecrets through Firestore',async()=>{
  const db=emp().firestore();
  await assertFails(setDoc(doc(db,'users/employee'),{admin:true}));
  await assertFails(setDoc(doc(db,'users/other-emp'),{nip:'199001012020011001',name:'Hack',role:'staff'}));
  await assertFails(getDoc(doc(db,'userSecrets/employee')));
  await assertFails(setDoc(doc(db,'userSecrets/employee'),{pinHash:'abc'}));
  await assertFails(setDoc(doc(db,'workspaces/other'),payload()));
});
test('onboarding and stale tokens cannot bypass the gate; employee data is isolated',async()=>{
  for(const ctx of [env.authenticatedContext('new-user',{sessionVersion:'v1'}),env.authenticatedContext('admin-user',{sessionVersion:'old'})]) await assertFails(getDoc(ref(ctx)));
  const ctx=emp();
  await assertSucceeds(getDoc(doc(ctx.firestore(),'employeeWorkspaces/employee')));
  await assertFails(getDoc(doc(ctx.firestore(),'employeeWorkspaces/other')));
  await assertFails(setDoc(doc(ctx.firestore(),'users/employee'),{mustChangePassword:false,isAdmin:true}));
});
test('presensi blocks direct client writes; requests enforce owner-create and admin-only review',async()=>{
  const empDb=emp().firestore();
  const admDb=admin().firestore();
  await assertFails(setDoc(doc(empDb,'presensi/employee_2026-11-26'),{uid:'employee',mode:'WFO'}));
  const reqPayload={
    uid:'employee',nip:'199001012020011001',name:'Pegawai Uji',unit:'Keuangan',
    type:'Cuti Tahunan',startDate:'2026-11-27',endDate:'2026-11-28',daysCount:2,
    reason:'Acara keluarga resmi',status:'Menunggu',createdAt:serverTimestamp(),
  };
  await assertSucceeds(setDoc(doc(empDb,'requests/req-1'),reqPayload));
  await assertFails(setDoc(doc(empDb,'requests/req-bad'),{...reqPayload,status:'Disetujui'}));
  await assertFails(updateDoc(doc(empDb,'requests/req-1'),{status:'Disetujui',reviewedBy:'employee',reviewedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(admDb,'requests/req-1'),{status:'Disetujui',reviewNote:'Disetujui Kasubag',reviewedBy:'admin-user',reviewedAt:serverTimestamp()}));
  await assertFails(deleteDoc(doc(admDb,'requests/req-1')));
});
