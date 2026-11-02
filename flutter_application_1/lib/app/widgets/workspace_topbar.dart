import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/config/app_constants.dart';

class WorkspaceTopbar extends StatelessWidget {
  final bool wide, admin, isRemote;
  final int page, pending;
  final VoidCallback onMenu, onRefresh;
  final VoidCallback? onNotifications;
  final String displayName;
  final VoidCallback? onLogout;
  const WorkspaceTopbar({
    super.key,
    required this.wide,
    required this.admin,
    required this.isRemote,
    required this.page,
    required this.pending,
    required this.onMenu,
    required this.onRefresh,
    required this.onNotifications,
    this.displayName = 'Admin KPU',
    this.onLogout,
  });
  @override
  Widget build(BuildContext context) => Container(
    height: 78,
    padding: EdgeInsets.symmetric(horizontal: wide ? 30 : 14),
    decoration: const BoxDecoration(
      color: Colors.white,
      border: Border(bottom: BorderSide(color: line)),
    ),
    child: Row(
      children: [
        if (!wide) IconButton(onPressed: onMenu, icon: const Icon(Icons.menu)),
        if (wide) text(admin ? 'Workspace' : 'Pegawai', size: 12, color: muted),
        if (wide)
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 13),
            child: Icon(Icons.chevron_right, size: 14, color: muted),
          ),
        Expanded(
          child: text(
            admin
                ? adminTitles[page]
                : ['Dashboard', 'Riwayat Kehadiran', 'WFO', 'WFH'][page],
            size: 12,
            weight: FontWeight.w600,
          ),
        ),
        if (isRemote) ...[
          IconButton(
            tooltip: 'Muat ulang dari server',
            onPressed: onRefresh,
            icon: const Icon(Icons.sync, size: 20),
          ),
          IconButton(
            tooltip: 'Keluar akun',
            onPressed: onLogout,
            icon: const Icon(Icons.logout, size: 20),
          ),
        ],
        if (wide) ...[
          const Icon(Icons.location_on_outlined, size: 16, color: muted),
          const SizedBox(width: 5),
          text('Manado, Sulawesi Utara', size: 11, color: muted),
          const SizedBox(width: 22),
        ],
        if (onNotifications != null)
          IconButton(
            tooltip: 'Pengajuan menunggu',
            onPressed: onNotifications,
            icon: Badge(
              isLabelVisible: pending > 0,
              smallSize: 6,
              child: const Icon(Icons.notifications_none_rounded, size: 21),
            ),
          ),
        const SizedBox(width: 12),
        avatar(displayName, radius: 17),
      ],
    ),
  );
}
