import {MongoClient} from 'mongodb';
import {createApp} from './app.js';
if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI wajib diisi di server/.env');
const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});
try {
  await client.connect();
  const app=await createApp(client.db(process.env.MONGODB_DATABASE??'hadir_kpu'),{origins:(process.env.CORS_ORIGINS??'').split(',').map(s=>s.trim()).filter(Boolean)});
  const server=app.listen(Number(process.env.PORT??3000),process.env.HOST??'127.0.0.1',()=>console.log('Hadir API aktif; koneksi MongoDB berhasil.'));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await client.close();process.exit(0);}));
}catch {console.error('Backend gagal dimulai. Periksa konfigurasi dan akses MongoDB.');await client.close();process.exitCode=1;}
