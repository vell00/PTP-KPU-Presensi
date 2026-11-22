import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/data/app_store.dart';
import '../application/auth_controller.dart';
import 'widgets/login_panel.dart';
import 'widgets/signup_panel.dart';
import 'widgets/change_password_panel.dart';
import 'widgets/create_pin_panel.dart';

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
  bool _showSignUp = false;

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
      if (controller.profile?.mustCreatePin == true) {
        return CreatePinPanel(
          busy: controller.busy,
          error: controller.error,
          onSubmit: controller.createInitialPin,
          onLogout: controller.logout,
        );
      }
      if (controller.store != null) {
        return widget.workspace(controller.store!, controller.logout);
      }
      if (_showSignUp) {
        return SignUpPanel(
          busy: controller.busy,
          error: controller.error,
          notice: controller.notice,
          onSubmit: ({
            required String nip,
            required String name,
            required String unitJabatan,
            required String password,
          }) async {
            await controller.signUp(
              nip: nip,
              name: name,
              unitJabatan: unitJabatan,
              password: password,
            );
            if (controller.error == null && mounted) {
              setState(() => _showSignUp = false);
            }
          },
          onBackToLogin: () {
            controller.error = null;
            controller.notice = null;
            setState(() => _showSignUp = false);
          },
        );
      }
      return LoginPanel(
        busy: controller.busy,
        error: controller.error,
        notice: controller.notice,
        onSubmit: controller.login,
        onOpenSignUp: () {
          controller.error = null;
          controller.notice = null;
          setState(() => _showSignUp = true);
        },
      );
    },
  );
}
