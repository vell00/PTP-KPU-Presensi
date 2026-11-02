import {z} from 'zod';
const name = z.string().trim().min(1).max(150);
const wallTime = z.string().datetime({local:true}).refine(v => Number.isFinite(Date.parse(v)));
const record = z.object({name, division:name, mode:z.enum(['WFO','WFH']), entered:wallTime, exited:wallTime.nullable()}).strict().refine(r => !r.exited || r.exited >= r.entered, 'Waktu keluar mendahului masuk');
const leave = z.object({name, type:z.enum(['Izin','Cuti tahunan','Sakit']), reason:z.string().trim().min(1).max(2000), date:z.iso.date(), status:z.enum(['Menunggu','Disetujui','Ditolak'])}).strict();
export const stateSchema = z.object({
  records:z.array(record).max(5000), requests:z.array(leave).max(2000),
  employees:z.array(z.object({name, nip:z.string().regex(/^\d{18}$/), division:name}).strict()).max(1000),
  fridayWfh:z.boolean(), latitude:z.number().min(-90).max(90).nullable(), longitude:z.number().min(-180).max(180).nullable(), radius:z.number().min(50).max(1000)
}).strict().refine(s => (s.latitude === null) === (s.longitude === null), 'Koordinat harus lengkap').refine(s => new Set(s.employees.map(e=>e.nip)).size === s.employees.length, 'NIP duplikat');
export const writeSchema = z.object({revision:z.number().int().nonnegative(), data:stateSchema}).strict();
export const loginSchema = z.object({email:z.email().max(254), password:z.string().min(1).max(256)}).strict();
export const emptyState = () => ({records:[],requests:[],employees:[],fridayWfh:true,latitude:null,longitude:null,radius:100});
