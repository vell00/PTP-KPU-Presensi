import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/data/app_store.dart';
import '../application/auth_controller.dart';
import 'widgets/login_panel.dart';
import 'widgets/change_password_panel.dart';

class FirebaseLogin extends StatefulWidget {
  final SharedPreferences prefs;
  final Widget Function(AppStore store, VoidCallback logout) workspace;
  const FirebaseLogin({
    super.key,
    required this.prefs,
    required this.workspace,
  });
  @override
  State<FirebaseLogin> createState() => _FirebaseLoginState();
}

class _FirebaseLoginState extends State<FirebaseLogin> {
  late final AuthController controller;
  @override
  void initState() {
    super.initState();
    controller = AuthController(prefs: widget.prefs);
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) {
      if (controller.profile?.mustChangePassword == true) {
        return ChangePasswordPanel(
          busy: controller.busy,
          error: controller.error,
          onSubmit: controller.changeInitialPassword,
          onLogout: controller.logout,
        );
      }
      if (controller.store != null) {
        return widget.workspace(controller.store!, controller.logout);
      }
      return LoginPanel(
        busy: controller.busy,
        error: controller.error,
        notice: controller.notice,
        onSubmit: controller.login,
      );
    },
  );
}
