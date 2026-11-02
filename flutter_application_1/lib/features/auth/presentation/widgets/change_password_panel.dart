import 'package:flutter/material.dart';

class ChangePasswordPanel extends StatefulWidget {
  final bool busy;
  final String? error;
  final Future<void> Function(String password) onSubmit;
  final VoidCallback onLogout;
  const ChangePasswordPanel({
    super.key,
    required this.busy,
    this.error,
    required this.onSubmit,
    required this.onLogout,
  });
  @override
  State<ChangePasswordPanel> createState() => _ChangePasswordPanelState();
}

class _ChangePasswordPanelState extends State<ChangePasswordPanel> {
  final form = GlobalKey<FormState>(),
      password = TextEditingController(),
      confirmation = TextEditingController();
  @override
  void dispose() {
    password.dispose();
    confirmation.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFF07142F),
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Form(
                  key: form,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.password_rounded, size: 38),
                      const SizedBox(height: 20),
                      const Text(
                        'Ganti password awal',
                        style: TextStyle(
                          fontSize: 23,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Sebelum mengakses aplikasi, buat password pribadi yang berbeda dari password awal. Setelah berhasil, masuk kembali menggunakan NIP dan password baru.',
                      ),
                      const SizedBox(height: 22),
                      TextFormField(
                        controller: password,
                        enabled: !widget.busy,
                        obscureText: true,
                        autofillHints: const [AutofillHints.newPassword],
                        decoration: const InputDecoration(
                          labelText: 'Password baru',
                          helperText:
                              '12–128 karakter, huruf besar, kecil, dan angka.',
                        ),
                        validator: (v) =>
                            v == null ||
                                v.length < 12 ||
                                v.length > 128 ||
                                !RegExp('[a-z]').hasMatch(v) ||
                                !RegExp('[A-Z]').hasMatch(v) ||
                                !RegExp('[0-9]').hasMatch(v)
                            ? 'Password belum memenuhi ketentuan'
                            : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: confirmation,
                        enabled: !widget.busy,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Ulangi password baru',
                        ),
                        validator: (v) =>
                            v != password.text ? 'Password tidak sama' : null,
                      ),
                      if (widget.error != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 14),
                          child: Text(
                            widget.error!,
                            style: const TextStyle(color: Colors.red),
                          ),
                        ),
                      const SizedBox(height: 22),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: widget.busy
                              ? null
                              : () {
                                  if (form.currentState!.validate()) {
                                    widget.onSubmit(password.text);
                                  }
                                },
                          child: Text(
                            widget.busy
                                ? 'Memproses...'
                                : 'Simpan password baru',
                          ),
                        ),
                      ),
                      TextButton(
                        onPressed: widget.busy ? null : widget.onLogout,
                        child: const Text('Keluar'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
