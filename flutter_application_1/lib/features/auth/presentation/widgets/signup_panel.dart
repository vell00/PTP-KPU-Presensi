import 'package:flutter/material.dart';
import 'office_illustration.dart';
import '../../../users/domain/organization.dart';

const _navy = Color(0xFF07142F);
const _red = Color(0xFFD52832);

class SignUpPanel extends StatefulWidget {
  final bool busy;
  final String? error;
  final String? notice;
  final Future<void> Function({
    required String nip,
    required String name,
    required String unitJabatan,
    required String password,
  }) onSubmit;
  final VoidCallback onBackToLogin;

  const SignUpPanel({
    super.key,
    required this.busy,
    this.error,
    this.notice,
    required this.onSubmit,
    required this.onBackToLogin,
  });

  @override
  State<SignUpPanel> createState() => _SignUpPanelState();
}

class _SignUpPanelState extends State<SignUpPanel> {
  final _form = GlobalKey<FormState>();
  final _nipController = TextEditingController();
  final _nameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  String _selectedUnitJabatan = allUnitsAndPositions.first;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _nipController.dispose();
    _nameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (widget.busy || !_form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    await widget.onSubmit(
      nip: _nipController.text.trim(),
      name: _nameController.text.trim(),
      unitJabatan: _selectedUnitJabatan,
      password: _passwordController.text,
    );
  }

  InputDecoration _decoration(String hint, IconData icon) => InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF8E96A4)),
        prefixIcon: Icon(icon, size: 18, color: const Color(0xFF9199A7)),
        filled: true,
        fillColor: const Color(0xFFF3F4F6),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(11),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(11),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(11),
          borderSide: const BorderSide(color: _red),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: _navy,
        body: Container(
          decoration: const BoxDecoration(
            gradient: RadialGradient(
              center: Alignment(0, -.8),
              radius: 1.2,
              colors: [Color(0xFF16366C), _navy],
            ),
          ),
          child: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(24, 30, 24, 24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: .24),
                          blurRadius: 40,
                          offset: const Offset(0, 20),
                        ),
                      ],
                    ),
                    child: Form(
                      key: _form,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const OfficeIllustration(),
                          const SizedBox(height: 14),
                          const Text(
                            'Daftar Akun Pegawai',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: _navy,
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'KPU Provinsi Sulawesi Utara',
                            style: TextStyle(
                              color: Color(0xFF7A8393),
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 20),

                          // NIP
                          TextFormField(
                            controller: _nipController,
                            enabled: !widget.busy,
                            keyboardType: TextInputType.number,
                            maxLength: 18,
                            decoration: _decoration(
                              'NIP (18 digit angka)',
                              Icons.badge_outlined,
                            ).copyWith(counterText: ''),
                            validator: (value) {
                              if (value == null || !validNip(value.trim())) {
                                return 'NIP harus tepat 18 digit angka';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),

                          // Nama Lengkap
                          TextFormField(
                            controller: _nameController,
                            enabled: !widget.busy,
                            textCapitalization: TextCapitalization.words,
                            decoration: _decoration(
                              'Nama Lengkap',
                              Icons.person_outline_rounded,
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Nama lengkap wajib diisi';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),

                          // Dropdown UNIT / JABATAN
                          DropdownButtonFormField<String>(
                            initialValue: _selectedUnitJabatan,
                            isExpanded: true,
                            decoration: _decoration(
                              'UNIT / JABATAN',
                              Icons.work_outline_rounded,
                            ),
                            style: const TextStyle(
                              color: _navy,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                            items: allUnitsAndPositions.map((unit) {
                              return DropdownMenuItem<String>(
                                value: unit,
                                child: Text(
                                  unit,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 12),
                                ),
                              );
                            }).toList(),
                            onChanged: widget.busy
                                ? null
                                : (val) {
                                    if (val != null) {
                                      setState(() => _selectedUnitJabatan = val);
                                    }
                                  },
                            validator: (val) {
                              if (val == null || val.isEmpty) {
                                return 'Pilih UNIT / JABATAN';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),

                          // Password
                          TextFormField(
                            controller: _passwordController,
                            enabled: !widget.busy,
                            obscureText: _obscurePassword,
                            decoration: _decoration(
                              'Password Login (minimal 6 karakter)',
                              Icons.lock_outline_rounded,
                            ).copyWith(
                              suffixIcon: IconButton(
                                onPressed: () => setState(
                                    () => _obscurePassword = !_obscurePassword),
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_off_outlined
                                      : Icons.visibility_outlined,
                                  size: 18,
                                  color: const Color(0xFF9199A7),
                                ),
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.length < 6) {
                                return 'Password minimal 6 karakter';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),

                          // Konfirmasi Password
                          TextFormField(
                            controller: _confirmPasswordController,
                            enabled: !widget.busy,
                            obscureText: _obscureConfirm,
                            decoration: _decoration(
                              'Konfirmasi Password',
                              Icons.lock_reset_rounded,
                            ).copyWith(
                              suffixIcon: IconButton(
                                onPressed: () => setState(
                                    () => _obscureConfirm = !_obscureConfirm),
                                icon: Icon(
                                  _obscureConfirm
                                      ? Icons.visibility_off_outlined
                                      : Icons.visibility_outlined,
                                  size: 18,
                                  color: const Color(0xFF9199A7),
                                ),
                              ),
                            ),
                            validator: (value) {
                              if (value != _passwordController.text) {
                                return 'Konfirmasi password tidak cocok';
                              }
                              return null;
                            },
                          ),

                          if (widget.notice != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 12),
                              child: Text(
                                widget.notice!,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: _navy,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                            ),

                          if (widget.error != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 12),
                              child: Text(
                                widget.error!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: _red,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),

                          const SizedBox(height: 20),

                          SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                              style: FilledButton.styleFrom(
                                backgroundColor: _red,
                                disabledBackgroundColor: const Color(0xFFEAA5AA),
                                padding: const EdgeInsets.symmetric(vertical: 15),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(11),
                                ),
                              ),
                              onPressed: widget.busy ? null : _submit,
                              icon: widget.busy
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Icon(Icons.person_add_rounded, size: 18),
                              label: Text(
                                widget.busy ? 'Mendaftarkan...' : 'Daftar Sekarang',
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text(
                                'Sudah punya akun? ',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF7A8393),
                                ),
                              ),
                              GestureDetector(
                                onTap: widget.busy ? null : widget.onBackToLogin,
                                child: const Text(
                                  'Masuk di sini',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: _red,
                                    fontWeight: FontWeight.bold,
                                  ),
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