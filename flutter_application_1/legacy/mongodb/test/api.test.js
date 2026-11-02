import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {MongoClient} from 'mongodb';
import request from 'supertest';
import {createApp} from '../src/app.js';
import {hashPassword} from '../src/auth.js';
import {emptyState} from '../src/schema.js';
let mongo,client,app,db,token;
before(async()=>{
  mongo=await MongoMemoryServer.create();client=new MongoClient(mongo.getUri());await client.connect();db=client.db('test');
  app=await createApp(db,{origins:['http://localhost:8080']});
  await db.collection('users').insertOne({email:'admin@example.com',passwordHash:await hashPassword('test-password-123!'),role:'admin'});
  const result=await request(app).post('/api/auth/login').send({email:'admin@example.com',password:'test-password-123!'}).expect(200);token=result.body.token;
});
after(async()=>{await client?.close();await mongo?.stop();});
const auth = () => `Bearer ${token}`;
test('unauthenticated writes and incorrect login are rejected',async()=>{
  await request(app).put('/api/workspace').send({revision:0,data:emptyState()}).expect(401);
  await request(app).post('/api/auth/login').send({email:'admin@example.com',password:'wrong'}).expect(401);
});
test('workspace persists in MongoDB and rejects concurrent stale writes',async()=>{
  const first=await request(app).get('/api/workspace').set('Authorization',auth()).expect(200);
  const data=first.body.data;data.employees.push({name:'Test User',nip:'123456789012345678',division:'Hukum & SDM'});
  await request(app).put('/api/workspace').set('Authorization',auth()).send({revision:first.body.revision,data}).expect(200);
  await request(app).put('/api/workspace').set('Authorization',auth()).send({revision:first.body.revision,data:emptyState()}).expect(409);
  assert.equal((await db.collection('workspaces').findOne({_id:'demo-admin'})).data.employees[0].name,'Test User');
  const restarted=await createApp(db);const saved=await request(restarted).get('/api/workspace').set('Authorization',auth()).expect(200);
  assert.equal(saved.body.data.employees.length,1);
});
test('validates coordinate pairs, duplicate NIP and invalid dates',async()=>{
  const data=emptyState();data.latitude=1;
  await request(app).put('/api/workspace').set('Authorization',auth()).send({revision:1,data}).expect(400);
  data.latitude=null;data.requests.push({name:'Pegawai',type:'Izin',reason:'Test',date:'2026-02-31',status:'Menunggu'});
  await request(app).put('/api/workspace').set('Authorization',auth()).send({revision:1,data}).expect(400);
  data.requests=[];const e={name:'Test',nip:'123456789012345678',division:'SDM'};data.employees=[e,e];
  await request(app).put('/api/workspace').set('Authorization',auth()).send({revision:1,data}).expect(400);
});
test('logout invalidates the token',async()=>{
  await request(app).post('/api/auth/logout').set('Authorization',auth()).expect(204);
  await request(app).get('/api/workspace').set('Authorization',auth()).expect(401);
});
