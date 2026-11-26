import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import '../../attendance/presentation/widgets/change_pin_dialog.dart';

const _weekdays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

class EmployeeProfileTab extends StatelessWidget {
  final AppStore store;
  final VoidCallback? onLogout;

  const EmployeeProfileTab({
    super.key,
    required this.store,
    this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    final user = store.currentUser;
    final wfhDays = store.currentUserWfhDays;
    final wh = store.workHours;
    String hhmm(int h, int m) =>
        '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        // Identity Header Card
        card(
          Row(
            children: [
              avatar(user?.name ?? 'Pegawai', radius: 28),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    text(
                      user?.name ?? 'Pegawai KPU Sulut',
                      size: 16.5,
                      weight: FontWeight.w800,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    text(
                      'NIP ${user?.nip ?? '-'}',
                      size: 12.5,
                      color: muted,
                      tabular: true,
                    ),
                    const SizedBox(height: 6),
                    pill(user?.unitName ?? 'Sekretariat KPU', navy, bg: surfaceMuted),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Unit & Structure Info
        card(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              text('Penugasan Organisasi', size: 14, weight: FontWeight.w700),
              const SizedBox(height: 12),
              _infoRow('Peran Struktural', user?.role.label ?? 'Staf'),
              const Divider(height: 20),
              _infoRow('Bagian', user?.department.name ?? 'Sekretariat KPU Provinsi Sulut'),
              const Divider(height: 20),
              _infoRow('Jam Kerja WITA',
                  '${hhmm(wh.startHour, wh.startMinute)}–${hhmm(wh.endHourMonThu, wh.endMinuteMonThu)} (Sen–Kam) • ${hhmm(wh.startHour, wh.startMinute)}–${hhmm(wh.endHourFri, wh.endMinuteFri)} (Jum)'),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Per-Subdepartment WFH Schedule
        card(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              text('Jadwal WFH Subbagian Anda', size: 14, weight: FontWeight.w700),
              const SizedBox(height: 4),
              text(
                'Diatur terpusat oleh Administrator Sekretariat KPU Sulut.',
                size: 12,
                color: muted,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _weekdays.map((day) {
                  final isWfh = wfhDays.contains(day);
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: isWfh ? infoBg : canvas,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: isWfh ? infoBorder : line),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isWfh ? Icons.home_outlined : Icons.apartment_rounded,
                          size: 14,
                          color: isWfh ? info : muted,
                        ),
                        const SizedBox(width: 5),
                        text(
                          '$day · ${isWfh ? 'WFH' : 'WFO'}',
                          size: 12,
                          color: isWfh ? info : inkSecondary,
                          weight: isWfh ? FontWeight.w700 : FontWeight.w500,
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Security Actions
        card(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              text('Keamanan & Akun', size: 14, weight: FontWeight.w700),
              const SizedBox(height: 10),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: kpuRedSoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.pin_rounded, color: kpuRed, size: 20),
                ),
                title: text('Ganti PIN Presensi', size: 14, weight: FontWeight.w600),
                subtitle: text(
                  user?.hasPin == true
                      ? 'PIN 6 digit aktif & terenkripsi di server'
                      : 'PIN presensi belum diatur',
                  size: 12,
                  color: muted,
                ),
                trailing: const Icon(Icons.chevron_right_rounded, color: muted),
                onTap: () => showDialog(
                  context: context,
                  builder: (_) => ChangePinDialog(store: store),
                ),
              ),
              if (onLogout != null) ...[
                const Divider(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: danger,
                      side: const BorderSide(color: dangerBorder),
                    ),
                    onPressed: () async {
                      final ok = await showConfirmDialog(
                        context,
                        title: 'Keluar dari Aplikasi?',
                        message:
                            'Anda perlu masuk kembali menggunakan NIP dan kata sandi pada sesi berikutnya.',
                        confirmLabel: 'Keluar',
                        destructive: true,
                      );
                      if (ok) onLogout!();
                    },
                    icon: const Icon(Icons.logout_rounded, size: 18),
                    label: const Text('Keluar dari Akun'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      SizedBox(
        width: 118,
        child: text(label, size: 12.5, color: muted),
      ),
      Expanded(
        child: text(value, size: 12.5, color: ink, weight: FontWeight.w600),
      ),
    ],
  );
}
