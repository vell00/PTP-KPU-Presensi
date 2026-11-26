import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import '../domain/attendance.dart';
import '../domain/work_policy.dart';
import '../data/presensi_sync_service.dart';
import '../../leave/presentation/leave_request_dialog.dart';
import 'widgets/attendance_flow_dialog.dart';
import 'widgets/change_pin_dialog.dart';
import 'work_duration.dart';

class EmployeeAttendancePage extends StatefulWidget {
  final AppStore store;
  final int page;
  final ValueChanged<int> onNavigate;
  final VoidCallback? onOpenAdmin;
  const EmployeeAttendancePage({
    super.key,
    required this.store,
    required this.page,
    required this.onNavigate,
    required this.onOpenAdmin,
  });
  @override
  State<EmployeeAttendancePage> createState() => _EmployeeAttendancePageState();
}

class _EmployeeAttendancePageState extends State<EmployeeAttendancePage> {
  AppStore get store => widget.store;
  bool busy = false;
  int? _filterDay;
  int? _filterMonth;
  int? _filterYear;
  bool get wfhEligible =>
      store.fridayWfh &&
      (!store.isRemote || store.currentUser?.subdepartmentId != null);
  DateTime get now => witaNow();
  Attendance? get today {
    final list = store.records.where((r) => dayKey(r.entered) == dayKey(now));
    return list.isEmpty ? null : list.first;
  }

  @override
  void initState() {
    super.initState();
    _restoreTodayAttendance();
  }

