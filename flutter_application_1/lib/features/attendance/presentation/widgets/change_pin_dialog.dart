import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../../../../core/data/app_store.dart';
import '../../../../core/ui/components.dart';

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

class ChangePinDialog extends StatefulWidget {
  final AppStore store;
  const ChangePinDialog({super.key, required this.store});

  @override
  State<ChangePinDialog> createState() => _ChangePinDialogState();
}

class _ChangePinDialogState extends State<ChangePinDialog> {
  final _formKey = GlobalKey<FormState>();
  final _oldPinController = TextEditingController();
  final _newPinController = TextEditingController();
  final _confirmPinController = TextEditingController();

  bool _busy = false;
  String? _errorMessage;

  @override
  void dispose() {
    _oldPinController.dispose();
    _newPinController.dispose();
    _confirmPinController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy || !_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    try {
      final hasPin = widget.store.currentUser?.hasPin == true;
      await FirebaseFunctions.instanceFor(region: 'asia-southeast2')
          .httpsCallable('setAttendancePin')
          .call(<String, dynamic>{
            if (hasPin) 'currentPin': _oldPinController.text.trim(),
            'newPin': _newPinController.text.trim(),
          });

      if (widget.store.currentUser != null) {
        widget.store.setCurrentUser(
          widget.store.currentUser!.copyWith(hasPin: true),
        );
      }

      if (mounted) {
        Navigator.pop(context, true);
        showMessage(context, 'PIN presensi berhasil diperbarui secara aman.');
      }
    } on FirebaseFunctionsException catch (e) {
      if (mounted) {
        setState(() => _errorMessage = e.message ?? 'Gagal memperbarui PIN.');
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => _errorMessage =
              'Gagal menyimpan PIN: ${e.toString().replaceFirst('Exception: ', '')}',
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasExistingPin = widget.store.currentUser?.hasPin == true;

    return Dialog(
      backgroundColor: surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 400),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(22),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: kpuRedSoft,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.pin_rounded, color: kpuRed, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          text(
                            hasExistingPin ? 'Ganti PIN Presensi' : 'Atur PIN Presensi',
                            size: 16.5,
                            weight: FontWeight.w700,
                          ),
                          text(
                            'PIN 6 digit terenkripsi untuk verifikasi absensi',
                            size: 11.5,
                            color: muted,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                if (hasExistingPin) ...[
                  TextFormField(
                    controller: _oldPinController,
                    enabled: !_busy,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    obscureText: true,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 20,
                      letterSpacing: 6,
                      fontWeight: FontWeight.w700,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'PIN Saat Ini',
                      hintText: '••••••',
                    ),
                    validator: (v) => (v == null || v.trim().length != 6)
                        ? 'Masukkan 6 digit PIN saat ini'
                        : null,
                  ),
                  const SizedBox(height: 12),
                ],

                TextFormField(
                  controller: _newPinController,
                  enabled: !_busy,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  obscureText: true,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 20,
                    letterSpacing: 6,
                    fontWeight: FontWeight.w700,
                  ),
                  decoration: const InputDecoration(
                    labelText: 'PIN Baru (6 Digit)',
                    hintText: '••••••',
                  ),
                  validator: (v) {
                    final val = v?.trim() ?? '';
                    if (!RegExp(r'^\d{6}$').hasMatch(val)) {
                      return 'PIN baru harus 6 digit angka';
                    }
                    if (_weakPins.contains(val)) {
                      return 'Hindari pola mudah ditebak seperti 123456';
                    }
                    if (hasExistingPin && val == _oldPinController.text.trim()) {
                      return 'PIN baru harus berbeda dari PIN saat ini';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                TextFormField(
                  controller: _confirmPinController,
                  enabled: !_busy,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  obscureText: true,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 20,
                    letterSpacing: 6,
                    fontWeight: FontWeight.w700,
                  ),
                  decoration: const InputDecoration(
                    labelText: 'Konfirmasi PIN Baru',
                    hintText: '••••••',
                  ),
                  validator: (v) =>
                      v != _newPinController.text ? 'Konfirmasi PIN baru tidak cocok' : null,
                ),

                if (_errorMessage != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _errorMessage!,
                    style: const TextStyle(color: danger, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],

                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _busy ? null : () => Navigator.pop(context),
                        child: const Text('Batal'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton(
                        onPressed: _busy ? null : _submit,
                        child: _busy
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
    );
  }
}
