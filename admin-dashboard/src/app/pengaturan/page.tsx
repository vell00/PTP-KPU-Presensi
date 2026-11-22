'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { ALL_SUBDEPARTMENTS, WFH_DAYS } from '@/lib/constants';
import { WfhSchedule } from '@/types';
import { MapPin, Calendar, Save, AlertTriangle, CheckCircle2, Crosshair, Building2 } from 'lucide-react';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm animate-pulse">
      Memuat Peta Interaktif...
    </div>
  ),
});

export default function PengaturanPage() {
  const { data, updateSettings } = useWorkspace();

  const [latitude, setLatitude] = useState(data.latitude?.toString() ?? '1.4748');
  const [longitude, setLongitude] = useState(data.longitude?.toString() ?? '124.8421');
  const [radius, setRadius] = useState(data.radius.toString());
  const [wfhSchedule, setWfhSchedule] = useState<WfhSchedule>(() => {
    return data.wfhSchedule || {};
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleMapChange = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Browser Anda tidak mendukung geolokasi GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setErrorMsg('');
      },
      (err) => {
        setErrorMsg(`Gagal mendeteksi lokasi GPS: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const toggleDayForSubdept = (subdeptId: string, day: string) => {
    setWfhSchedule((prev) => {
      const currentDays = prev[subdeptId] || [];
      const updated = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];
      return {
        ...prev,
        [subdeptId]: updated,
      };
    });
  };

  const setAllDefaultSchedule = () => {
    const updated: WfhSchedule = {};
    ALL_SUBDEPARTMENTS.forEach((s) => {
      updated[s.id] = ['Selasa', 'Jumat'];
    });
    setWfhSchedule(updated);
  };

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
      wfhSchedule,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <>
      <Topbar title="Pengaturan Lokasi Kantor & Jadwal WFH" />
      <main className="p-4 sm:p-8 space-y-6 max-w-5xl">
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Pengaturan lokasi kantor dan jadwal WFH berhasil disimpan ke database!</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm font-semibold text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card Lokasi Kantor */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Titik Geofencing Kantor KPU</h3>
                  <p className="text-xs text-slate-500">
                    Klik pada peta atau geser pin marker untuk menentukan titik pusat radius geofencing kantor
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
              >
                <Crosshair className="w-3.5 h-3.5 text-teal-600" />
                <span>Gunakan Lokasi Saya Sekarang</span>
              </button>
            </div>

            <LocationPicker
              lat={parseFloat(latitude)}
              lng={parseFloat(longitude)}
              radius={parseFloat(radius) || 100}
              onChange={handleMapChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
                Standar: 100 meter dari titik koordinat kantor.
              </p>
            </div>
          </div>

          {/* Card Kebijakan WFH per Subbagian */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Jadwal WFH per Subbagian</h3>
                  <p className="text-xs text-slate-500">
                    Tentukan hari pelaksanaan Work From Home (WFH) untuk setiap subbagian (Selasa & Jumat)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={setAllDefaultSchedule}
                className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors"
              >
                Set Semua: Selasa & Jumat
              </button>
            </div>

            <div className="space-y-4">
              {ALL_SUBDEPARTMENTS.map((subdept) => {
                const activeDays = wfhSchedule[subdept.id] || [];
                return (
                  <div
                    key={subdept.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-800">
                          {subdept.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {subdept.departmentName}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {WFH_DAYS.map((day) => {
                        const isChecked = activeDays.includes(day);
                        const isRecommend = day === 'Selasa' || day === 'Jumat';
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => toggleDayForSubdept(subdept.id, day)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isChecked
                                ? 'bg-teal-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {day} {isRecommend && !isChecked ? '★' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
