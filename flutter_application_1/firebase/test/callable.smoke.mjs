import assert from 'node:assert/strict';
const project='demo-hadir-kpu',nip='198001012005011001';
const login=async password=>{
 const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`${nip}@nip.hadir.invalid`,password,returnSecureToken:true})});
 assert.equal(response.ok,true);return (await response.json()).idToken;
};
const call=async(name,token,data)=>{
 const response=await fetch(`http://127.0.0.1:5001/${project}/asia-southeast2/${name}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({data})});
 return {status:response.status,body:await response.json()};
};
const assignment={name:'Akun Callable',nip:'199202022022021001',role:'staff',departmentId:'perencanaan_sdm',subdepartmentId:'perencanaan_data'};
const initial=await login('Demo-Hadir-123!');
assert.equal((await call('createManagedUser',initial,assignment)).body.error.status,'FAILED_PRECONDITION');
assert.equal((await call('completeInitialPasswordChange',initial,{password:'Admin-Pribadi-123!'})).status,200);
const fresh=await login('Admin-Pribadi-123!');
const created=await call('createManagedUser',fresh,assignment);
assert.equal(created.status,200,JSON.stringify(created.body));
assert.equal(created.body.result.uid,`nip_${assignment.nip}`);
assert.equal((await call('updateManagedUser',fresh,{...assignment,uid:created.body.result.uid,role:'kepala_sub_bagian'})).status,200);
console.log('Callable smoke passed: onboarding, NIP login, create and update user.');
