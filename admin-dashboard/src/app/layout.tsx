import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AdminShell from '@/components/AdminShell';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sistem Presensi KPU Sulawesi Utara — Portal Administrator',
  description:
    'Portal kendali kehadiran pegawai, verifikasi geofencing, persetujuan izin & cuti, dan kalkulasi tunjangan kinerja KPU Provinsi Sulawesi Utara.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${jetBrainsMono.variable}`}>
      <body className="min-h-screen bg-[#F6F7F9] text-slate-900 font-sans antialiased">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
