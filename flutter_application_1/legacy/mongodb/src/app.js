import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {rateLimit} from 'express-rate-limit';
import {loginSchema,writeSchema,emptyState} from './schema.js';
import {verifyPassword,hashPassword,tokenHash,newToken} from './auth.js';

export async function createApp(db, {origins=[]}={}) {
  const users=db.collection('users'), sessions=db.collection('sessions'), workspaces=db.collection('workspaces');
  await users.createIndex({email:1},{unique:true});
  await sessions.createIndex({expiresAt:1},{expireAfterSeconds:0});
  await workspaces.updateOne({_id:'demo-admin'},{$setOnInsert:{revision:0,data:emptyState(),updatedAt:new Date()}},{upsert:true});
  const dummyHash=await hashPassword(newToken());
  const app=express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({origin(origin,cb){cb(null,!origin||origins.includes(origin));}}));
  app.use(express.json({limit:'4mb'}));
  app.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
  app.get('/health',async(_req,res)=>{await db.command({ping:1});res.json({status:'ok'});});
  app.post('/api/auth/login',rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Terlalu banyak percobaan login. Coba lagi nanti.'}}),async(req,res)=>{
    const input=loginSchema.safeParse(req.body);
    if(!input.success)return res.status(400).json({error:'Email/password tidak valid.'});
    const user=await users.findOne({email:input.data.email.toLowerCase()});
    const valid=await verifyPassword(input.data.password,user?.passwordHash??dummyHash);
    if(!valid||!user||user.role!=='admin')return res.status(401).json({error:'Email atau password salah.'});
    const token=newToken(), expiresAt=new Date(Date.now()+8*60*60*1000);
    await sessions.insertOne({_id:tokenHash(token),userId:user._id,expiresAt});
    res.json({token,expiresAt,role:'admin'});
  });
  app.use('/api',async(req,res,next)=>{
    const match=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.get('Authorization')??'');
    if(!match)return res.status(401).json({error:'Silakan login.'});
    const session=await sessions.findOne({_id:tokenHash(match[1]),expiresAt:{$gt:new Date()}});
    if(!session)return res.status(401).json({error:'Sesi berakhir. Silakan login ulang.'});
    const user=await users.findOne({_id:session.userId,role:'admin'});
    if(!user)return res.status(403).json({error:'Akses admin diperlukan.'});
    req.sessionId=session._id;req.userId=user._id;next();
  });
  app.post('/api/auth/logout',async(req,res)=>{await sessions.deleteOne({_id:req.sessionId});res.sendStatus(204);});
  app.get('/api/workspace',async(_req,res)=>{
    const doc=await workspaces.findOne({_id:'demo-admin'});
    res.json({revision:doc.revision,data:doc.data});
  });
  app.put('/api/workspace',async(req,res)=>{
    const input=writeSchema.safeParse(req.body);
    if(!input.success)return res.status(400).json({error:'Data tidak valid.',issues:input.error.issues.map(i=>({path:i.path,message:i.message}))});
    const {revision,data}=input.data;
    const result=await workspaces.updateOne({_id:'demo-admin',revision},{$set:{data,updatedAt:new Date(),updatedBy:req.userId},$inc:{revision:1}});
    if(!result.matchedCount)return res.status(409).json({error:'Data telah berubah di perangkat lain. Muat ulang sebelum menyimpan.'});
    res.json({revision:revision+1,data});
  });
  app.use((_req,res)=>res.status(404).json({error:'Endpoint tidak ditemukan.'}));
  app.use((err,_req,res,_next)=>{
    const status=err.status===413?413:err.type==='entity.parse.failed'?400:500;
    res.status(status).json({error:status===413?'Ukuran data terlalu besar.':status===400?'JSON tidak valid.':'Layanan database tidak tersedia. Coba lagi.'});
  });
  return app;
}
