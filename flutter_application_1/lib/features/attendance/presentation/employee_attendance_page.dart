import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/config/app_constants.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'package:flutter/foundation.dart';
import '../domain/attendance.dart';
import '../domain/work_policy.dart';
import '../services/device_attendance_service.dart';
import '../../leave/presentation/leave_request_dialog.dart';
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
  bool get fridayEligible =>
      store.fridayWfh &&
      (!store.isRemote || store.currentUser?.subdepartmentId == "keuangan");
  DateTime get now => witaNow();
  Attendance? get today {
    final list = store.records.where((r) => dayKey(r.entered) == dayKey(now));
    return list.isEmpty ? null : list.first;
  }

  @override
  Widget build(BuildContext context) {
    final wfh = WorkPolicy.isWfh(now, fridayEligible);
    final active = today;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        heading(
          widget.page == 1
              ? 'Riwayat Kehadiran'
              : widget.page == 2
              ? 'Work from office'
              : widget.page == 3
              ? 'Work from home'
              : 'Halo, ${store.currentUser?.name ?? 'Andreas'} 👋',
          '${store.currentUser?.unitName ?? 'Keuangan'} • KPU Sulawesi Utara',
          action: pill(
            store.isRemote ? 'Firebase • Prototipe' : 'Mode demo lokal',
            teal,
          ),
        ),
        if (widget.page == 1) ...[
          ...store.records.map(
            (r) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: card(
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.event_available, color: teal),
                  title: text(
                    '${dayKey(r.entered)} • ${r.mode}',
                    weight: FontWeight.w600,
                  ),
                  subtitle: text(
                    '${clockText(r.entered)} — ${clockText(r.exited)} WITA',
                  ),
                  trailing: pill(r.status, teal),
                ),
              ),
            ),
          ),
          if (store.records.isEmpty)
            card(
              Center(child: text('Belum ada riwayat presensi.', color: muted)),
            ),
        ] else ...[
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
                    pill(wfh ? 'WFH' : 'WFO', teal),
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
                      ? 'WFH Jumat aktif: verifikasi geolokasi dinonaktifkan.'
                      : 'WFO: posisi asli, akurasi ≤ 50 m, dan radius kantor wajib terpenuhi.',
                  color: muted,
                  size: 12,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: busy || active?.exited != null
                        ? null
                        : () => checkIn(wfh),
                    icon: Icon(
                      busy
                          ? Icons.hourglass_empty
                          : Icons.face_retouching_natural,
                    ),
                    label: Text(
                      busy
                          ? 'Memverifikasi...'
                          : active == null
                          ? 'Scan wajah & absen masuk'
                          : 'Scan wajah & absen keluar',
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                text(
                  'Pengambilan selfie untuk uji alur. Pencocokan wajah dan liveness belum terhubung; catatan ini bukan presensi resmi.',
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
    if (kIsWeb) {
      showMessage(
        context,
        'Presensi perangkat tersedia pada aplikasi Android/iOS. Web digunakan untuk dashboard admin.',
      );
      return;
    }
    setState(() => busy = true);
    try {
      final captured = await DeviceAttendanceService().captureSelfie(
        store,
        wfh: WorkPolicy.isWfh(witaNow(), fridayEligible),
      );
      if (!captured) return;
      if (!mounted) return;
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Simpan presensi demo?'),
          content: const Text(
            'Selfie berhasil diambil. Verifikasi identitas wajah belum tersedia. Catatan digunakan untuk pengujian dan disimpan sesuai mode penyimpanan aktif.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Batal'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Simpan demo'),
            ),
          ],
        ),
      );
      if (confirmed != true || !mounted) return;
      final stamp = witaNow();
      setState(() {
        if (today == null) {
          store.records.insert(
            0,
            Attendance(
              store.currentUser?.name ?? 'Andreas R. Sondakh',
              store.currentUser?.unitName ?? divisions.first,
              wfh ? 'WFH' : 'WFO',
              stamp,
            ),
          );
        } else {
          today!.exited = stamp;
        }
      });
      if (!await store.save()) return;
      if (mounted) showMessage(context, 'Presensi demo tersimpan.');
    } catch (e) {
      if (mounted) {
        showMessage(context, e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}
