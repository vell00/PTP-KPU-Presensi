import '../../features/users/domain/user_profile.dart';
import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/config/app_constants.dart';

class WorkspaceSidebar extends StatelessWidget {
  final bool admin, isRemote;
  final int page, pending;
  final ValueChanged<int> onNavigate;
  final VoidCallback? onLeaveRequest;
  final VoidCallback? onChangePin;
  final VoidCallback? onToggle;
  final UserProfile? profile;
  const WorkspaceSidebar({
    super.key,
    required this.admin,
    required this.isRemote,
    required this.page,
    required this.pending,
    required this.onNavigate,
    this.onLeaveRequest,
    this.onChangePin,
    required this.onToggle,
    this.profile,
  });
  @override
  Widget build(BuildContext context) => Container(
    color: Colors.white,
    child: SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(26, 30, 22, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                text(
                  'Sistem Presensi',
                  size: 18,
                  weight: FontWeight.w800,
                  color: navy,
                ),
                const SizedBox(height: 3),
                text(
                  'KPU Sulawesi Utara',
                  size: 11,
                  color: muted,
                  weight: FontWeight.w700,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 26),
            child: text(
              admin ? 'PORTAL ADMINISTRATOR' : 'WORKSPACE',
              size: 10,
              color: muted,
              weight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 15),
          if (admin)
            ...List.generate(adminTitles.length, (i) {
              final labels = adminTitles;
              final icons = [
                Icons.grid_view_rounded,
                Icons.fact_check_outlined,
                Icons.people_outline_rounded,
                Icons.event_note_outlined,
                Icons.account_balance_wallet_outlined,
                Icons.tune_rounded,
              ];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 3),
                child: Material(
                  color: page == i ? const Color(0xFFF1F5F9) : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  child: InkWell(
                    onTap: () => onNavigate(i),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 14,
                      ),
                      child: Row(
                        children: [
                          Icon(
                            icons[i],
                            size: 20,
                            color: page == i ? kpuRed : muted,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: text(
                              labels[i],
                              color: page == i ? navy : const Color(0xFF626F6B),
                              weight: page == i
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                            ),
                          ),
                          if (i == 3 && pending > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFEFE0),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: text(
                                '$pending',
                                color: const Color(0xFFB57A32),
                                size: 10,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            })
          else ...[
            // Menu User: Dashboard (0), Riwayat Kehadiran (1)
            ...[
              {'label': 'Dashboard', 'icon': Icons.grid_view_rounded, 'idx': 0},
              {'label': 'Riwayat Kehadiran', 'icon': Icons.history_rounded, 'idx': 1},
            ].map((item) {
              final i = item['idx'] as int;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 3),
                child: Material(
                  color: page == i ? const Color(0xFFF1F5F9) : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  child: InkWell(
                    onTap: () => onNavigate(i),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 14,
                      ),
                      child: Row(
                        children: [
                          Icon(
                            item['icon'] as IconData,
                            size: 20,
                            color: page == i ? kpuRed : muted,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: text(
                              item['label'] as String,
                              color: page == i ? navy : const Color(0xFF626F6B),
                              weight: page == i
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
            // Menu Aksi User: Ajukan izin/cuti & Ganti PIN Presensi
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 3),
              child: Material(
                color: Colors.transparent,
                borderRadius: BorderRadius.circular(8),
                child: InkWell(
                  onTap: onLeaveRequest,
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 14,
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.edit_calendar_outlined,
                          size: 20,
                          color: muted,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: text(
                            'Ajukan izin / cuti',
                            color: const Color(0xFF626F6B),
                            weight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 3),
              child: Material(
                color: Colors.transparent,
                borderRadius: BorderRadius.circular(8),
                child: InkWell(
                  onTap: onChangePin,
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 14,
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.lock_reset_rounded,
                          size: 20,
                          color: muted,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: text(
                            'Ganti PIN Presensi',
                            color: const Color(0xFF626F6B),
                            weight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
          const Spacer(),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                avatar(
                  profile?.name ?? (admin ? 'Admin KPU' : 'Pegawai'),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      text(
                        profile?.name ??
                            (admin ? 'Admin KPU Sulut' : 'Pegawai'),
                        size: 12,
                        weight: FontWeight.w700,
                      ),
                      text(
                        profile?.role.label ??
                            (admin ? 'Administrator' : 'Pegawai'),
                        size: 10,
                        color: muted,
                      ),
                    ],
                  ),
                ),
                if (onToggle != null)
                  IconButton(
                    tooltip: 'Ganti tampilan',
                    onPressed: onToggle,
                    icon: const Icon(Icons.swap_horiz, size: 18),
                  ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
