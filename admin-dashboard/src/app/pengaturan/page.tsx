'use client';

import React, { useState } from 'react';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { MapPin, Navigation, Save, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PengaturanPage() {
  const { data, updateSettings } = useWorkspace();

  const [latitude, setLatitude] = useState(data.latitude?.toString() ?? '1.4748');
  const [longitude, setLongitude] = useState(data.longitude?.toString() ?? '124.8421');
  const [radius, setRadius] = useState(data.radius.toString());
  const [fridayWfh, setFridayWfh] = useState(data.fridayWfh);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSavedSuccess(false);

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    const radNum = parseFloat(radius);

    if (isNaN(latNum) || isNaN(lngNum)) {
      setErrorMsg('Latitude dan Longitude harus berupa angka desimal yang valid.');
      return;
    }
    if (isNaN(radNum) || radNum <= 0) {
      setErrorMsg('Radius kantor harus lebih besar dari 0 meter.');
      return;
    }

    updateSettings({
      latitude: latNum,
      longitude: lngNum,
      radius: radNum,
      fridayWfh,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <>
      <Topbar title="Pengaturan Lokasi Kantor & Kebijakan" />
      <main className="p-8 space-y-6 max-w-4xl">
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Pengaturan lokasi kantor dan kebijakan presensi berhasil disimpan!</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm font-semibold text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card Lokasi Kantor */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Titik Geolocation Kantor KPU</h3>
                <p className="text-xs text-slate-500">
                  Koordinat resmi yang menjadi acuan validasi jarak presensi WFO di aplikasi mobile pegawai
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Latitude *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1.4748"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Longitude *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 124.8421"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Radius Toleransi Presensi (Meter) *
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                required
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full max-w-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Standar: 100 meter dari titik koordinat kantor. Jika pegawai berada di luar radius ini, presensi WFO otomatis ditolak.
              </p>
            </div>
          </div>

          {/* Card Kebijakan WFH */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Kebijakan Presensi & Jadwal</h3>
                <p className="text-xs text-slate-500">
                  Aturan hari kerja dan hak Work From Home (WFH)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <input
                type="checkbox"
                id="fridayWfh"
                checked={fridayWfh}
                onChange={(e) => setFridayWfh(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="fridayWfh" className="text-sm cursor-pointer">
                <span className="font-bold text-slate-900 block">
                  Aktifkan Opsi WFH Khusus Hari Jumat
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Pegawai yang memenuhi syarat diizinkan memilih mode presensi WFH pada hari Jumat sesuai aturan internal.
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
