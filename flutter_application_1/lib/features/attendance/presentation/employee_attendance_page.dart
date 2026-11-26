import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import '../data/presensi_sync_service.dart';
import '../domain/attendance.dart';
import '../domain/work_policy.dart';
import '../services/device_attendance_service.dart';
import '../../leave/presentation/leave_request_dialog.dart';
import 'widgets/attendance_flow_dialog.dart';
import 'work_duration.dart';

class EmployeeAttendancePage extends StatefulWidget {
  final AppStore store;
  final int page; // 0 = Presensi Home, 1 = Riwayat
  final Future<void> Function() onRefresh;
  final ValueChanged<int> onNavigate;

  const EmployeeAttendancePage({
    super.key,
    required this.store,
    required this.page,
    required this.onRefresh,
    required this.onNavigate,
  });

  @override
  State<EmployeeAttendancePage> createState() => _EmployeeAttendancePageState();
}

class _EmployeeAttendancePageState extends State<EmployeeAttendancePage> {
  AppStore get store => widget.store;

  Timer? _clockTimer;
  DateTime _now = witaNow();
  bool _busy = false;
  bool _initialLoading = true;
  bool _checkingGeo = false;
  GeolocationVerificationResult? _geoPreview;

  int? _filterMonth;
  int? _filterYear;

