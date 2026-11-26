'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

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
  configured: boolean;
  login: (nip: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const isActive = data.active !== false;
            const isAdmin = data.isAdmin === true || data.role === 'admin';
            if (isActive && isAdmin) {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                nip: data.nip || '',
                name: data.name || 'Administrator',
                role: data.role || 'admin',
                isAdmin: true,
              });
            } else {
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
    if (!isFirebaseConfigured) {
      return {
        success: false,
        error:
          'Konfigurasi Firebase (.env.local) belum diatur. Hubungi pengelola sistem untuk melengkapi kredensial proyek.',
      };
    }

    try {
      const cleanNip = nip.trim();
      if (!/^\d{18}$/.test(cleanNip)) {
        return { success: false, error: 'NIP wajib terdiri dari tepat 18 digit angka.' };
      }

      // Primary domain matches Flutter & Cloud Functions; fallback supports legacy admin accounts
      const primaryEmail = `${cleanNip}@nip.hadir.invalid`;
      const legacyEmail = `${cleanNip}@kpu.go.id`;

      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, primaryEmail, password);
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (
          code === 'auth/user-not-found' ||
          code === 'auth/invalid-credential' ||
          code === 'auth/invalid-email'
        ) {
          credential = await signInWithEmailAndPassword(auth, legacyEmail, password);
        } else {
          throw err;
        }
      }

      await credential.user.getIdTokenResult(true);
      const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
      if (!userDoc.exists()) {
        await firebaseSignOut(auth);
        return { success: false, error: 'Profil pengguna tidak ditemukan di database.' };
      }

      const userData = userDoc.data();
      if (userData.active === false) {
        await firebaseSignOut(auth);
        return {
          success: false,
          error: 'Akun Anda sedang dinonaktifkan. Hubungi Administrator Utama Sekretariat.',
        };
      }
      if (userData.isAdmin !== true && userData.role !== 'admin') {
        await firebaseSignOut(auth);
        return {
          success: false,
          error:
            'Akses ditolak. Akun Pegawai hanya dapat masuk melalui aplikasi mobile Presensi KPU Sulut.',
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
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      let msg = 'Gagal masuk ke portal administrator.';
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          msg = 'NIP atau kata sandi tidak cocok.';
          break;
        case 'auth/user-disabled':
          msg = 'Akun dinonaktifkan oleh pengelola sistem.';
          break;
        case 'auth/too-many-requests':
          msg = 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa menit sebelum mencoba lagi.';
          break;
        case 'auth/network-request-failed':
          msg = 'Tidak dapat terhubung ke server autentikasi. Periksa koneksi internet Anda.';
          break;
        default:
          msg = err.message || msg;
          break;
      }
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, configured: isFirebaseConfigured, login, logout }}>
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
