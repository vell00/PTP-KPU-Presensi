import 'package:flutter/material.dart';
import '../core/data/app_store.dart';
import '../core/ui/components.dart';
import '../features/attendance/presentation/employee_attendance_page.dart';
import '../features/leave/presentation/employee_leave_tab.dart';
import '../features/profile/presentation/employee_profile_tab.dart';

/// Employee-only mobile shell with SafeArea header and thumb-friendly 4-tab Bottom Navigation.
/// Admin portal lives exclusively in `admin-dashboard/` (Next.js).
class Workspace extends StatefulWidget {
  final AppStore store;
  final VoidCallback? onLogout;

  const Workspace({
    super.key,
    required this.store,
    this.onLogout,
  });

  @override
  State<Workspace> createState() => _WorkspaceState();
}

class _WorkspaceState extends State<Workspace> {
  int _tabIndex = 0;

  AppStore get store => widget.store;

  @override
  void initState() {
    super.initState();
    store.onError = (error) => showMessage(context, error, isError: true);
  }

  @override
  void dispose() {
    store.onError = null;
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      await store.refresh();
    } catch (e) {
      if (mounted) showMessage(context, '$e', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final userName = store.currentUser?.name ?? 'Pegawai';
        final pendingLeaves =
            store.requests.where((r) => r.status == 'Menunggu').length;

        final body = switch (_tabIndex) {
          1 => EmployeeAttendancePage(
              store: store,
              page: 1,
              onRefresh: _refresh,
              onNavigate: (i) => setState(() => _tabIndex = i),
            ),
          2 => EmployeeLeaveTab(store: store, onRefresh: _refresh),
          3 => EmployeeProfileTab(store: store, onLogout: widget.onLogout),
          _ => EmployeeAttendancePage(
              store: store,
              page: 0,
              onRefresh: _refresh,
              onNavigate: (i) => setState(() => _tabIndex = i),
            ),
        };

        return Scaffold(
          backgroundColor: canvas,
          body: Column(
            children: [
              // SafeArea-aware Institutional Topbar
              Container(
                color: surface,
                child: SafeArea(
                  bottom: false,
                  child: Container(
                    height: 60,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: const BoxDecoration(
                      border: Border(bottom: BorderSide(color: line)),
                    ),
                    child: Row(
                      children: [
                        ClipOval(
                          child: Image.asset(
                            'assets/images/logo_kpu_sulut.jpg',
                            width: 32,
                            height: 32,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => Container(
                              width: 32,
                              height: 32,
                              color: kpuRed,
                              child: const Icon(
                                Icons.how_to_vote_rounded,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              text(
                                'Halo, $userName',
                                size: 14.5,
                                weight: FontWeight.w700,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              text(
                                'KPU Provinsi Sulawesi Utara',
                                size: 11,
                                color: muted,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'Segarkan data',
                          onPressed: _refresh,
                          icon: const Icon(Icons.refresh_rounded, color: inkSecondary, size: 21),
                        ),
                        GestureDetector(
                          onTap: () => setState(() => _tabIndex = 3),
                          child: avatar(userName, radius: 17),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Expanded(
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 680),
                    child: body,
                  ),
                ),
              ),
            ],
          ),
          bottomNavigationBar: Container(
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: line)),
            ),
            child: NavigationBar(
              selectedIndex: _tabIndex,
              onDestinationSelected: (i) => setState(() => _tabIndex = i),
              destinations: [
                const NavigationDestination(
                  icon: Icon(Icons.fingerprint_rounded),
                  selectedIcon: Icon(Icons.fingerprint_rounded),
                  label: 'Presensi',
                ),
                const NavigationDestination(
                  icon: Icon(Icons.history_rounded),
                  selectedIcon: Icon(Icons.history_rounded),
                  label: 'Riwayat',
                ),
                NavigationDestination(
                  icon: Badge(
                    isLabelVisible: pendingLeaves > 0,
                    label: Text('$pendingLeaves'),
                    child: const Icon(Icons.event_note_outlined),
                  ),
                  selectedIcon: Badge(
                    isLabelVisible: pendingLeaves > 0,
                    label: Text('$pendingLeaves'),
                    child: const Icon(Icons.event_note_rounded),
                  ),
                  label: 'Izin & Cuti',
                ),
                const NavigationDestination(
                  icon: Icon(Icons.person_outline_rounded),
                  selectedIcon: Icon(Icons.person_rounded),
                  label: 'Profil',
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