  Attendance? get _today {
    final todayStr = dayKey(_now);
    for (final r in store.records) {
      if (dayKey(r.entered) == todayStr) return r;
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = witaNow());
    });
    _syncInitialState();
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    super.dispose();
  }

  Future<void> _syncInitialState() async {
    final user = store.currentUser;
    if (user != null && store.isRemote) {
      try {
        final remoteToday = await PresensiSyncService.ambilPresensiHariIni(user.uid, _now);
        if (remoteToday != null && mounted) {
          final todayStr = dayKey(_now);
          final idx = store.records.indexWhere((r) => dayKey(r.entered) == todayStr);
          setState(() {
            if (idx == -1) {
              store.records.insert(0, remoteToday);
            } else {
              store.records[idx] = remoteToday;
            }
          });
        }
      } catch (_) {}
    }
    if (mounted) {
      setState(() => _initialLoading = false);
    }
  }

  Future<void> _checkGeofencePreview() async {
    if (_checkingGeo) return;
    setState(() => _checkingGeo = true);
    final res = await DeviceAttendanceService().verifyLocation(store, wfh: false);
    if (mounted) {
      setState(() {
        _geoPreview = res;
        _checkingGeo = false;
      });
    }
  }

  Future<void> _handleCheckInOrOut(bool isWfh) async {
    if (_now.weekday > 5) {
      showMessage(context, 'Presensi tidak tersedia pada hari akhir pekan.', isError: true);
      return;
    }
    final holidayName = store.holidayNameFor(_now);
    if (holidayName != null) {
      showMessage(
        context,
        'Presensi dinonaktifkan pada hari libur: $holidayName.',
        isError: true,
      );
      return;
    }

    final isCheckOut = _today != null;

    // Early-leave confirmation warning (PSW guard)
    if (isCheckOut) {
      final earlyMin = WorkPolicy.earlyLeaveMinutes(_now, config: store.workHours);
      if (earlyMin > 0) {
        final proceed = await showConfirmDialog(
          context,
          title: 'Konfirmasi Pulang Sebelum Waktunya',
          message:
              'Waktu saat ini masih $earlyMin menit lebih awal dari jam pulang resmi (${clockText(WorkPolicy.end(_now, config: store.workHours))} WITA). Pulang cepat dapat memengaruhi komponen kehadiran Tukin. Lanjutkan absen keluar?',
          confirmLabel: 'Ya, Absen Keluar',
          destructive: true,
        );
        if (!proceed || !mounted) return;
      }
    }

    final flowResult = await showDialog<AttendanceFlowResult>(
      context: context,
      barrierDismissible: false,
      builder: (_) => AttendanceFlowDialog(
        store: store,
        isCheckOut: isCheckOut,
        isWfh: isWfh,
      ),
    );
    if (flowResult == null || !flowResult.verified || !mounted) return;

    setState(() => _busy = true);
    try {
      if (store.isRemote) {
        final serverRes = await PresensiSyncService.catatPresensiServer(
          isCheckOut: isCheckOut,
          authMethod: flowResult.authMethod,
          pin: flowResult.pin,
          latitude: flowResult.latitude,
          longitude: flowResult.longitude,
          accuracyMeters: flowResult.accuracyMeters,
          isMocked: flowResult.isMocked,
        );
        final updatedRecord = Attendance(
          store.currentUser?.name ?? 'Pegawai',
          store.currentUser?.unitName ?? 'Sekretariat KPU',
          serverRes.mode,
          serverRes.entered,
          serverRes.exited,
          serverRes.lateMinutes,
          serverRes.earlyLeaveMinutes,
          serverRes.distanceMeters,
          flowResult.selfiePath,
          null,
          flowResult.authMethod,
          serverRes.status,
        );
        final idx = store.records.indexWhere((r) => dayKey(r.entered) == serverRes.dateKey);
        setState(() {
          if (idx == -1) {
            store.records.insert(0, updatedRecord);
          } else {
            store.records[idx] = updatedRecord;
          }
        });
        await store.refresh();
        if (mounted) {
          final stamp = isCheckOut ? serverRes.exited ?? _now : serverRes.entered;
          showMessage(
            context,
            '${isCheckOut ? 'Presensi keluar' : 'Presensi masuk'} tercatat server pk. ${clockText(stamp)} WITA (${serverRes.status}).',
          );
        }
      } else {
        // Offline / local test mode
        final stamp = witaNow();
        final nip = store.currentUser?.nip ?? 'local';
        final cacheKey = 'kpu_presensi_${nip}_${dayKey(stamp)}';
        late Attendance savedRecord;
        setState(() {
          if (!isCheckOut) {
            savedRecord = Attendance(
              store.currentUser?.name ?? 'Pegawai',
              store.currentUser?.unitName ?? 'Sekretariat KPU',
              isWfh ? 'WFH' : 'WFO',
              stamp,
              null,
              WorkPolicy.lateMinutes(stamp, config: store.workHours),
              0,
              flowResult.distance.round(),
              flowResult.selfiePath,
              null,
              flowResult.authMethod,
            );
            store.records.insert(0, savedRecord);
          } else {
            _today!.exited = stamp;
            savedRecord = _today!;
          }
        });
        await store.prefs.setString(cacheKey, jsonEncode(savedRecord.toJson()));
        await store.save();
        if (mounted) {
          showMessage(
            context,
            '${isCheckOut ? 'Presensi keluar' : 'Presensi masuk'} tercatat pk. ${clockText(stamp)} WITA.',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        showMessage(
          context,
          e.toString().replaceFirst('Exception: ', ''),
          isError: true,
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.page == 1) {
      return _buildHistoryTab();
    }
    return _buildHomeTab();
  }

  Widget _buildHomeTab() {
    final isWfh = store.isWfhForDay(_now);
    final holidayName = store.holidayNameFor(_now);
    final isWeekend = _now.weekday > 5;
    final active = _today;
    final missedRecords = store.records.where((r) => r.isMissedCheckOut).toList();
    final endClock = clockText(WorkPolicy.end(_now, config: store.workHours));
    final startClock =
        '${store.workHours.startHour.toString().padLeft(2, '0')}:${store.workHours.startMinute.toString().padLeft(2, '0')}';

    return RefreshIndicator(
      color: kpuRed,
      onRefresh: widget.onRefresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          // Missed Check-Out Actionable Alert
          if (missedRecords.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: warningBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: warningBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: warning, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: text(
                          '${missedRecords.length} Hari Tanpa Absen Pulang',
                          size: 13.5,
                          weight: FontWeight.w700,
                          color: warning,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  text(
                    'Tanggal: ${missedRecords.take(3).map((r) => formatShortDateKey(dayKey(r.entered))).join(', ')}. Status "Tidak Absen Pulang" memotong 1,5% Tukin.',
                    size: 12,
                    color: inkSecondary,
                  ),
                  const SizedBox(height: 10),
                  TextButton.icon(
                    style: TextButton.styleFrom(
                      foregroundColor: warning,
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(48, 36),
                    ),
                    onPressed: () => showLeaveRequestDialog(
                      context,
                      store,
                      initialType: 'Koreksi Absen',
                      initialReason:
                          'Permohonan koreksi absen pulang tanggal ${dayKey(missedRecords.first.entered)}',
                    ),
                    icon: const Icon(Icons.edit_calendar_outlined, size: 16),
                    label: const Text('Ajukan Koreksi Absen'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],

          // Institutional Live WITA Hero Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: navy,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: text(
                        formatFullDateId(_now),
                        size: 12.5,
                        color: const Color(0xFFCBD5E1),
                        weight: FontWeight.w500,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isWfh
                            ? info.withValues(alpha: 0.25)
                            : Colors.white.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(
                          color: isWfh
                              ? const Color(0xFF93C5FD).withValues(alpha: 0.5)
                              : Colors.white.withValues(alpha: 0.22),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isWfh ? Icons.home_outlined : Icons.apartment_rounded,
                            size: 13,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 5),
                          text(
                            isWfh ? 'WFH' : 'WFO',
                            size: 11.5,
                            color: Colors.white,
                            weight: FontWeight.w700,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    text(
                      clockWithSeconds(_now),
                      size: 36,
                      weight: FontWeight.w800,
                      color: Colors.white,
                      tabular: true,
                    ),
                    const SizedBox(width: 8),
                    text(
                      'WITA',
                      size: 13,
                      weight: FontWeight.w700,
                      color: const Color(0xFF93C5FD),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                text(
                  holidayName != null
                      ? 'Hari Libur: $holidayName'
                      : isWeekend
                      ? 'Akhir Pekan — Tidak ada jadwal presensi'
                      : 'Jam kerja $startClock–$endClock WITA • ${store.currentUser?.unitName ?? 'Sekretariat KPU'}',
                  size: 12.5,
                  color: const Color(0xFFCBD5E1),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Pre-check Geofence Status Strip (WFO only)
          if (!isWfh && !isWeekend && holidayName == null) ...[
            card(
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: _geoPreview == null
                          ? surfaceMuted
                          : _geoPreview!.verified
                          ? successBg
                          : dangerBg,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      _geoPreview == null
                          ? Icons.my_location_rounded
                          : _geoPreview!.verified
                          ? Icons.check_circle_rounded
                          : Icons.location_off_rounded,
                      color: _geoPreview == null
                          ? navy
                          : _geoPreview!.verified
                          ? success
                          : danger,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        text(
                          _geoPreview == null
                              ? 'Radius Kantor: ${store.radius.round()} m'
                              : _geoPreview!.verified
                              ? 'Di Dalam Radius (${_geoPreview!.distance.round()} m)'
                              : 'Di Luar Radius Kantor',
                          size: 13.5,
                          weight: FontWeight.w700,
                          color: _geoPreview == null
                              ? ink
                              : _geoPreview!.verified
                              ? success
                              : danger,
                        ),
                        text(
                          _geoPreview == null
                              ? 'Ketuk Cek Lokasi untuk memastikan posisi GPS Anda'
                              : _geoPreview!.verified
                              ? 'Siap untuk presensi WFO (akurasi ±${(_geoPreview!.accuracyMeters ?? 0).round()} m)'
                              : (_geoPreview!.errorMessage ?? 'Pindah lebih dekat ke kantor KPU'),
                          size: 11.5,
                          color: muted,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: _checkingGeo ? null : _checkGeofencePreview,
                    child: _checkingGeo
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Cek'),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(14),
            ),
            const SizedBox(height: 14),
          ],

          // Today's Attendance Card
          if (_initialLoading)
            card(
              Column(
                children: [
                  Container(
                    height: 100,
                    decoration: BoxDecoration(
                      color: surfaceMuted,
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: surfaceMuted,
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ],
              ),
            )
          else
            card(
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: text(
                          active == null
                              ? 'Belum Presensi Hari Ini'
                              : active.exited == null
                              ? 'Sedang Bertugas'
                              : 'Presensi Hari Ini Selesai',
                          size: 16,
                          weight: FontWeight.w800,
                        ),
                      ),
                      if (active != null) attendanceStatusBadge(active.status),
                    ],
                  ),
                  const SizedBox(height: 14),

                  WorkDuration(
                    entered: active?.entered,
                    exited: active?.exited,
                    config: store.workHours,
                  ),
                  const SizedBox(height: 14),

                  // Masuk / Pulang Time Pair
                  Row(
                    children: [
                      Expanded(
                        child: _timeTile(
                          label: 'Absen Masuk',
                          value: clockText(active?.entered),
                          icon: Icons.login_rounded,
                          done: active != null,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _timeTile(
                          label: 'Absen Pulang',
                          value: clockText(active?.exited),
                          icon: Icons.logout_rounded,
                          done: active?.exited != null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Primary Check-In / Out CTA
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: active == null ? kpuRed : navy,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                    ),
                    onPressed: (_busy ||
                            active?.exited != null ||
                            isWeekend ||
                            holidayName != null)
                        ? null
                        : () => _handleCheckInOrOut(isWfh),
                    icon: _busy
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Icon(
                            active == null
                                ? Icons.login_rounded
                                : active.exited == null
                                ? Icons.logout_rounded
                                : Icons.check_circle_rounded,
                            size: 20,
                          ),
                    label: Text(
                      _busy
                          ? 'Mengirim ke Server...'
                          : active == null
                          ? 'Presensi Masuk Sekarang'
                          : active.exited == null
                          ? 'Presensi Pulang Sekarang'
                          : 'Presensi Hari Ini Lengkap',
                    ),
                  ),
                  const SizedBox(height: 10),
                  text(
                    isWfh
                        ? 'Alur WFH: Foto selfie + verifikasi biometrik/PIN dengan waktu server WITA.'
                        : 'Alur WFO: GPS radius kantor + foto selfie + verifikasi biometrik/PIN.',
                    size: 11.5,
                    color: muted,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _timeTile({
    required String label,
    required String value,
    required IconData icon,
    required bool done,
  }) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: done ? successBg : canvas,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: done ? successBorder : line),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 15, color: done ? success : muted),
            const SizedBox(width: 6),
            Expanded(
              child: text(
                label,
                size: 12,
                color: done ? success : muted,
                weight: FontWeight.w600,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        text(
          value,
          size: 22,
          weight: FontWeight.w800,
          color: done ? ink : muted,
          tabular: true,
        ),
        text('WITA', size: 11, color: muted),
      ],
    ),
  );

  Widget _buildHistoryTab() {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    final years = <int>{_now.year, ...store.records.map((r) => r.entered.year)}.toList()
      ..sort((a, b) => b.compareTo(a));

    final filtered = store.records.where((r) {
      if (_filterMonth != null && r.entered.month != _filterMonth) return false;
      if (_filterYear != null && r.entered.year != _filterYear) return false;
      return true;
    }).toList()
      ..sort((a, b) => b.entered.compareTo(a.entered));

    final onTimeCount = filtered.where((r) => r.status == 'Tepat Waktu').length;
    final lateCount = filtered.where((r) => r.computedLateMinutes > 0).length;
    final missedCount = filtered.where((r) => r.isMissedCheckOut).length;

    return RefreshIndicator(
      color: kpuRed,
      onRefresh: widget.onRefresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          text('Riwayat Kehadiran', size: 20, weight: FontWeight.w800),
          const SizedBox(height: 4),
          text(
            'Data disinkronkan langsung dengan server presensi KPU Sulut',
            size: 12.5,
            color: muted,
          ),
          const SizedBox(height: 14),

          // Summary Mini Strip
          Row(
            children: [
              Expanded(child: _miniStat('Total', '${filtered.length}', navy)),
              const SizedBox(width: 8),
              Expanded(child: _miniStat('Tepat', '$onTimeCount', success)),
              const SizedBox(width: 8),
              Expanded(child: _miniStat('Telat', '$lateCount', warning)),
              const SizedBox(width: 8),
              Expanded(child: _miniStat('TAP', '$missedCount', danger)),
            ],
          ),
          const SizedBox(height: 14),

          // Month & Year Filters
          card(
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<int?>(
                    initialValue: _filterMonth,
                    decoration: const InputDecoration(
                      labelText: 'Bulan',
                      isDense: true,
                    ),
                    items: [
                      const DropdownMenuItem<int?>(value: null, child: Text('Semua')),
                      ...List.generate(
                        12,
                        (i) => DropdownMenuItem<int?>(
                          value: i + 1,
                          child: Text(months[i]),
                        ),
                      ),
                    ],
                    onChanged: (v) => setState(() => _filterMonth = v),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: DropdownButtonFormField<int?>(
                    initialValue: _filterYear,
                    decoration: const InputDecoration(
                      labelText: 'Tahun',
                      isDense: true,
                    ),
                    items: [
                      const DropdownMenuItem<int?>(value: null, child: Text('Semua')),
                      ...years.map(
                        (y) => DropdownMenuItem<int?>(value: y, child: Text('$y')),
                      ),
                    ],
                    onChanged: (v) => setState(() => _filterYear = v),
                  ),
                ),
              ],
            ),
            padding: const EdgeInsets.all(14),
          ),
          const SizedBox(height: 14),

          if (filtered.isEmpty)
            emptyStateCard(
              icon: Icons.history_rounded,
              title: 'Belum Ada Catatan Presensi',
              subtitle:
                  'Riwayat presensi masuk dan pulang Anda akan muncul di sini sesuai periode yang dipilih.',
            )
          else
            ...filtered.map(
              (r) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: card(
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: text(
                              formatShortDateKey(dayKey(r.entered)),
                              size: 14.5,
                              weight: FontWeight.w700,
                            ),
                          ),
                          modeBadge(r.mode),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: text(
                              'Masuk ${clockText(r.entered)} • Pulang ${r.exited != null ? clockText(r.exited) : (r.isMissedCheckOut ? 'Tidak absen' : 'Belum pulang')} WITA',
                              size: 12.5,
                              color: inkSecondary,
                              tabular: true,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          attendanceStatusBadge(r.status),
                          if (r.computedLateMinutes > 0) ...[
                            const SizedBox(width: 8),
                            text(
                              '+${r.computedLateMinutes} mnt telat',
                              size: 11.5,
                              color: warning,
                              weight: FontWeight.w600,
                              tabular: true,
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(15),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _miniStat(String label, String value, Color accent) => card(
    Column(
      children: [
        text(value, size: 18, weight: FontWeight.w800, color: accent, tabular: true),
        const SizedBox(height: 2),
        text(label, size: 11, color: muted, weight: FontWeight.w600),
      ],
    ),
    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
  );
}
