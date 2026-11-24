import 'package:flutter/material.dart';
import '../../../users/domain/organization.dart';

const _navy = Color(0xFF07142F);
const _navyDark = Color(0xFF040C1D);
const _kpuRed = Color(0xFFD52832);

class LoginPanel extends StatefulWidget {
  final bool busy;
  final String? error;
  final String? notice;
  final Future<void> Function(String nip, String password) onSubmit;
  final VoidCallback onOpenSignUp;

  const LoginPanel({
    super.key,
    required this.busy,
    this.error,
    this.notice,
    required this.onSubmit,
    required this.onOpenSignUp,
  });

  @override
  State<LoginPanel> createState() => _LoginPanelState();
}

class _LoginPanelState extends State<LoginPanel> {
  final _form = GlobalKey<FormState>();
  final _nip = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _nip.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (widget.busy || !_form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    await widget.onSubmit(_nip.text.trim(), _password.text);
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
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
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

          // 2. Lapisan Biru Tua Transparan KPU
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

          // 3. Konten Mobile Centered
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // LOGO KPU SULUT DI ATAS CARD LOGIN
                      Container(
                        width: 84,
                        height: 84,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.25),
                            width: 2.5,
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
                            errorBuilder: (context, error, stackTrace) => Container(
                              color: _kpuRed,
                              child: const Icon(Icons.how_to_vote, color: Colors.white, size: 36),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Teks Judul Instansi
                      const Text(
                        'KOMISI PEMILIHAN UMUM',
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
                        'Provinsi Sulawesi Utara',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'PTP-KPU Presensi Pegawai',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFF93A7C7),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 22),

                      // CARD FORM LOGIN
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 28),
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
                                // Badge Akses Pegawai
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                      decoration: BoxDecoration(
                                        color: _kpuRed.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: _kpuRed.withValues(alpha: 0.3)),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: const [
                                          Icon(Icons.lock_outline_rounded, size: 13, color: Color(0xFFEE5A62)),
                                          SizedBox(width: 5),
                                          Text(
                                            'AKSES PEGAWAI',
                                            style: TextStyle(
                                              color: Color(0xFFEE5A62),
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                              letterSpacing: 0.8,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 14),

                                // Title Selamat Datang
                                const Text(
                                  'Selamat datang',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Silakan masuk ke akun PTP-KPU Anda.',
                                  style: TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 12,
                                  ),
                                ),
                                const SizedBox(height: 20),

                                // Label NIP
                                const Text(
                                  'Nomor Induk Pegawai (NIP)',
                                  style: TextStyle(
                                    color: Color(0xFFE2E8F0),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _nip,
                                  enabled: !widget.busy,
                                  keyboardType: TextInputType.number,
                                  textInputAction: TextInputAction.next,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  autofillHints: const [AutofillHints.username],
                                  decoration: _ptpInputDecoration(
                                    hint: 'Masukkan 18 digit NIP',
                                    prefixIcon: Icons.badge_outlined,
                                  ),
                                  validator: (value) =>
                                      value == null || !validNip(value.trim())
                                      ? 'NIP harus 18 digit angka'
                                      : null,
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Gunakan NIP sesuai identitas kepegawaian Anda.',
                                  style: TextStyle(
                                    color: Color(0xFF6B7D98),
                                    fontSize: 10,
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Label Kata Sandi
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'Kata sandi',
                                      style: TextStyle(
                                        color: Color(0xFFE2E8F0),
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    Text(
                                      'Lupa kata sandi?',
                                      style: TextStyle(
                                        color: const Color(0xFF8B9FB8),
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _password,
                                  enabled: !widget.busy,
                                  obscureText: _obscure,
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                  autofillHints: const [AutofillHints.password],
                                  onFieldSubmitted: (_) => _submit(),
                                  decoration: _ptpInputDecoration(
                                    hint: 'Masukkan kata sandi',
                                    prefixIcon: Icons.lock_outline_rounded,
                                    suffixIcon: IconButton(
                                      tooltip: _obscure ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi',
                                      onPressed: () => setState(() => _obscure = !_obscure),
                                      icon: Icon(
                                        _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                        size: 18,
                                        color: const Color(0xFF8F9BB0),
                                      ),
                                    ),
                                  ),
                                  validator: (value) =>
                                      value == null || value.isEmpty
                                      ? 'Kata sandi wajib diisi'
                                      : null,
                                ),

                                // Notice & Error Alerts
                                if (widget.notice != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 12),
                                    child: Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: Colors.blue.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
                                      ),
                                      child: Text(
                                        widget.notice!,
                                        style: const TextStyle(
                                          color: Color(0xFF93C5FD),
                                          fontWeight: FontWeight.w600,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                  ),

                                if (widget.error != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 12),
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
                                              style: const TextStyle(
                                                color: Color(0xFFFCA5A5),
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),

                                const SizedBox(height: 20),

                                // Tombol Masuk ke Portal (Merah KPU)
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton(
                                    style: FilledButton.styleFrom(
                                      backgroundColor: _kpuRed,
                                      disabledBackgroundColor: _kpuRed.withValues(alpha: 0.5),
                                      padding: const EdgeInsets.symmetric(vertical: 15),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      elevation: 2,
                                    ),
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
                                        : Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: const [
                                              Text(
                                                'Masuk ke portal',
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.white,
                                                ),
                                              ),
                                              SizedBox(width: 8),
                                              Icon(Icons.arrow_forward_rounded, size: 17, color: Colors.white),
                                            ],
                                          ),
                                  ),
                                ),

                                const SizedBox(height: 16),

                                // Registrasi / Sign Up Link
                                Center(
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Text(
                                        'Belum memiliki akun? ',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF94A3B8),
                                        ),
                                      ),
                                      GestureDetector(
                                        onTap: widget.busy ? null : widget.onOpenSignUp,
                                        child: const Text(
                                          'Daftar akun baru',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Color(0xFFEE5A62),
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(height: 18),
                                const Divider(color: Color(0xFF263550)),
                                const SizedBox(height: 10),

                                // Keamanan Footer Card
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: const [
                                    Icon(Icons.verified_user_outlined, size: 14, color: Color(0xFF6B7D98)),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Akses khusus pegawai terdaftar. Jaga kerahasiaan akun dan PIN presensi Anda.',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Color(0xFF6B7D98),
                                          height: 1.4,
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

                      const SizedBox(height: 20),
                      // Footer Copyright Singkat
                      const Text(
                        '© 2026 KPU Provinsi Sulawesi Utara',
                        style: TextStyle(
                          color: Color(0xFF6B7D98),
                          fontSize: 11,
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
