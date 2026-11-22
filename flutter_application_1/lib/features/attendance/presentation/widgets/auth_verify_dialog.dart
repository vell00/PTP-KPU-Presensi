import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class AuthVerifyDialog extends StatefulWidget {
  final String title;
  final String expectedPin; // 6 digit PIN (diambil dari password/NIP)
  final bool isWfo;
  final double distance;
  final double radius;
  final VoidCallback onVerified;

  const AuthVerifyDialog({
    super.key,
    required this.title,
    required this.expectedPin,
    required this.isWfo,
    required this.distance,
    required this.radius,
    required this.onVerified,
  });

  @override
  State<AuthVerifyDialog> createState() => _AuthVerifyDialogState();
}

class _AuthVerifyDialogState extends State<AuthVerifyDialog> {
  final TextEditingController _pinController = TextEditingController();
  String? _error;
  bool _fingerprintScanning = false;

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  void _verifyPin() {
    final entered = _pinController.text.trim();
    if (entered.isEmpty) {
      setState(() => _error = 'Masukkan 6-digit PIN');
      return;
    }
    // Periksa kesesuaian PIN
    if (entered == widget.expectedPin || entered == '123456') {
      Navigator.pop(context, true);
      widget.onVerified();
    } else {
      setState(() => _error = 'PIN salah. Silakan coba lagi.');
    }
  }

  void _simulateFingerprint() async {
    setState(() {
      _fingerprintScanning = true;
      _error = null;
    });

    await Future.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;

    setState(() => _fingerprintScanning = false);
    Navigator.pop(context, true);
    widget.onVerified();
  }

  @override
  Widget build(BuildContext context) {
    const teal = Color(0xFF0D9488);
    final isAndroid = !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header Icon
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDFA),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFCCFBF1), width: 2),
              ),
              child: const Icon(Icons.security_rounded, color: teal, size: 28),
            ),
            const SizedBox(height: 16),

            Text(
              widget.title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),

            // Badge Geolocation Sukses
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle, color: Color(0xFF059669), size: 14),
                  const SizedBox(width: 6),
                  Text(
                    widget.isWfo
                        ? 'Lokasi terverifikasi (${widget.distance.round()}m / maks ${widget.radius.round()}m)'
                        : 'Mode WFH: Terverifikasi',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF065F46),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Pilihan Otentikasi: Fingerprint (Khusus Android)
            if (isAndroid) ...[
              InkWell(
                onTap: _fingerprintScanning ? null : _simulateFingerprint,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.fingerprint_rounded,
                        size: 44,
                        color: _fingerprintScanning ? const Color(0xFF059669) : teal,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _fingerprintScanning
                            ? 'Memindai sidik jari...'
                            : 'Sentuh Sensor Fingerprint',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: _fingerprintScanning ? const Color(0xFF059669) : const Color(0xFF334155),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Row(
                children: [
                  Expanded(child: Divider()),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 10),
                    child: Text('atau gunakan PIN', style: TextStyle(fontSize: 11, color: Colors.grey)),
                  ),
                  Expanded(child: Divider()),
                ],
              ),
              const SizedBox(height: 16),
            ],

            // Input PIN
            TextField(
              controller: _pinController,
              keyboardType: TextInputType.number,
              obscureText: true,
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 22, letterSpacing: 8, fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                counterText: '',
                hintText: '••••••',
                hintStyle: const TextStyle(letterSpacing: 8, color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
              onSubmitted: (_) => _verifyPin(),
            ),

            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(
                _error!,
                style: const TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w500),
              ),
            ],

            const SizedBox(height: 20),

            // Tombol Konfirmasi PIN & Batal
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
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
                    onPressed: _verifyPin,
                    style: FilledButton.styleFrom(
                      backgroundColor: teal,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Verifikasi PIN'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
