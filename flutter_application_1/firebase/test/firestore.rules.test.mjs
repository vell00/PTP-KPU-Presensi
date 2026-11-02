import {readFile} from 'node:fs/promises';
import {before,after,beforeEach,test} from 'node:test';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';
let env;
before(async()=>{
  env=await initializeTestEnvironment({projectId:'demo-hadir-kpu',firestore:{host:'127.0.0.1',port:8085,rules:await readFile(new URL('../../firestore.rules',import.meta.url),'utf8')}});
});
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async ctx=>{
 for(const [uid,isAdmin,mustChangePassword] of [['admin-user',true,false],['employee',false,false],['new-user',true,true]])await setDoc(doc(ctx.firestore(),`users/${uid}`),{isAdmin,mustChangePassword,active:true,sessionVersion:'v1'});
});});
after(async()=>env?.cleanup());
const state=()=>({records:[],requests:[],employees:[],fridayWfh:true,latitude:null,longitude:null,radius:100});
const payload=(revision=1)=>({revision,data:state(),updatedAt:serverTimestamp(),updatedBy:'admin-user'});
const ref=ctx=>doc(ctx.firestore(),'workspaces/kpu-sulut');
const admin=()=>env.authenticatedContext('admin-user',{sessionVersion:'v1'});
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
test('users cannot grant themselves admin access through Firestore',async()=>{
  const db=env.authenticatedContext('employee').firestore();
  await assertFails(setDoc(doc(db,'users/employee'),{admin:true}));
  await assertFails(setDoc(doc(db,'workspaces/other'),payload()));
});

test('onboarding and stale tokens cannot bypass the gate; employee data is isolated',async()=>{
 for(const ctx of [env.authenticatedContext('new-user',{sessionVersion:'v1'}),env.authenticatedContext('admin-user',{sessionVersion:'old'})]) await assertFails(getDoc(ref(ctx)));
 const ctx=env.authenticatedContext('employee',{sessionVersion:'v1'});
 await assertSucceeds(getDoc(doc(ctx.firestore(),'employeeWorkspaces/employee')));
 await assertFails(getDoc(doc(ctx.firestore(),'employeeWorkspaces/other')));
 await assertFails(setDoc(doc(ctx.firestore(),'users/employee'),{mustChangePassword:false,isAdmin:true}));
});
