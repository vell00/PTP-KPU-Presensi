import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';

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
  final _form = GlobalKey<FormState>();
  final _password = TextEditingController();
  final _confirmation = TextEditingController();
  bool _obscure1 = true;
  bool _obscure2 = true;

  @override
  void dispose() {
    _password.dispose();
    _confirmation.dispose();
    super.dispose();
  }

  Widget _requirementRow(String label, bool met) => Row(
    children: [
      Icon(
        met ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
        size: 15,
        color: met ? success : muted,
      ),
      const SizedBox(width: 6),
      Text(
        label,
        style: TextStyle(
          fontSize: 12,
          color: met ? success : muted,
          fontWeight: met ? FontWeight.w600 : FontWeight.w400,
        ),
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: navy,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: surface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: line),
                ),
                child: Form(
                  key: _form,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: surfaceMuted,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.password_rounded, color: navy, size: 24),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Ganti Kata Sandi Awal',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: ink,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Buat kata sandi pribadi sebelum mulai mencatat presensi. Setelah tersimpan, masuk kembali dengan kata sandi baru Anda.',
                        style: TextStyle(fontSize: 13, color: muted, height: 1.45),
                      ),
                      const SizedBox(height: 20),

                      TextFormField(
                        controller: _password,
                        enabled: !widget.busy,
                        obscureText: _obscure1,
                        onChanged: (_) => setState(() {}),
                        autofillHints: const [AutofillHints.newPassword],
                        decoration: InputDecoration(
                          labelText: 'Kata sandi baru',
                          prefixIcon: const Icon(Icons.lock_outline_rounded, size: 19),
                          suffixIcon: IconButton(
                            tooltip: _obscure1 ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi',
                            onPressed: () => setState(() => _obscure1 = !_obscure1),
                            icon: Icon(
                              _obscure1
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              size: 19,
                            ),
                          ),
                        ),
                        validator: (v) =>
                            v == null ||
                                v.length < 12 ||
                                v.length > 128 ||
                                !RegExp('[a-z]').hasMatch(v) ||
                                !RegExp('[A-Z]').hasMatch(v) ||
                                !RegExp('[0-9]').hasMatch(v)
                            ? 'Kata sandi belum memenuhi syarat keamanan'
                            : null,
                      ),
                      const SizedBox(height: 10),

                      // Live Strength Checklist
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: canvas,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: line),
                        ),
                        child: Column(
                          children: [
                            _requirementRow('Minimal 12 karakter', _password.text.length >= 12),
                            const SizedBox(height: 4),
                            _requirementRow('Huruf besar (A–Z)', RegExp('[A-Z]').hasMatch(_password.text)),
                            const SizedBox(height: 4),
                            _requirementRow('Huruf kecil (a–z)', RegExp('[a-z]').hasMatch(_password.text)),
                            const SizedBox(height: 4),
                            _requirementRow('Mengandung angka (0–9)', RegExp('[0-9]').hasMatch(_password.text)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      TextFormField(
                        controller: _confirmation,
                        enabled: !widget.busy,
                        obscureText: _obscure2,
                        decoration: InputDecoration(
                          labelText: 'Ulangi kata sandi baru',
                          prefixIcon: const Icon(Icons.lock_reset_rounded, size: 19),
                          suffixIcon: IconButton(
                            tooltip: _obscure2 ? 'Tampilkan konfirmasi' : 'Sembunyikan konfirmasi',
                            onPressed: () => setState(() => _obscure2 = !_obscure2),
                            icon: Icon(
                              _obscure2
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              size: 19,
                            ),
                          ),
                        ),
                        validator: (v) =>
                            v != _password.text ? 'Konfirmasi kata sandi tidak cocok' : null,
                      ),

                      if (widget.error != null) ...[
                        const SizedBox(height: 14),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: dangerBg,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: dangerBorder),
                          ),
                          child: Text(
                            widget.error!,
                            style: const TextStyle(color: danger, fontSize: 12.5),
                          ),
                        ),
                      ],

                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: widget.busy
                              ? null
                              : () {
                                  if (_form.currentState!.validate()) {
                                    widget.onSubmit(_password.text);
                                  }
                                },
                          child: Text(
                            widget.busy ? 'Memproses...' : 'Simpan Kata Sandi Baru',
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: widget.busy ? null : widget.onLogout,
                          child: const Text('Keluar'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
