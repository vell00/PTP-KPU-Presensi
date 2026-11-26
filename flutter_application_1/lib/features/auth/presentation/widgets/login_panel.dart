import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/colors.dart';
import '../../../users/domain/organization.dart';

class LoginPanel extends StatefulWidget {
  final bool busy;
  final String? error;
  final String? notice;
  final Future<void> Function(String nip, String password) onSubmit;

  const LoginPanel({
    super.key,
    required this.busy,
    this.error,
    this.notice,
    required this.onSubmit,
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

  void _showForgotPasswordInfo() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Lupa Kata Sandi?',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
        content: const Text(
          'Demi keamanan akun ASN, pengaturan ulang kata sandi dilakukan oleh Administrator Sekretariat KPU Provinsi Sulawesi Utara melalui Portal Admin.\n\nHubungi Subbagian SDM dengan menyertakan NIP Anda untuk mereset kata sandi ke sandi awal.',
          style: TextStyle(fontSize: 13.5, color: inkSecondary, height: 1.5),
        ),
        actions: [
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: navy),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Mengerti'),
          ),
        ],
      ),
    );
  }

  InputDecoration _darkInput({
    required String hint,
    required IconData prefixIcon,
    Widget? suffixIcon,
  }) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(fontSize: 13.5, color: Color(0xFF94A3B8)),
    prefixIcon: Icon(prefixIcon, size: 19, color: const Color(0xFFCBD5E1)),
    suffixIcon: suffixIcon,
    filled: true,
    fillColor: const Color(0xFF172544),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFF334155)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFF334155)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: kpuRed, width: 1.6),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFFCA5A5)),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFFCA5A5), width: 1.6),
    ),
    errorStyle: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 11.5),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: navyDark,
      body: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: 0.28,
              child: Image.asset(
                'assets/images/kantor_kpu_sulut.jpg',
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => const SizedBox.shrink(),
              ),
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    navyDark.withValues(alpha: 0.90),
                    navy.withValues(alpha: 0.94),
                    navyDark.withValues(alpha: 0.98),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Institutional Brand Mark
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.28),
                            width: 2,
                          ),
                        ),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/images/logo_kpu_sulut.jpg',
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => Container(
                              color: kpuRed,
                              child: const Icon(
                                Icons.how_to_vote_rounded,
                                color: Colors.white,
                                size: 32,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'Presensi KPU Sulawesi Utara',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Aplikasi Kehadiran Pegawai • Zona WITA (UTC+8)',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFFCBD5E1),
                          fontSize: 12.5,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Auth Card
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0E1B36),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFF283A5E)),
                        ),
                        child: AutofillGroup(
                          child: Form(
                            key: _form,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text(
                                  'Masuk Akun Pegawai',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Gunakan 18 digit NIP dan kata sandi kepegawaian Anda.',
                                  style: TextStyle(
                                    color: Color(0xFFCBD5E1),
                                    fontSize: 12.5,
                                  ),
                                ),
                                const SizedBox(height: 20),

                                // NIP Label + Counter
                                ValueListenableBuilder<TextEditingValue>(
                                  valueListenable: _nip,
                                  builder: (_, val, _) => Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text(
                                        'Nomor Induk Pegawai (NIP)',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text(
                                        '${val.text.length}/18',
                                        style: const TextStyle(
                                          color: Color(0xFFCBD5E1),
                                          fontSize: 11.5,
                                          fontFeatures: [FontFeature.tabularFigures()],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _nip,
                                  enabled: !widget.busy,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                    LengthLimitingTextInputFormatter(18),
                                  ],
                                  textInputAction: TextInputAction.next,
                                  autofillHints: const [AutofillHints.username],
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    fontFeatures: [FontFeature.tabularFigures()],
                                  ),
                                  decoration: _darkInput(
                                    hint: 'Contoh: 198503152010011002',
                                    prefixIcon: Icons.badge_outlined,
                                  ),
                                  validator: (value) =>
                                      value == null || !validNip(value.trim())
                                      ? 'NIP harus terdiri dari 18 digit angka'
                                      : null,
                                ),
                                const SizedBox(height: 16),

                                // Password Label + Interactive Forgot Link
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'Kata Sandi',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: widget.busy ? null : _showForgotPasswordInfo,
                                      style: TextButton.styleFrom(
                                        foregroundColor: const Color(0xFF93C5FD),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 4,
                                        ),
                                        minimumSize: const Size(48, 36),
                                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      ),
                                      child: const Text(
                                        'Lupa kata sandi?',
                                        style: TextStyle(fontSize: 12),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _password,
                                  enabled: !widget.busy,
                                  obscureText: _obscure,
                                  autofillHints: const [AutofillHints.password],
                                  onFieldSubmitted: (_) => _submit(),
                                  style: const TextStyle(color: Colors.white, fontSize: 14),
                                  decoration: _darkInput(
                                    hint: 'Masukkan kata sandi',
                                    prefixIcon: Icons.lock_outline_rounded,
                                    suffixIcon: IconButton(
                                      tooltip: _obscure
                                          ? 'Tampilkan kata sandi'
                                          : 'Sembunyikan kata sandi',
                                      onPressed: () => setState(() => _obscure = !_obscure),
                                      icon: Icon(
                                        _obscure
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined,
                                        size: 19,
                                        color: const Color(0xFFCBD5E1),
                                      ),
                                    ),
                                  ),
                                  validator: (value) =>
                                      value == null || value.isEmpty
                                      ? 'Kata sandi wajib diisi'
                                      : null,
                                ),

                                if (widget.notice != null) ...[
                                  const SizedBox(height: 14),
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: info.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: const Color(0xFF60A5FA).withValues(alpha: 0.5),
                                      ),
                                    ),
                                    child: Text(
                                      widget.notice!,
                                      style: const TextStyle(
                                        color: Color(0xFFDBEAFE),
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],

                                if (widget.error != null) ...[
                                  const SizedBox(height: 14),
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: danger.withValues(alpha: 0.22),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: const Color(0xFFFCA5A5).withValues(alpha: 0.5),
                                      ),
                                    ),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Icon(
                                          Icons.error_outline_rounded,
                                          size: 16,
                                          color: Color(0xFFFCA5A5),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            widget.error!,
                                            style: const TextStyle(
                                              color: Color(0xFFFEE2E2),
                                              fontSize: 12,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],

                                const SizedBox(height: 20),
                                SizedBox(
                                  width: double.infinity,
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
                                        : const Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text('Masuk ke Portal'),
                                              SizedBox(width: 8),
                                              Icon(Icons.arrow_forward_rounded, size: 18),
                                            ],
                                          ),
                                  ),
                                ),

                                const SizedBox(height: 18),
                                const Divider(color: Color(0xFF283A5E)),
                                const SizedBox(height: 12),
                                const Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(
                                      Icons.verified_user_outlined,
                                      size: 16,
                                      color: Color(0xFFCBD5E1),
                                    ),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Akun pegawai didaftarkan secara terpusat oleh Administrator Sekretariat KPU Sulut.',
                                        style: TextStyle(
                                          color: Color(0xFFCBD5E1),
                                          fontSize: 11.5,
                                          height: 1.45,
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

                      const SizedBox(height: 18),
                      const Text(
                        '© 2026 KPU Provinsi Sulawesi Utara',
                        style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 11.5),
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
