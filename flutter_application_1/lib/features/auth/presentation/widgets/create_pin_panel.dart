import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/colors.dart';

const _weakPins = {
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
  '123456',
  '654321',
  '012345',
  '543210',
};

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
    FocusScope.of(context).unfocus();
    widget.onSubmit(_pin.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: navy,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
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
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: kpuRedSoft,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: kpuRedBorder),
                        ),
                        child: const Icon(Icons.pin_rounded, color: kpuRed, size: 28),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Buat PIN Presensi',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: ink,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'PIN 6 digit disimpan terenkripsi di server dan digunakan untuk memverifikasi presensi masuk & keluar Anda.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12.5, color: muted, height: 1.45),
                      ),
                      const SizedBox(height: 22),

                      TextFormField(
                        controller: _pin,
                        enabled: !widget.busy,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(6),
                        ],
                        obscureText: true,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 22,
                          letterSpacing: 8,
                          fontWeight: FontWeight.w700,
                          color: ink,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'PIN Baru (6 Digit)',
                          hintText: '••••••',
                        ),
                        validator: (v) {
                          final val = v?.trim() ?? '';
                          if (!RegExp(r'^\d{6}$').hasMatch(val)) {
                            return 'PIN harus terdiri dari 6 digit angka';
                          }
                          if (_weakPins.contains(val)) {
                            return 'Hindari pola mudah ditebak seperti 123456';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      TextFormField(
                        controller: _confirmPin,
                        enabled: !widget.busy,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(6),
                        ],
                        obscureText: true,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 22,
                          letterSpacing: 8,
                          fontWeight: FontWeight.w700,
                          color: ink,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'Konfirmasi PIN Baru',
                          hintText: '••••••',
                        ),
                        validator: (v) =>
                            v != _pin.text ? 'Konfirmasi PIN tidak cocok' : null,
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
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: danger, fontSize: 12.5),
                          ),
                        ),
                      ],

                      const SizedBox(height: 22),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: widget.busy ? null : widget.onLogout,
                              child: const Text('Keluar'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: FilledButton(
                              onPressed: widget.busy ? null : _submit,
                              child: widget.busy
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
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
    );
  }
}
