import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';

class CreatePinPanel extends StatefulWidget {
  final bool busy;
  final String? error;
  final Future<void> Function(String pin) onSubmit;
  final VoidCallback onLogout;

  const CreatePinPanel({
    super.key,
    required this.busy,
    this.error,
    required this.onSubmit,
    required this.onLogout,
  });

  @override
  State<CreatePinPanel> createState() => _CreatePinPanelState();
}

class _CreatePinPanelState extends State<CreatePinPanel> {
  final _form = GlobalKey<FormState>();
  final _pin = TextEditingController();
  final _confirmPin = TextEditingController();

  @override
  void dispose() {
    _pin.dispose();
    _confirmPin.dispose();
    super.dispose();
  }

  void _submit() {
    if (widget.busy || !_form.currentState!.validate()) return;
    widget.onSubmit(_pin.text.trim());
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFF07142F),
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 8,
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Form(
                  key: _form,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDFA),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFCCFBF1), width: 2),
                        ),
                        child: const Icon(Icons.pin_rounded, color: teal, size: 32),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Buat PIN Presensi',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Sebagai pengguna baru, buat 6-digit PIN keamanan. PIN ini digunakan setiap kali melakukan absensi masuk & keluar.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 24),

                      TextFormField(
                        controller: _pin,
                        enabled: !widget.busy,
                        keyboardType: TextInputType.number,
                        obscureText: true,
                        maxLength: 6,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 22, letterSpacing: 8, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          labelText: 'Buat 6-Digit PIN',
                          counterText: '',
                          hintText: '••••••',
                          hintStyle: const TextStyle(letterSpacing: 8, color: Colors.grey),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().length != 6 || !RegExp(r'^\d{6}$').hasMatch(v.trim())) {
                            return 'PIN harus terdiri dari tepat 6 digit angka';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      TextFormField(
                        controller: _confirmPin,
                        enabled: !widget.busy,
                        keyboardType: TextInputType.number,
                        obscureText: true,
                        maxLength: 6,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 22, letterSpacing: 8, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          labelText: 'Konfirmasi 6-Digit PIN',
                          counterText: '',
                          hintText: '••••••',
                          hintStyle: const TextStyle(letterSpacing: 8, color: Colors.grey),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (v) {
                          if (v != _pin.text) {
                            return 'Konfirmasi PIN tidak cocok';
                          }
                          return null;
                        },
                      ),

                      if (widget.error != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          widget.error!,
                          style: const TextStyle(color: Colors.red, fontSize: 12),
                          textAlign: TextAlign.center,
                        ),
                      ],

                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: widget.busy ? null : widget.onLogout,
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: const Text('Keluar'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: FilledButton(
                              onPressed: widget.busy ? null : _submit,
                              style: FilledButton.styleFrom(
                                backgroundColor: teal,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: widget.busy
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text('Simpan PIN'),
                            ),
                          ),
                        ],
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
