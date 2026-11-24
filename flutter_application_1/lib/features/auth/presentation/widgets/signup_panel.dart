import 'package:flutter/material.dart';
import '../../../users/domain/organization.dart';

const _navy = Color(0xFF07142F);
const _navyDark = Color(0xFF040C1D);
const _kpuRed = Color(0xFFD52832);

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

  InputDecoration _ptpInputDecoration({
    required String hint,
    required IconData prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF7F8B9F)),
      prefixIcon: Icon(prefixIcon, size: 18, color: const Color(0xFF8F9BB0)),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: const Color(0xFF1E2B45).withValues(alpha: 0.95),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF2E3F5F), width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF2E3F5F), width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: _kpuRed, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.redAccent, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _navyDark,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Background Foto Kantor KPU Sulut
          Positioned.fill(
            child: Image.asset(
              'assets/images/kantor_kpu_sulut.jpg',
              fit: BoxFit.cover,
              alignment: Alignment.center,
              errorBuilder: (context, error, stackTrace) => Container(color: _navyDark),
            ),
          ),

          // 2. Lapisan Biru Tua Transparan & Gradasi
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    _navyDark.withValues(alpha: 0.88),
                    _navy.withValues(alpha: 0.85),
                    const Color(0xFF0D224A).withValues(alpha: 0.90),
                  ],
                ),
              ),
            ),
          ),

          // 3. Konten Form Registrasi Mobile Centered
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // LOGO KPU SULUT DI ATAS CARD REGISTRASI
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.25),
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.4),
                              blurRadius: 18,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/images/logo_kpu_sulut.jpg',
                            fit: BoxFit.cover,
                            errorBuilder: (ctx, err, st) => Container(
                              color: _kpuRed,
                              child: const Icon(Icons.how_to_vote, color: Colors.white, size: 30),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      const Text(
                        'PTP-KPU SULAWESI UTARA',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFFCBD5E1),
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 3),
                      const Text(
                        'Pendaftaran Pegawai Baru',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // CARD FORM
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 26),
                        decoration: BoxDecoration(
                          color: const Color(0xFF141F36).withValues(alpha: 0.94),
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(
                            color: const Color(0xFF2E3F5F).withValues(alpha: 0.8),
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.45),
                              blurRadius: 30,
                              offset: const Offset(0, 14),
                            ),
                          ],
                        ),
                        child: AutofillGroup(
                          child: Form(
                            key: _form,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // NIP Field
                                const Text(
                                  'Nomor Induk Pegawai (NIP) *',
                                  style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 11, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _nipController,
                                  enabled: !widget.busy,
                                  keyboardType: TextInputType.number,
                                  textInputAction: TextInputAction.next,
                                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                                  decoration: _ptpInputDecoration(
                                    hint: '18 digit NIP',
                                    prefixIcon: Icons.badge_outlined,
                                  ),
                                  validator: (value) =>
                                      value == null || !validNip(value.trim())
                                      ? 'NIP harus 18 digit angka'
                                      : null,
                                ),
                                const SizedBox(height: 14),

                                // Nama Lengkap
                                const Text(
                                  'Nama Lengkap Pegawai *',
                                  style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 11, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _nameController,
                                  enabled: !widget.busy,
                                  textInputAction: TextInputAction.next,
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                  decoration: _ptpInputDecoration(
                                    hint: 'Nama lengkap beserta gelar',
                                    prefixIcon: Icons.person_outline_rounded,
                                  ),
                                  validator: (value) =>
                                      value == null || value.trim().isEmpty
                                      ? 'Nama wajib diisi'
                                      : null,
                                ),
                                const SizedBox(height: 14),

                                // Dropdown UNIT / JABATAN
                                const Text(
                                  'UNIT / JABATAN *',
                                  style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 11, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 6),
                                DropdownButtonFormField<String>(
                                  initialValue: _selectedUnitJabatan,
                                  isExpanded: true,
                                  dropdownColor: const Color(0xFF1B2844),
                                  style: const TextStyle(color: Colors.white, fontSize: 12),
                                  decoration: _ptpInputDecoration(
                                    hint: 'Pilih UNIT / JABATAN',
                                    prefixIcon: Icons.business_center_outlined,
                                  ),
                                  items: allUnitsAndPositions.map((item) {
                                    return DropdownMenuItem<String>(
                                      value: item,
                                      child: Text(
                                        item,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(color: Colors.white),
                                      ),
                                    );
                                  }).toList(),
                                  onChanged: widget.busy
                                      ? null
                                      : (val) {
                                          if (val != null) setState(() => _selectedUnitJabatan = val);
                                        },
                                ),
                                const SizedBox(height: 14),

                                // Password
                                const Text(
                                  'Kata Sandi Akun *',
                                  style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 11, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _passwordController,
                                  enabled: !widget.busy,
                                  obscureText: _obscurePassword,
                                  textInputAction: TextInputAction.next,
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                  decoration: _ptpInputDecoration(
                                    hint: 'Minimal 6 karakter',
                                    prefixIcon: Icons.lock_outline_rounded,
                                    suffixIcon: IconButton(
                                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                      icon: Icon(
                                        _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                        size: 17,
                                        color: const Color(0xFF8F9BB0),
                                      ),
                                    ),
                                  ),
                                  validator: (value) =>
                                      value == null || value.length < 6
                                      ? 'Kata sandi minimal 6 karakter'
                                      : null,
                                ),
                                const SizedBox(height: 14),

                                // Konfirmasi Password
                                const Text(
                                  'Konfirmasi Kata Sandi *',
                                  style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 11, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _confirmPasswordController,
                                  enabled: !widget.busy,
                                  obscureText: _obscureConfirm,
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                  decoration: _ptpInputDecoration(
                                    hint: 'Ulangi kata sandi',
                                    prefixIcon: Icons.lock_clock_outlined,
                                    suffixIcon: IconButton(
                                      onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                                      icon: Icon(
                                        _obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                        size: 17,
                                        color: const Color(0xFF8F9BB0),
                                      ),
                                    ),
                                  ),
                                  validator: (value) =>
                                      value != _passwordController.text
                                      ? 'Konfirmasi kata sandi tidak cocok'
                                      : null,
                                ),

                                if (widget.error != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 14),
                                    child: Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: Colors.red.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.error_outline, size: 15, color: Color(0xFFFCA5A5)),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              widget.error!,
                                              style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 11),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),

                                const SizedBox(height: 20),

                                // Tombol Daftar
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton(
                                    style: FilledButton.styleFrom(
                                      backgroundColor: _kpuRed,
                                      disabledBackgroundColor: _kpuRed.withValues(alpha: 0.5),
                                      padding: const EdgeInsets.symmetric(vertical: 15),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    onPressed: widget.busy ? null : _submit,
                                    child: widget.busy
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                          )
                                        : const Text(
                                            'Daftar Sekarang',
                                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                                          ),
                                  ),
                                ),
                                const SizedBox(height: 14),

                                // Kembali ke Login
                                Center(
                                  child: TextButton.icon(
                                    onPressed: widget.busy ? null : widget.onBackToLogin,
                                    icon: const Icon(Icons.arrow_back, size: 15, color: Color(0xFF94A3B8)),
                                    label: const Text(
                                      'Sudah punya akun? Masuk',
                                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