  /// Memulihkan riwayat presensi hari ini agar durasi jam kerja tidak hilang saat keluar aplikasi / logout
  Future<void> _restoreTodayAttendance() async {
    final nip = store.currentUser?.nip;
    if (nip == null || nip.isEmpty) return;
    final cacheKey = 'kpu_presensi_${nip}_${dayKey(now)}';

    // 1. Cek penyimpanan lokal SharedPreferences untuk respon cepat
    if (today == null) {
      final cached = store.prefs.getString(cacheKey);
      if (cached != null) {
        try {
          final map = jsonDecode(cached) as Map<String, dynamic>;
          final att = Attendance.fromJson(map);
          if (!store.records.any((r) => dayKey(r.entered) == dayKey(now))) {
            if (mounted) {
              setState(() {
                store.records.insert(0, att);
              });
            }
          }
        } catch (_) {}
      }
    }

    // 2. Sinkronkan dengan Firestore presensi secara cloud
    try {
      final remoteAtt = await PresensiSyncService.ambilPresensiHariIni(nip, now);
      if (remoteAtt != null && mounted) {
        final existingIndex = store.records.indexWhere((r) => dayKey(r.entered) == dayKey(now));
        if (existingIndex == -1) {
          setState(() {
            store.records.insert(0, remoteAtt);
          });
        } else {
          if (store.records[existingIndex].exited == null && remoteAtt.exited != null) {
            setState(() {
              store.records[existingIndex].exited = remoteAtt.exited;
            });
          }
        }
        await store.prefs.setString(cacheKey, jsonEncode(remoteAtt.toJson()));
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final wfh = WorkPolicy.isWfh(now, wfhEligible);
    final active = today;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        heading(
          widget.page == 1
              ? 'Riwayat Kehadiran'
              : 'Halo, ${store.currentUser?.name ?? 'Pegawai'}',
          '${store.currentUser?.unitName ?? 'KPU'} • KPU Sulawesi Utara',
        ),
        if (widget.page == 1) ...[
          Builder(
            builder: (context) {
              const monthNames = [
                'Januari',
                'Februari',
                'Maret',
                'April',
                'Mei',
                'Juni',
                'Juli',
                'Agustus',
                'September',
                'Oktober',
                'November',
                'Desember',
              ];
              final availableYears = <int>{
                witaNow().year,
                ...store.records.map((r) => r.entered.year),
              }.toList()
                ..sort((a, b) => b.compareTo(a));

              final filteredRecords = store.records.where((r) {
                if (_filterDay != null && r.entered.day != _filterDay) {
                  return false;
                }
                if (_filterMonth != null && r.entered.month != _filterMonth) {
                  return false;
                }
                if (_filterYear != null && r.entered.year != _filterYear) {
                  return false;
                }
                return true;
              }).toList()
                ..sort((a, b) => b.entered.compareTo(a.entered));

              final hasFilter =
                  _filterDay != null || _filterMonth != null || _filterYear != null;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  card(
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            text('Filter Riwayat Kehadiran', size: 13, weight: FontWeight.w700),
                            if (hasFilter)
                              TextButton.icon(
                                onPressed: () => setState(() {
                                  _filterDay = null;
                                  _filterMonth = null;
                                  _filterYear = null;
                                }),
                                icon: const Icon(Icons.close, size: 15),
                                label: const Text('Reset', style: TextStyle(fontSize: 12)),
                              ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            SizedBox(
                              width: 130,
                              child: DropdownButtonFormField<int?>(
                                key: ValueKey('day-$_filterDay'),
                                initialValue: _filterDay,
                                decoration: const InputDecoration(
                                  labelText: 'Tanggal',
                                  isDense: true,
                                  border: OutlineInputBorder(),
                                ),
                                items: [
                                  const DropdownMenuItem<int?>(
                                    value: null,
                                    child: Text('Semua'),
                                  ),
                                  ...List.generate(
                                    31,
                                    (idx) => DropdownMenuItem<int?>(
                                      value: idx + 1,
                                      child: Text('${idx + 1}'),
                                    ),
                                  ),
                                ],
                                onChanged: (v) => setState(() => _filterDay = v),
                              ),
                            ),
                            SizedBox(
                              width: 160,
                              child: DropdownButtonFormField<int?>(
                                key: ValueKey('month-$_filterMonth'),
                                initialValue: _filterMonth,
                                decoration: const InputDecoration(
                                  labelText: 'Bulan',
                                  isDense: true,
                                  border: OutlineInputBorder(),
                                ),
                                items: [
                                  const DropdownMenuItem<int?>(
                                    value: null,
                                    child: Text('Semua'),
                                  ),
                                  ...List.generate(
                                    12,
                                    (idx) => DropdownMenuItem<int?>(
                                      value: idx + 1,
                                      child: Text(monthNames[idx]),
                                    ),
                                  ),
                                ],
                                onChanged: (v) => setState(() => _filterMonth = v),
                              ),
                            ),
                            SizedBox(
                              width: 130,
                              child: DropdownButtonFormField<int?>(
                                key: ValueKey('year-$_filterYear'),
                                initialValue: _filterYear,
                                decoration: const InputDecoration(
                                  labelText: 'Tahun',
                                  isDense: true,
                                  border: OutlineInputBorder(),
                                ),
                                items: [
                                  const DropdownMenuItem<int?>(
                                    value: null,
                                    child: Text('Semua'),
                                  ),
                                  ...availableYears.map(
                                    (y) => DropdownMenuItem<int?>(
                                      value: y,
                                      child: Text('$y'),
                                    ),
                                  ),
                                ],
                                onChanged: (v) => setState(() => _filterYear = v),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  ...filteredRecords.map(
                    (r) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: card(
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: Icon(
                            r.isMissedCheckOut
                                ? Icons.warning_amber_rounded
                                : Icons.event_available,
                            color: r.isMissedCheckOut
                                ? const Color(0xFFD97706)
                                : kpuRed,
                          ),
                          title: text(
                            '${dayKey(r.entered)} • ${r.mode}',
                            weight: FontWeight.w600,
                          ),
                          subtitle: text(
                            '${clockText(r.entered)} — ${r.exited != null ? '${clockText(r.exited)} WITA' : (r.isMissedCheckOut ? 'Tidak absen keluar' : 'Belum keluar')}',
                          ),
                          trailing: pill(
                            r.status,
                            r.isMissedCheckOut
                                ? const Color(0xFFB45309)
                                : r.status == 'Terlambat'
                                ? kpuRed
                                : navy,
                          ),
                        ),
                      ),
                    ),
                  ),
                  if (filteredRecords.isEmpty)
                    card(
                      Center(
                        child: text(
                          hasFilter
                              ? 'Tidak ada riwayat presensi pada filter tersebut.'
                              : 'Belum ada riwayat presensi.',
                          color: muted,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ] else ...[
          if (store.records.any((r) => r.isMissedCheckOut)) ...[
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.warning_amber_rounded,
                    color: Color(0xFFD97706),
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        text(
                          'Terdapat presensi tanpa absen keluar',
                          size: 13,
                          weight: FontWeight.w700,
                          color: const Color(0xFF92400E),
                        ),
                        const SizedBox(height: 4),
                        text(
                          'Tanggal: ${store.records.where((r) => r.isMissedCheckOut).map((r) => dayKey(r.entered)).take(3).join(', ')}. Status tercatat "Tidak Absen Pulang" dan dapat memengaruhi Tukin. Ajukan koreksi melalui menu Ajukan izin / cuti.',
                          size: 11,
                          color: const Color(0xFF78350F),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          card(
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: text(
                        '${dayKey(now)} • ${clockText(now)} WITA',
                        color: muted,
                      ),
                    ),
                    pill(wfh ? 'WFH' : 'WFO', navy),
                  ],
                ),
                const SizedBox(height: 24),
                text(
                  active == null
                      ? 'Siap memulai hari kerja?'
                      : active.exited == null
                      ? 'Selamat bekerja!'
                      : 'Presensi hari ini selesai',
                  size: 24,
                  weight: FontWeight.w700,
                ),
                const SizedBox(height: 12),
                text(
                  'Jam kerja 08.00–${now.weekday == 5 ? '16.30' : '16.00'} WITA',
                  color: muted,
                ),
                const SizedBox(height: 30),
                WorkDuration(entered: active?.entered, exited: active?.exited),
                const SizedBox(height: 30),
                Row(
                  children: [
                    Expanded(
                      child: stat(
                        'Absen masuk',
                        clockText(active?.entered),
                        'Waktu Indonesia Tengah',
                        Icons.login,
                        teal,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: stat(
                        'Absen keluar',
                        clockText(active?.exited),
                        'Waktu Indonesia Tengah',
                        Icons.logout,
                        teal,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                text(
                  wfh
                      ? 'WFH aktif (Selasa/Jumat): verifikasi radius geofencing kantor dinonaktifkan.'
                      : 'WFO: Berada di dalam radius geofencing kantor KPU Sulawesi Utara wajib terpenuhi.',
                  color: muted,
                  size: 12,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: kpuRed,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: busy || active?.exited != null
                        ? null
                        : () => checkIn(wfh),
                    icon: Icon(
                      busy
                          ? Icons.hourglass_empty
                          : active == null
                          ? Icons.login_rounded
                          : Icons.logout_rounded,
                    ),
                    label: Text(
                      busy
                          ? 'Memproses Presensi...'
                          : active == null
                          ? 'Presensi Masuk Sekarang'
                          : 'Presensi Keluar Sekarang',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                text(
                  wfh
                      ? 'Mode WFH: Presensi berbasis autentikasi akun & PIN/Fingerprint.'
                      : 'Mode WFO: Presensi berbasis deteksi Geofencing kantor & verifikasi PIN/Fingerprint.',
                  size: 11,
                  color: muted,
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              OutlinedButton.icon(
                onPressed: () => widget.onNavigate(1),
                icon: const Icon(Icons.history, size: 18),
                label: const Text('Riwayat kehadiran'),
              ),
              OutlinedButton.icon(
                onPressed: () => showLeaveRequestDialog(context, store),
                icon: const Icon(Icons.edit_calendar_outlined, size: 18),
                label: const Text('Ajukan izin / cuti'),
              ),
              OutlinedButton.icon(
                onPressed: () => showDialog(
                  context: context,
                  builder: (ctx) => ChangePinDialog(store: store),
                ),
                icon: const Icon(Icons.pin_rounded, size: 18),
                label: const Text('Ganti PIN Presensi'),
              ),
              if (widget.onOpenAdmin != null)
                TextButton(
                  onPressed: widget.onOpenAdmin,
                  child: const Text('Pratinjau admin'),
                ),
            ],
          ),
        ],
      ],
    );
  }

  Future<void> checkIn(bool wfh) async {
    if (now.weekday > 5) {
      showMessage(
        context,
        'Presensi tidak tersedia pada hari libur akhir pekan.',
      );
      return;
    }

    final isCheckOut = today != null;
    final expectedPin = store.currentUser?.pin;

    // Tampilkan Dialog Alur Deteksi Geofencing & Autentikasi PIN/Fingerprint
    final flowResult = await showDialog<AttendanceFlowResult>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AttendanceFlowDialog(
        store: store,
        isCheckOut: isCheckOut,
        isWfh: wfh,
        expectedPin: expectedPin,
      ),
    );

    if (flowResult == null || !flowResult.verified) return;

    setState(() => busy = true);
    try {
      final stamp = flowResult.timestamp;
      final nip = store.currentUser?.nip;
      final cacheKey = 'kpu_presensi_${nip}_${dayKey(now)}';
      Attendance? recordToSave;

      setState(() {
        if (!isCheckOut) {
          // Rekam Absen Masuk
          final newRecord = Attendance(
            store.currentUser?.name ?? 'Pegawai',
            store.currentUser?.unitName ?? 'Subbagian',
            wfh ? 'WFH' : 'WFO',
            stamp,
          );
          store.records.insert(0, newRecord);
          recordToSave = newRecord;
        } else {
          // Rekam Absen Keluar
          today!.exited = stamp;
          recordToSave = today;
        }
      });

      if (recordToSave != null) {
        // Simpan ke SharedPreferences lokal (durasi kerja tidak hilang jika logout/reopen)
        if (nip != null) {
          await store.prefs.setString(cacheKey, jsonEncode(recordToSave!.toJson()));
        }

        // Sinkronisasi data ke Cloud Firestore
        await PresensiSyncService.kirimPresensi(
          record: recordToSave!,
          nip: nip,
          nama: store.currentUser?.name,
          latitude: flowResult.latitude,
          longitude: flowResult.longitude,
        );
      }

      await store.save();

      if (mounted) {
        final actionName = isCheckOut ? 'Absen keluar' : 'Absen masuk';
        showMessage(
          context,
          '$actionName berhasil dicatat pk. ${clockText(stamp)} WITA.',
        );
      }
    } catch (e) {
      if (mounted) {
        showMessage(context, e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}
