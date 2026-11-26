'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Topbar from '@/components/Topbar';
import { useWorkspace } from '@/lib/store';
import { useFeedback } from '@/components/FeedbackProvider';
import { ALL_SUBDEPARTMENTS, WFH_DAYS } from '@/lib/constants';
import { HolidayItem, WfhSchedule, WorkHoursPolicy } from '@/types';
import {
  MapPin,
  Calendar,
  Save,
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Clock,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 text-sm animate-pulse">
      Memuat Peta Geofencing...
    </div>
  ),
});

export default function PengaturanPage() {
  const { data, isLoaded, updateSettings } = useWorkspace();
  const { showToast } = useFeedback();

  const [latitude, setLatitude] = useState('1.4748');
  const [longitude, setLongitude] = useState('124.8421');
  const [radius, setRadius] = useState('100');
  const [wfhSchedule, setWfhSchedule] = useState<WfhSchedule>({});
  const [workHours, setWorkHours] = useState<WorkHoursPolicy>(data.workHours);
  const [holidays, setHolidays] = useState<HolidayItem[]>(data.holidays);

  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form state whenever Firestore finishes loading (unless user has unsaved edits)
  useEffect(() => {
    if (!isLoaded || isDirty) return;
    setLatitude(data.latitude?.toString() ?? '1.4748');
    setLongitude(data.longitude?.toString() ?? '124.8421');
    setRadius(data.radius.toString());
    setWfhSchedule(data.wfhSchedule || {});
    setWorkHours(data.workHours);
    setHolidays(data.holidays || []);
  }, [data, isLoaded, isDirty]);

  const markDirty = () => {
    setIsDirty(true);
    setSavedSuccess(false);
  };

  const handleResetDraft = () => {
    setLatitude(data.latitude?.toString() ?? '1.4748');
    setLongitude(data.longitude?.toString() ?? '124.8421');
    setRadius(data.radius.toString());
    setWfhSchedule(data.wfhSchedule || {});
    setWorkHours(data.workHours);
    setHolidays(data.holidays || []);
    setIsDirty(false);
    setErrorMsg('');
    showToast('info', 'Perubahan Dibatalkan', 'Pengaturan dikembalikan sesuai data terakhir di server.');
  };

  const handleMapChange = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    markDirty();
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
        markDirty();
      },
      (err) => setErrorMsg(`Gagal mendeteksi lokasi GPS: ${err.message}`),
      { enableHighAccuracy: true }
    );
  };

  const toggleDayForSubdept = (subdeptId: string, day: string) => {
    setWfhSchedule((prev) => {
      const currentDays = prev[subdeptId] || [];
      const updated = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];
      return { ...prev, [subdeptId]: updated };
    });
    markDirty();
  };

  const setAllDefaultSchedule = () => {
    const updated: WfhSchedule = {};
    ALL_SUBDEPARTMENTS.forEach((s) => {
      updated[s.id] = ['Selasa', 'Jumat'];
    });
    setWfhSchedule(updated);
    markDirty();
    showToast('info', 'Jadwal WFH Diatur', 'Seluruh subbagian diatur Selasa & Jumat. Klik Simpan untuk menerapkan.');
  };

  const handleAddHoliday = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newHolidayDate) || newHolidayName.trim().length < 2) {
      showToast('warning', 'Input Belum Lengkap', 'Pilih tanggal dan isi nama hari libur nasional.');
      return;
    }
    if (holidays.some((h) => h.date === newHolidayDate)) {
      showToast('warning', 'Tanggal Duplikat', 'Tanggal hari libur tersebut sudah ada di daftar.');
      return;
    }
    setHolidays((prev) =>
      [...prev, { date: newHolidayDate, name: newHolidayName.trim() }].sort((a, b) =>
        a.date.localeCompare(b.date)
      )
    );
    setNewHolidayDate('');
    setNewHolidayName('');
    markDirty();
  };

  const handleRemoveHoliday = (date: string) => {
    setHolidays((prev) => prev.filter((h) => h.date !== date));
    markDirty();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSavedSuccess(false);

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    const radNum = parseFloat(radius);

    if (Number.isNaN(latNum) || Number.isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setErrorMsg('Latitude (-90 s.d. 90) dan Longitude (-180 s.d. 180) harus valid.');
      return;
    }
    if (Number.isNaN(radNum) || radNum < 25 || radNum > 1000) {
      setErrorMsg('Radius geofencing harus antara 25 hingga 1000 meter.');
      return;
    }

    setIsSaving(true);
    const res = await updateSettings({
      latitude: latNum,
      longitude: lngNum,
      radius: radNum,
      wfhSchedule,
      workHours,
      holidays,
    });
    setIsSaving(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Gagal menyimpan pengaturan ke Firestore.');
      showToast('error', 'Penyimpanan Gagal', res.message);
      return;
    }

    setIsDirty(false);
    setSavedSuccess(true);
    showToast('success', 'Pengaturan Disimpan', 'Kebijakan kantor, WFH, jam kerja & hari libur diperbarui.');
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <>
      <Topbar title="Pengaturan Kantor & Kebijakan" />
      <main className="p-4 sm:p-6 xl:p-8 space-y-6 w-full max-w-[1200px]">
        {savedSuccess && (
          <div
            role="status"
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm font-medium text-emerald-800"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Pengaturan geofencing, WFH, jam kerja, dan hari libur berhasil disimpan.</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm font-medium text-rose-800"
          >
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Geofencing Card */}
          <section className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#07142F] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Titik Geofencing Kantor KPU</h2>
                  <p className="text-xs text-slate-500">
                    Menjadi acuan verifikasi GPS server saat pegawai melakukan presensi WFO
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                <Crosshair className="w-3.5 h-3.5 text-[#D52832]" />
                <span>Gunakan Lokasi Saat Ini</span>
              </button>
            </div>

            <LocationPicker
              lat={parseFloat(latitude)}
              lng={parseFloat(longitude)}
              radius={parseFloat(radius) || 100}
              onChange={handleMapChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label htmlFor="geo-lat" className="block text-xs font-semibold text-slate-700 mb-1">
                  Latitude
                </label>
                <input
                  id="geo-lat"
                  type="text"
                  required
                  value={latitude}
                  onChange={(e) => {
                    setLatitude(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="geo-lng" className="block text-xs font-semibold text-slate-700 mb-1">
                  Longitude
                </label>
                <input
                  id="geo-lng"
                  type="text"
                  required
                  value={longitude}
                  onChange={(e) => {
                    setLongitude(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="geo-radius" className="block text-xs font-semibold text-slate-700 mb-1">
                  Radius WFO (25–1000 m)
                </label>
                <input
                  id="geo-radius"
                  type="number"
                  min={25}
                  max={1000}
                  required
                  value={radius}
                  onChange={(e) => {
                    setRadius(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tabular-nums"
                />
              </div>
            </div>
          </section>

          {/* 2. WFH Schedule Matrix */}
          <section className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Jadwal WFH per Subbagian</h2>
                  <p className="text-xs text-slate-500">
                    Disinkronkan langsung ke aplikasi pegawai dan verifikasi server presensi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={setAllDefaultSchedule}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
              >
                Atur Semua: Selasa &amp; Jumat
              </button>
            </div>

            <div className="space-y-3">
              {ALL_SUBDEPARTMENTS.map((subdept) => {
                const activeDays = wfhSchedule[subdept.id] || [];
                return (
                  <div
                    key={subdept.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{subdept.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{subdept.departmentName}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {WFH_DAYS.map((day) => {
                        const checked = activeDays.includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            aria-pressed={checked}
                            onClick={() => toggleDayForSubdept(subdept.id, day)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              checked
                                ? 'bg-[#07142F] text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Work Hours Policy (WITA) */}
          <section className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#07142F] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Jam Kerja Operasional (WITA)</h2>
                <p className="text-xs text-slate-500">
                  Menentukan batas ketepatan masuk dan pulang cepat (Perpres 21/2023)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Masuk (WITA)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={5}
                    max={11}
                    value={workHours.startHour}
                    onChange={(e) => {
                      setWorkHours({ ...workHours, startHour: Number(e.target.value) });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tabular-nums"
                  />
                  <span>:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={workHours.startMinute}
                    onChange={(e) => {
                      setWorkHours({ ...workHours, startMinute: Number(e.target.value) });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pulang Senin–Kamis
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={13}
                    max={21}
                    value={workHours.endHourMonThu}
                    onChange={(e) => {
                      setWorkHours({ ...workHours, endHourMonThu: Number(e.target.value) });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tabular-nums"
                  />
                  <span>:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={workHours.endMinuteMonThu}
                    onChange={(e) => {
                      setWorkHours({ ...workHours, endMinuteMonThu: Number(e.target.value) });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pulang Hari Jumat
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={13}
                    max={21}
                    value={workHours.endHourFri}
                    onChange={(e) => {
                      setWorkHours({ ...workHours, endHourFri: Number(e.target.value) });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tabular-nums"
                  />
                  <span>:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={workHours.endMinuteFri}
                    onChange={(e) => {
                      setWorkHours({ ...workHours, endMinuteFri: Number(e.target.value) });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="wh-tol" className="block text-xs font-semibold text-slate-700 mb-1">
                  Toleransi Masuk (Menit)
                </label>
                <input
                  id="wh-tol"
                  type="number"
                  min={0}
                  max={60}
                  value={workHours.toleranceMinutes}
                  onChange={(e) => {
                    setWorkHours({ ...workHours, toleranceMinutes: Number(e.target.value) });
                    markDirty();
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tabular-nums"
                />
              </div>
            </div>
          </section>

          {/* 4. National Holidays & Cuti Bersama */}
          <section className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Kalender Hari Libur Nasional &amp; Cuti Bersama
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tanggal yang didaftarkan tidak dihitung sebagai Alpha pada Tukin dan menonaktifkan
                presensi harian
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="date"
                aria-label="Tanggal hari libur"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="text"
                aria-label="Nama hari libur"
                placeholder="Nama hari libur (misal: Hari Raya Idul Fitri)"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={handleAddHoliday}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#07142F] hover:bg-[#10244D] text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {holidays.map((h) => (
                <div
                  key={h.date}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 bg-white text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono tabular-nums font-semibold text-slate-800 shrink-0">
                      {h.date}
                    </span>
                    <span className="text-slate-700 truncate">{h.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveHoliday(h.date)}
                    aria-label={`Hapus ${h.name}`}
                    className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {holidays.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-500">
                  Belum ada daftar hari libur nasional yang dikonfigurasi.
                </p>
              )}
            </div>
          </section>

          {/* Sticky Save Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              {isDirty ? (
                <span className="text-amber-700 font-semibold">
                  Terdapat perubahan yang belum disimpan ke server.
                </span>
              ) : (
                <span>Seluruh pengaturan tersinkronisasi dengan Firestore.</span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {isDirty && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleResetDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Batalkan</span>
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D52832] hover:bg-[#B91C1C] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
