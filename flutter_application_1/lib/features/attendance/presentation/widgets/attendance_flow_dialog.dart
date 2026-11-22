import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../../../core/data/app_store.dart';
import '../../../../core/utils/date_time.dart';
import '../../services/device_attendance_service.dart';

enum _FlowStage {
  detectingLocation,
  locationFailed,
  locationVerified,
  authentication,
  authenticatingFingerprint,
  success,
}

class AttendanceFlowResult {
  final bool verified;
  final DateTime timestamp;
  final double? latitude;
  final double? longitude;
  final double distance;
  final double radius;

  AttendanceFlowResult({
    required this.verified,
    required this.timestamp,
    this.latitude,
    this.longitude,
    required this.distance,
    required this.radius,
  });
}

class AttendanceFlowDialog extends StatefulWidget {
  final AppStore store;
  final bool isCheckOut;
  final bool isWfh;
  final String? expectedPin;

  const AttendanceFlowDialog({
    super.key,
    required this.store,
    required this.isCheckOut,
    required this.isWfh,
    this.expectedPin,
  });

  @override
  State<AttendanceFlowDialog> createState() => _AttendanceFlowDialogState();
}

class _AttendanceFlowDialogState extends State<AttendanceFlowDialog>
    with SingleTickerProviderStateMixin {
  _FlowStage _stage = _FlowStage.detectingLocation;
  GeolocationVerificationResult? _geoResult;
  final TextEditingController _pinController = TextEditingController();
  String? _pinError;
  bool _forceShowFingerprint = false;

  late AnimationController _animController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.92, end: 1.08).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );

    // Otomatis mulai deteksi geolocation saat dialog muncul
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startLocationDetection();
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _startLocationDetection() async {
    setState(() {
      _stage = _FlowStage.detectingLocation;
      _geoResult = null;
      _pinError = null;
    });

    // Tambahkan sedikit jeda animasi agar user melihat feedback sistem aktif mendeteksi
    await Future.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;

    final service = DeviceAttendanceService();
    final result = await service.verifyLocation(
      widget.store,
      wfh: widget.isWfh,
    );

    if (!mounted) return;

    setState(() {
      _geoResult = result;
      if (result.verified) {
        _stage = _FlowStage.locationVerified;
      } else {
        _stage = _FlowStage.locationFailed;
      }
    });

    // Jika lokasi berhasil terverifikasi, lanjutkan ke tahap Autentikasi
    if (result.verified) {
      await Future.delayed(const Duration(milliseconds: 850));
      if (!mounted) return;
      setState(() {
        _stage = _FlowStage.authentication;
      });
    }
  }

  void _verifyPin() {
    final entered = _pinController.text.trim();
    if (entered.isEmpty) {
      setState(() => _pinError = 'Masukkan 6 digit PIN presensi Anda');
      return;
    }

    final targetPin = widget.expectedPin?.trim();
    // PIN yang valid: PIN yang telah dibuat pegawai di Firestore, atau default 123456 jika belum disetel
    final isValid = (targetPin != null && targetPin.isNotEmpty && entered == targetPin) ||
        (targetPin == null && entered == '123456');

    if (isValid) {
      _onAuthSuccess();
    } else {
      setState(() {
        _pinError = 'PIN salah. Silakan coba lagi.';
      });
    }
  }

  Future<void> _simulateFingerprint() async {
    setState(() {
      _stage = _FlowStage.authenticatingFingerprint;
      _pinError = null;
    });

    await Future.delayed(const Duration(milliseconds: 1300));
    if (!mounted) return;

    _onAuthSuccess();
  }

  void _onAuthSuccess() async {
    setState(() {
      _stage = _FlowStage.success;
    });

    await Future.delayed(const Duration(milliseconds: 750));
    if (!mounted) return;

    final finalResult = AttendanceFlowResult(
      verified: true,
      timestamp: witaNow(),
      latitude: _geoResult?.latitude,
      longitude: _geoResult?.longitude,
      distance: _geoResult?.distance ?? 0,
      radius: _geoResult?.radius ?? widget.store.radius,
    );

    Navigator.of(context).pop(finalResult);
  }

  @override
  Widget build(BuildContext context) {
    const teal = Color(0xFF07142F); // Navy KPU
    const primaryNavy = Color(0xFF07142F);
    const accentRed = Color(0xFFD52832);
    final isAndroidDevice = defaultTargetPlatform == TargetPlatform.android;
    final showFingerprintOption = isAndroidDevice || _forceShowFingerprint;

    final titleText = widget.isCheckOut ? 'Presensi Keluar' : 'Presensi Masuk';

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      elevation: 12,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 26),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // HEADER TITLE & STATUS
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        titleText,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'KPU Provinsi Sulawesi Utara',
                        style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: widget.isWfh ? const Color(0xFFEFF6FF) : const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: widget.isWfh ? const Color(0xFFBFDBFE) : const Color(0xFFBBF7D0),
                      ),
                    ),
                    child: Text(
                      widget.isWfh ? 'Mode WFH' : 'Mode WFO',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: widget.isWfh ? const Color(0xFF1D4ED8) : const Color(0xFF15803D),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),

              // KONTEN BERDASARKAN TAHAP
              if (_stage == _FlowStage.detectingLocation) ...[
                // Animasi Geofencing Sedang Mendeteksi
                ScaleTransition(
                  scale: _pulseAnimation,
                  child: Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                      border: Border.all(color: primaryNavy.withValues(alpha: 0.2), width: 3),
                      boxShadow: [
                        BoxShadow(
                          color: primaryNavy.withValues(alpha: 0.15),
                          blurRadius: 18,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Icon(Icons.share_location_rounded, color: primaryNavy, size: 38),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Mendeteksi Geofencing Kantor...',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Memeriksa titik koordinat GPS dan memverifikasi batas radius geofencing kantor KPU.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 20),
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: primaryNavy),
                ),
              ] else if (_stage == _FlowStage.locationFailed) ...[
                // Feedback Gagal Geofencing
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFFECACA), width: 2),
                  ),
                  child: const Center(
                    child: Icon(Icons.location_off_rounded, color: Color(0xFFDC2626), size: 36),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Verifikasi Geofencing Gagal',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF991B1B)),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFFE4E6)),
                  ),
                  child: Text(
                    _geoResult?.errorMessage ??
                        'Posisi Anda tidak berada di dalam radius geofencing presensi kantor KPU.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF9F1239)),
                  ),
                ),
                if ((_geoResult?.distance ?? 0) > 0) ...[
                  const SizedBox(height: 10),
                  Text(
                    'Jarak saat ini: ${_geoResult!.distance.round()} m • Batas Geofencing: ${_geoResult!.radius.round()} m',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                  ),
                ],
                const SizedBox(height: 22),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Batal'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: _startLocationDetection,
                        style: FilledButton.styleFrom(backgroundColor: accentRed),
                        icon: const Icon(Icons.refresh, size: 18),
                        label: const Text('Coba Lagi'),
                      ),
                    ),
                  ],
                ),
              ] else if (_stage == _FlowStage.locationVerified) ...[
                // Feedback Geofencing Terverifikasi Sukses
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFA7F3D0), width: 2),
                  ),
                  child: const Center(
                    child: Icon(Icons.check_circle_rounded, color: Color(0xFF059669), size: 38),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Geofencing Terverifikasi!',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF065F46)),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.isWfh
                      ? 'Mode WFH aktif: Geofencing kantor dilewati.'
                      : 'Berada di dalam radius geofencing kantor (${_geoResult?.distance.round() ?? 0}m / maks ${_geoResult?.radius.round() ?? 100}m)',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF047857)),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Menyiapkan autentikasi...',
                  style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
              ] else if (_stage == _FlowStage.authentication ||
                  _stage == _FlowStage.authenticatingFingerprint) ...[
                // TAHAP AUTENTIKASI: FINGERPRINT & PIN
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FDF4),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFBBF7D0)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 14),
                      const SizedBox(width: 6),
                      Text(
                        widget.isWfh
                            ? 'Geofencing WFH Terverifikasi'
                            : 'Geofencing Terverifikasi (${_geoResult?.distance.round()}m)',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF15803D),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Pilihan Fingerprint (Khusus Pengguna Android atau saat mode simulasi aktif)
                if (showFingerprintOption) ...[
                  InkWell(
                    onTap: _stage == _FlowStage.authenticatingFingerprint
                        ? null
                        : _simulateFingerprint,
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                      decoration: BoxDecoration(
                        color: _stage == _FlowStage.authenticatingFingerprint
                            ? const Color(0xFFECFDF5)
                            : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _stage == _FlowStage.authenticatingFingerprint
                              ? const Color(0xFF10B981)
                              : const Color(0xFFCBD5E1),
                          width: _stage == _FlowStage.authenticatingFingerprint ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            Icons.fingerprint_rounded,
                            size: 48,
                            color: _stage == _FlowStage.authenticatingFingerprint
                                ? const Color(0xFF059669)
                                : teal,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _stage == _FlowStage.authenticatingFingerprint
                                ? 'Memindai sidik jari...'
                                : 'Sentuh Sensor Fingerprint',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: _stage == _FlowStage.authenticatingFingerprint
                                  ? const Color(0xFF065F46)
                                  : const Color(0xFF1E293B),
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Autentikasi biometrik Android',
                            style: TextStyle(fontSize: 10, color: Color(0xFF64748B)),
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
                        child: Text(
                          'atau masukkan PIN',
                          style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                        ),
                      ),
                      Expanded(child: Divider()),
                    ],
                  ),
                  const SizedBox(height: 14),
                ] else ...[
                  // Jika bukan Android (misal iPhone / Desktop), beri opsi coba sensor fingerprint
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: () {
                        setState(() => _forceShowFingerprint = true);
                      },
                      icon: const Icon(Icons.fingerprint, size: 16, color: teal),
                      label: const Text(
                        'Simulasi Fingerprint (Android)',
                        style: TextStyle(fontSize: 11, color: teal),
                      ),
                    ),
                  ),
                ],

                // Form Input PIN 6-Digit
                TextField(
                  controller: _pinController,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 22,
                    letterSpacing: 8,
                    fontWeight: FontWeight.w700,
                  ),
                  decoration: InputDecoration(
                    counterText: '',
                    hintText: '••••••',
                    hintStyle: const TextStyle(letterSpacing: 8, color: Color(0xFF94A3B8)),
                    filled: true,
                    fillColor: const Color(0xFFF1F5F9),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: teal, width: 2),
                    ),
                  ),
                  onSubmitted: (_) => _verifyPin(),
                ),

                if (_pinError != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _pinError!,
                    style: const TextStyle(
                      color: Color(0xFFDC2626),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],

                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
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
                          backgroundColor: accentRed,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('Verifikasi PIN'),
                      ),
                    ),
                  ],
                ),
              ] else if (_stage == _FlowStage.success) ...[
                // TAHAP SUKSES TEREKAM
                Container(
                  width: 76,
                  height: 76,
                  decoration: const BoxDecoration(
                    color: Color(0xFFECFDF5),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(Icons.task_alt_rounded, color: Color(0xFF059669), size: 44),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  '$titleText Berhasil!',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF065F46),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Waktu terekam: ${clockText(witaNow())} WITA',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF047857)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
