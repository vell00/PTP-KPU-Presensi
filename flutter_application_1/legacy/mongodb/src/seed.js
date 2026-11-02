import {MongoClient} from 'mongodb';
import {hashPassword} from './auth.js';
import {loginSchema} from './schema.js';
const parsed=loginSchema.safeParse({email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD});
if(!parsed.success||parsed.data.password.length<12||!process.env.MONGODB_URI)throw new Error('Isi MONGODB_URI, ADMIN_EMAIL, dan ADMIN_PASSWORD minimal 12 karakter di .env.');
const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});
try{
  await client.connect();const users=client.db(process.env.MONGODB_DATABASE??'hadir_kpu').collection('users');
  await users.createIndex({email:1},{unique:true});
  await users.insertOne({email:parsed.data.email.toLowerCase(),passwordHash:await hashPassword(parsed.data.password),role:'admin',createdAt:new Date()});
  console.log('Akun admin dibuat.');
}catch(e){console.error(e.code===11000?'Admin sudah terdaftar; password tidak diubah.':'Gagal membuat admin. Periksa konfigurasi MongoDB.');process.exitCode=1;}finally{await client.close();}
