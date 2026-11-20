import './globals.css';
import type { Metadata } from 'next';
import { WorkspaceProvider } from '@/lib/store';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Admin Portal • Hadir KPU Sulawesi Utara',
  description: 'Sistem Administrasi Presensi KPU Sulawesi Utara',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="flex min-h-screen bg-[#F8FAF9] antialiased">
        <WorkspaceProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
            {children}
          </div>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
