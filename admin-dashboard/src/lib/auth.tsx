'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AdminUser {
  uid: string;
  email: string;
  nip: string;
  name: string;
  role: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (nip: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpAdmin: (nip: string, name: string, unitJabatan: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek session tersimpan
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.isAdmin === true || data.role === 'admin') {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                nip: data.nip || '',
                name: data.name || 'Administrator',
                role: data.role || 'admin',
                isAdmin: true,
              });
            } else {
              // Bukan admin -> tolak akses portal admin
              await firebaseSignOut(auth);
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (nip: string, password: string) => {
    try {
      const cleanNip = nip.trim();
      const syntheticEmail = `${cleanNip}@kpu.go.id`;
      const fallbackEmail = `${cleanNip}@nip.hadir.invalid`;

      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, syntheticEmail, password);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
          // Coba fallback domain
          credential = await signInWithEmailAndPassword(auth, fallbackEmail, password);
        } else {
          throw err;
        }
      }

      // Verifikasi hak akses admin di Firestore
      const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
      if (!userDoc.exists()) {
        await firebaseSignOut(auth);
        return { success: false, error: 'Profil pengguna tidak ditemukan di database.' };
      }

      const userData = userDoc.data();
      if (userData.isAdmin !== true && userData.role !== 'admin') {
        await firebaseSignOut(auth);
        return {
          success: false,
          error: 'Akses ditolak. Akun Anda terdaftar sebagai Pegawai biasa dan tidak memiliki hak akses Administrator.',
        };
      }

      setUser({
        uid: credential.user.uid,
        email: credential.user.email || '',
        nip: userData.nip || cleanNip,
        name: userData.name || 'Administrator',
        role: userData.role || 'admin',
        isAdmin: true,
      });

      return { success: true };
    } catch (e: any) {
      let msg = 'Gagal masuk ke portal admin.';
      switch (e.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          msg = 'NIP atau kata sandi tidak cocok.';
          break;
        case 'auth/wrong-password':
          msg = 'Kata sandi yang Anda masukkan salah.';
          break;
        case 'auth/too-many-requests':
          msg = 'Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.';
          break;
        default:
          msg = e.message || msg;
          break;
      }
      return { success: false, error: msg };
    }
  };

  const signUpAdmin = async (nip: string, name: string, unitJabatan: string, password: string) => {
    try {
      const cleanNip = nip.trim();
      if (!/^[0-9]{18}$/.test(cleanNip)) {
        return { success: false, error: 'NIP wajib 18 digit angka.' };
      }
      if (password.length < 6) {
        return { success: false, error: 'Kata sandi minimal 6 karakter.' };
      }

      const email = `${cleanNip}@kpu.go.id`;
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Simpan ke collection 'users' dengan status isAdmin: true
      await setDoc(doc(db, 'users', cred.user.uid), {
        nip: cleanNip,
        name: name.trim(),
        password: password,
        pin: '123456', // default PIN presensi
        role: 'admin',
        departmentId: 'perencanaan_sdm',
        subdepartmentId: unitJabatan,
        active: true,
        isAdmin: true,
        mustChangePassword: false,
      });

      setUser({
        uid: cred.user.uid,
        email: email,
        nip: cleanNip,
        name: name.trim(),
        role: 'admin',
        isAdmin: true,
      });

      return { success: true };
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        return { success: false, error: 'NIP ini sudah terdaftar. Silakan langsung masuk.' };
      }
      return { success: false, error: e.message || 'Pendaftaran admin gagal.' };
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signUpAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AuthProvider');
  }
  return context;
}
