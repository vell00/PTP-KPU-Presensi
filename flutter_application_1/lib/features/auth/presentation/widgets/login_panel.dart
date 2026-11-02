import 'package:flutter/material.dart';
import 'office_illustration.dart';
import '../../../users/domain/organization.dart';

const _navy = Color(0xFF07142F);
const _red = Color(0xFFD52832);

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
  final _nip = TextEditingController(), _password = TextEditingController();
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
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 38),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 370),
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.topCenter,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 26),
                    padding: const EdgeInsets.fromLTRB(24, 38, 24, 24),
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
                    child: AutofillGroup(
                      child: Form(
                        key: _form,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const OfficeIllustration(),
                            const SizedBox(height: 18),
                            const Text(
                              'KPU Sulawesi Utara',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: _navy,
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 5),
                            const Text(
                              'Sistem Presensi Pegawai',
                              style: TextStyle(
                                color: Color(0xFF7A8393),
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 26),
                            TextFormField(
                              controller: _nip,
                              enabled: !widget.busy,
                              keyboardType: TextInputType.number,
                              textInputAction: TextInputAction.next,
                              autofillHints: const [AutofillHints.username],
                              decoration: _decoration(
                                'NIP (18 digit)',
                                Icons.person_outline_rounded,
                              ),
                              validator: (value) =>
                                  value == null || !validNip(value.trim())
                                  ? 'NIP harus 18 digit'
                                  : null,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _password,
                              enabled: !widget.busy,
                              obscureText: _obscure,
                              autofillHints: const [AutofillHints.password],
                              onFieldSubmitted: (_) => _submit(),
                              decoration:
                                  _decoration(
                                    'Password',
                                    Icons.lock_outline_rounded,
                                  ).copyWith(
                                    suffixIcon: IconButton(
                                      tooltip: _obscure
                                          ? 'Tampilkan password'
                                          : 'Sembunyikan password',
                                      onPressed: () =>
                                          setState(() => _obscure = !_obscure),
                                      icon: Icon(
                                        _obscure
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined,
                                        size: 18,
                                        color: const Color(0xFF9199A7),
                                      ),
                                    ),
                                  ),
                              validator: (value) =>
                                  value == null || value.isEmpty
                                  ? 'Password wajib diisi'
                                  : null,
                            ),
                            if (widget.notice != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 12),
                                child: Text(
                                  widget.notice!,
                                  style: const TextStyle(
                                    color: Colors.green,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            if (widget.error != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 12),
                                child: Semantics(
                                  liveRegion: true,
                                  child: Text(
                                    widget.error!,
                                    style: const TextStyle(
                                      color: _red,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ),
                            const SizedBox(height: 20),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton.icon(
                                style: FilledButton.styleFrom(
                                  backgroundColor: _red,
                                  disabledBackgroundColor: const Color(
                                    0xFFEAA5AA,
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 16,
                                  ),
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
                                    : const Icon(Icons.login_rounded, size: 18),
                                label: Text(
                                  widget.busy ? 'Menghubungkan...' : 'Masuk',
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                            const Text(
                              'Masuk menggunakan NIP Anda',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF8D95A3),
                              ),
                            ),
                            const SizedBox(height: 12),
                            const Wrap(
                              alignment: WrapAlignment.center,
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                _PlatformLabel(
                                  'Android',
                                  Icons.android,
                                  Color(0xFF326CB2),
                                ),
                                _PlatformLabel(
                                  'iOS',
                                  Icons.phone_iphone,
                                  Color(0xFFA87726),
                                ),
                                _PlatformLabel(
                                  'Web',
                                  Icons.language,
                                  Color(0xFF606B7E),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            const Text(
                              'KOMISI PEMILIHAN UMUM',
                              style: TextStyle(
                                fontSize: 9,
                                letterSpacing: 1.5,
                                color: Color(0xFF9299A6),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Container(
                    width: 57,
                    height: 57,
                    decoration: BoxDecoration(
                      color: _red,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFFEE5A62),
                        width: 3,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: _red.withValues(alpha: .28),
                          blurRadius: 20,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.how_to_vote_outlined,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _PlatformLabel extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  const _PlatformLabel(this.label, this.icon, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .08),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 5),
        Text(label, style: TextStyle(fontSize: 10, color: color)),
      ],
    ),
  );
}
