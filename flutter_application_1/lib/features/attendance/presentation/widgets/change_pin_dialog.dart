import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../../core/data/app_store.dart';
import '../../../../core/ui/components.dart';
import '../../../users/domain/user_profile.dart';

const _red = Color(0xFFD52832);

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

    final currentPin = widget.store.currentUser?.pin;
    final enteredOldPin = _oldPinController.text.trim();
    final newPin = _newPinController.text.trim();

    // Validasi PIN lama jika user sudah punya PIN sebelumnya
    if (currentPin != null && currentPin.isNotEmpty) {
      if (enteredOldPin != currentPin) {
        setState(() {
          _errorMessage = 'PIN saat ini salah.';
        });
        return;
      }
    }

    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    try {
      final user = widget.store.currentUser;
      final firebaseUid = FirebaseAuth.instance.currentUser?.uid;
      final uid = firebaseUid ?? user?.uid ?? '';
      if (user != null && uid.isNotEmpty) {
        // Update ke Cloud Firestore
        await FirebaseFirestore.instance.collection('users').doc(uid).set({
          'pin': newPin,
        }, SetOptions(merge: true));

        // Update UserProfile di AppStore
        final updatedData = {
          'uid': uid,
          'nip': user.nip,
          'name': user.name,
          'role': user.role.name,
          'departmentId': user.departmentId,
          'subdepartmentId': user.subdepartmentId,
          'password': user.password,
          'pin': newPin,
          'isAdmin': user.isAdmin,
          'active': user.active,
          'mustChangePassword': user.mustChangePassword,
        };
        widget.store.currentUser = UserProfile.fromJson(updatedData);
      }

      if (mounted) {
        Navigator.pop(context, true);
        showMessage(context, 'PIN presensi berhasil diperbarui.');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Gagal menyimpan PIN baru: $e';
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasExistingPin = widget.store.currentUser?.pin != null && widget.store.currentUser!.pin!.isNotEmpty;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 400),
        child: Padding(
          padding: const EdgeInsets.all(24),
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
                        color: _red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.pin_rounded, color: _red, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          text(hasExistingPin ? 'Ganti PIN Presensi' : 'Atur PIN Presensi', size: 17, weight: FontWeight.w700),
                          text('Gunakan 6 digit angka untuk verifikasi absensi', size: 11, color: muted),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                if (hasExistingPin) ...[
                  TextFormField(
                    controller: _oldPinController,
                    enabled: !_busy,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 6,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 20, letterSpacing: 6, fontWeight: FontWeight.bold),
                    decoration: InputDecoration(
                      labelText: 'PIN Saat Ini',
                      counterText: '',
                      hintText: '••••••',
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().length != 6) {
                        return 'Masukkan 6 digit PIN saat ini';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 14),
                ],

                TextFormField(
                  controller: _newPinController,
                  enabled: !_busy,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 20, letterSpacing: 6, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    labelText: 'PIN Baru (6 Digit)',
                    counterText: '',
                    hintText: '••••••',
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().length != 6 || !RegExp(r'^\d{6}$').hasMatch(v.trim())) {
                      return 'PIN baru harus 6 digit angka';
                    }
                    if (hasExistingPin && v.trim() == _oldPinController.text.trim()) {
                      return 'PIN baru harus berbeda dari PIN saat ini';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _confirmPinController,
                  enabled: !_busy,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 20, letterSpacing: 6, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    labelText: 'Konfirmasi PIN Baru',
                    counterText: '',
                    hintText: '••••••',
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  validator: (v) {
                    if (v != _newPinController.text) {
                      return 'Konfirmasi PIN baru tidak cocok';
                    }
                    return null;
                  },
                ),

                if (_errorMessage != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w500),
                  ),
                ],

                const SizedBox(height: 22),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _busy ? null : () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('Batal'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        onPressed: _busy ? null : _submit,
                        style: FilledButton.styleFrom(
                          backgroundColor: _red,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: _busy
                            ? const SizedBox(
                                width: 18,
                                height: 18,
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
    );
  }
}
