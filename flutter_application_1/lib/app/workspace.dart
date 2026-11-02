import 'package:flutter/material.dart';
import '../core/data/app_store.dart';
import '../core/ui/components.dart';
import '../features/dashboard/presentation/dashboard_page.dart';
import '../features/attendance/presentation/attendance_recap_page.dart';
import '../features/attendance/presentation/employee_attendance_page.dart';
import '../features/users/presentation/user_management_page.dart';
import '../features/leave/presentation/leave_page.dart';
import '../features/allowance/presentation/allowance_page.dart';
import '../features/settings/presentation/settings_page.dart';
import 'widgets/workspace_sidebar.dart';
import 'widgets/workspace_topbar.dart';

/// Owns navigation only. Each feature owns its own form/filter/timer state.
class Workspace extends StatefulWidget {
  final AppStore store;
  final bool initialAdmin;
  final VoidCallback? onLogout;
  const Workspace({
    super.key,
    required this.store,
    required this.initialAdmin,
    this.onLogout,
  });
  @override
  State<Workspace> createState() => _WorkspaceState();
}

class _WorkspaceState extends State<Workspace> {
  int page = 0;
  late bool admin;
  final scaffoldKey = GlobalKey<ScaffoldState>();
  AppStore get store => widget.store;
  @override
  void initState() {
    super.initState();
    admin = widget.initialAdmin && store.canAccessAdmin;
    store.onError = (error) => showMessage(context, error);
  }

  @override
  void dispose() {
    store.onError = null;
    super.dispose();
  }

  void navigate(int value) {
    setState(() => page = value);
    if (scaffoldKey.currentState?.isDrawerOpen ?? false) Navigator.pop(context);
  }

  void switchRole(bool value) {
    if (value && !store.canAccessAdmin) return;
    setState(() {
      admin = value;
      page = 0;
    });
  }

  Widget currentPage() {
    if (!admin) {
      return EmployeeAttendancePage(
        store: store,
        page: page,
        onNavigate: navigate,
        onOpenAdmin: store.canAccessAdmin ? () => switchRole(true) : null,
      );
    }
    return switch (page) {
      1 => AttendanceRecapPage(store: store),
      2 => UserManagementPage(store: store),
      3 => LeavePage(store: store),
      4 => AllowancePage(store: store),
      5 => SettingsPage(store: store, onOpenEmployee: () => switchRole(false)),
      _ => DashboardPage(store: store, onViewAll: () => navigate(1)),
    };
  }

  Future<void> refresh() async {
    try {
      await store.refresh();
    } catch (e) {
      if (mounted) showMessage(context, '$e');
    }
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) {
      final wide = MediaQuery.sizeOf(context).width >= 1080;
      final pending = store.requests
          .where((r) => r.status == 'Menunggu')
          .length;
      Widget sidebar() => WorkspaceSidebar(
        admin: admin,
        isRemote: store.isRemote,
        page: page,
        pending: pending,
        onNavigate: navigate,
        onToggle: store.canAccessAdmin ? () => switchRole(!admin) : null,
        profile: store.currentUser,
      );
      return Scaffold(
        key: scaffoldKey,
        drawer: wide ? null : Drawer(child: sidebar()),
        body: Row(
          children: [
            if (wide) SizedBox(width: 236, child: sidebar()),
            Expanded(
              child: Column(
                children: [
                  WorkspaceTopbar(
                    wide: wide,
                    admin: admin,
                    isRemote: store.isRemote,
                    page: page,
                    pending: pending,
                    onMenu: () => scaffoldKey.currentState?.openDrawer(),
                    onRefresh: refresh,
                    displayName:
                        store.currentUser?.name ??
                        (admin ? "Admin KPU" : "Andreas Sondakh"),
                    onNotifications: store.canAccessAdmin
                        ? () {
                            if (!store.canAccessAdmin) return;
                            setState(() {
                              admin = true;
                              page = 3;
                            });
                          }
                        : null,
                    onLogout: widget.onLogout,
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      key: ValueKey('$admin-$page'),
                      padding: EdgeInsets.all(wide ? 30 : 18),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 1500),
                        child: currentPage(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    },
  );
}
