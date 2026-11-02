import '../../features/users/domain/user_profile.dart';
import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/config/app_constants.dart';

class WorkspaceSidebar extends StatelessWidget {
  final bool admin, isRemote;
  final int page, pending;
  final ValueChanged<int> onNavigate;
  final VoidCallback? onToggle;
  final UserProfile? profile;
  const WorkspaceSidebar({
    super.key,
    required this.admin,
    required this.isRemote,
    required this.page,
    required this.pending,
    required this.onNavigate,
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
            padding: const EdgeInsets.fromLTRB(26, 30, 22, 30),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 43,
                  decoration: BoxDecoration(
                    color: teal,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.fingerprint_rounded,
                    color: Colors.white,
                    size: 29,
                  ),
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      text('hadir', size: 29, weight: FontWeight.w800),
                      text(
                        'KPU SULAWESI UTARA',
                        size: 7,
                        color: muted,
                        weight: FontWeight.w700,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 26),
            child: text(
              'WORKSPACE',
              size: 10,
              color: muted,
              weight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 15),
          ...List.generate(admin ? 6 : 4, (i) {
            final labels = admin
                ? adminTitles
                : ['Dashboard', 'Riwayat Kehadiran', 'WFO', 'WFH'];
            final icons = admin
                ? [
                    Icons.grid_view_rounded,
                    Icons.fact_check_outlined,
                    Icons.people_outline_rounded,
                    Icons.event_note_outlined,
                    Icons.account_balance_wallet_outlined,
                    Icons.tune_rounded,
                  ]
                : [
                    Icons.grid_view_rounded,
                    Icons.history_rounded,
                    Icons.apartment_rounded,
                    Icons.home_work_outlined,
                  ];
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 3),
              child: Material(
                color: page == i ? const Color(0xFFE9F4F0) : Colors.transparent,
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
                          color: page == i ? teal : muted,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: text(
                            labels[i],
                            color: page == i ? teal : const Color(0xFF626F6B),
                            weight: page == i
                                ? FontWeight.w700
                                : FontWeight.w500,
                          ),
                        ),
                        if (admin && i == 3 && pending > 0)
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
          }),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: canvas,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.verified_user_outlined,
                    color: teal,
                    size: 22,
                  ),
                  const SizedBox(height: 10),
                  text(
                    'Presensi lebih terpercaya',
                    size: 12,
                    weight: FontWeight.w700,
                  ),
                  const SizedBox(height: 7),
                  text(
                    'Lokasi terverifikasi. Kehadiran tercatat dengan lebih baik.',
                    size: 11,
                    color: muted,
                  ),
                  const SizedBox(height: 10),
                  text(
                    isRemote
                        ? 'Firebase • Data prototipe'
                        : 'Mode demo • Data lokal',
                    size: 10,
                    color: teal,
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                avatar(
                  profile?.name ?? (admin ? 'Admin KPU' : 'Andreas Sondakh'),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      text(
                        profile?.name ??
                            (admin ? 'Admin KPU Sulut' : 'Andreas Sondakh'),
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
                    tooltip: 'Ganti tampilan demo',
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
