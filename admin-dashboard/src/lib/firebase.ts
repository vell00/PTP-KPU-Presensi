import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, onSnapshot, query, orderBy, DocumentData } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inisialisasi Firebase App (singleton aman untuk Next.js)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export interface PresensiItem {
  id: string;
  userId?: string;
  email?: string;
  nip?: string;
  nama?: string;
  waktu?: any;
  latitude?: number;
  longitude?: number;
  status?: string;
  tipe?: string;
}

// Fungsi untuk membaca seluruh data presensi sekali panggil
export async function ambilDataPresensi(): Promise<PresensiItem[]> {
  try {
    const colRef = collection(db, "presensi");
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PresensiItem[];
  } catch (error) {
    console.error("Gagal mengambil data presensi:", error);
    return [];
  }
}

// Fungsi listener Realtime: Dashboard update otomatis saat pegawai absen
export function subscribePresensi(callback: (items: PresensiItem[]) => void) {
  const colRef = collection(db, "presensi");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PresensiItem[];
      callback(items);
    },
    (error) => {
      console.error("Error realtime presensi:", error);
    }
  );
}
