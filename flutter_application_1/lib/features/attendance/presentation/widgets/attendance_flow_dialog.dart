import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:local_auth/local_auth.dart';
import '../../../../core/data/app_store.dart';
import '../../../../core/theme/colors.dart';
import '../../services/device_attendance_service.dart';

enum _FlowStage {
  detectingLocation,
  locationFailed,
  selfieCapture,
  authentication,
  authenticatingBiometric,
}

class AttendanceFlowResult {
  final bool verified;
  final String authMethod; // 'biometric' | 'pin'
  final String? pin;
  final double? latitude;
  final double? longitude;
  final double? accuracyMeters;
  final bool isMocked;
  final double distance;
  final double radius;
  final String? selfiePath;

  const AttendanceFlowResult({
    required this.verified,
    required this.authMethod,
    this.pin,
    this.latitude,
    this.longitude,
    this.accuracyMeters,
    this.isMocked = false,
    required this.distance,
    required this.radius,
    this.selfiePath,
  });
}

class AttendanceFlowDialog extends StatefulWidget {
  final AppStore store;
  final bool isCheckOut;
  final bool isWfh;

  const AttendanceFlowDialog({
    super.key,
    required this.store,
    required this.isCheckOut,
    required this.isWfh,
  });

  @override
  State<AttendanceFlowDialog> createState() => _AttendanceFlowDialogState();
}

class _AttendanceFlowDialogState extends State<AttendanceFlowDialog> {
  _FlowStage _stage = _FlowStage.detectingLocation;
  GeolocationVerificationResult? _geoResult;
  final TextEditingController _pinController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  XFile? _selfieFile;
  bool _biometricSupported = false;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    _checkBiometricSupport();
    WidgetsBinding.instance.addPostFrameCallback((_) => _startLocationDetection());
  }

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _checkBiometricSupport() async {
    if (kIsWeb) return;
    final isMobile = defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;
    if (!isMobile) return;
    try {
      final auth = LocalAuthentication();
      final supported = await auth.canCheckBiometrics && await auth.isDeviceSupported();
      if (mounted) setState(() => _biometricSupported = supported);
    } catch (_) {}
  }

  Future<void> _startLocationDetection() async {
    setState(() {
      _stage = _FlowStage.detectingLocation;
      _geoResult = null;
      _errorMsg = null;
    });

    final result = await DeviceAttendanceService().verifyLocation(
      widget.store,
      wfh: widget.isWfh,
    );
    if (!mounted) return;

    setState(() {
      _geoResult = result;
      _stage = result.verified
          ? _FlowStage.selfieCapture
          : _FlowStage.locationFailed;
    });
  }

  Future<void> _captureSelfie() async {
    setState(() => _errorMsg = null);
    try {
      final photo = await _picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.front,
        imageQuality: 70,
        maxWidth: 960,
      );
      if (!mounted) return;
      if (photo != null) {
        setState(() => _selfieFile = photo);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMsg =
            'Kamera tidak tersedia pada perangkat ini (${e.toString().replaceFirst('Exception: ', '')}).';
      });
    }
  }

  void _proceedToAuth() {
    final isMobile = !kIsWeb &&
        (defaultTargetPlatform == TargetPlatform.android ||
            defaultTargetPlatform == TargetPlatform.iOS);
    if (isMobile && _selfieFile == null) {
      setState(() => _errorMsg = 'Ambil foto selfie terlebih dahulu sebagai bukti kehadiran.');
      return;
    }
    setState(() {
      _errorMsg = null;
      _stage = _FlowStage.authentication;
    });
  }

  Future<void> _authenticateBiometric() async {
    setState(() {
      _stage = _FlowStage.authenticatingBiometric;
      _errorMsg = null;
    });
    try {
      final auth = LocalAuthentication();
      final didAuth = await auth.authenticate(
        localizedReason:
            'Verifikasi biometrik untuk mencatat ${widget.isCheckOut ? 'presensi keluar' : 'presensi masuk'} KPU Sulut',
        options: const AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
        ),
      );
      if (!mounted) return;
      if (didAuth) {
        _finish(authMethod: 'biometric');
      } else {
        setState(() {
          _stage = _FlowStage.authentication;
          _errorMsg = 'Autentikasi biometrik dibatalkan. Silakan coba lagi atau gunakan PIN.';
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _stage = _FlowStage.authentication;
        _errorMsg = 'Biometrik tidak tersedia. Gunakan PIN 6 digit Anda.';
      });
    }
  }

  void _submitPin() {
    final entered = _pinController.text.trim();
    if (!RegExp(r'^\d{6}$').hasMatch(entered)) {
      setState(() => _errorMsg = 'Masukkan 6 digit angka PIN presensi Anda.');
      return;
    }
    _finish(authMethod: 'pin', pin: entered);
  }

  void _finish({required String authMethod, String? pin}) {
    Navigator.of(context).pop(
      AttendanceFlowResult(
        verified: true,
        authMethod: authMethod,
        pin: pin,
        latitude: _geoResult?.latitude,
        longitude: _geoResult?.longitude,
        accuracyMeters: _geoResult?.accuracyMeters,
        isMocked: _geoResult?.isMocked ?? false,
        distance: _geoResult?.distance ?? 0,
        radius: _geoResult?.radius ?? widget.store.radius,
        selfiePath: _selfieFile?.path,
      ),
    );
  }

  int get _stepNumber => switch (_stage) {
    _FlowStage.detectingLocation || _FlowStage.locationFailed => 1,
    _FlowStage.selfieCapture => 2,
    _FlowStage.authentication || _FlowStage.authenticatingBiometric => 3,
  };

  @override
  Widget build(BuildContext context) {
    final title = widget.isCheckOut ? 'Presensi Keluar' : 'Presensi Masuk';
    final isMobile = !kIsWeb &&
        (defaultTargetPlatform == TargetPlatform.android ||
            defaultTargetPlatform == TargetPlatform.iOS);

    return Dialog(
      backgroundColor: surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: ink,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Langkah $_stepNumber dari 3 • ${widget.isWfh ? 'Mode WFH' : 'Mode WFO'}',
                          style: const TextStyle(fontSize: 12, color: muted),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Tutup',
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, color: muted),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 3-Segment Step Bar
              Row(
                children: [1, 2, 3].map((idx) {
                  final active = _stepNumber >= idx;
                  return Expanded(
                    child: Container(
                      height: 4,
                      margin: EdgeInsets.only(right: idx < 3 ? 6 : 0),
                      decoration: BoxDecoration(
                        color: active ? navy : line,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 22),

              // STEP 1: LOCATION
              if (_stage == _FlowStage.detectingLocation) ...[
                const Center(
                  child: SizedBox(
                    width: 44,
                    height: 44,
                    child: CircularProgressIndicator(strokeWidth: 3, color: navy),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Memverifikasi Lokasi GPS...',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, color: ink),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.isWfh
                      ? 'Mode WFH aktif sesuai jadwal subbagian Anda.'
                      : 'Memeriksa koordinat akurasi tinggi dan radius kantor KPU Sulut.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12.5, color: muted),
                ),
              ] else if (_stage == _FlowStage.locationFailed) ...[
                Center(
                  child: Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      color: dangerBg,
                      shape: BoxShape.circle,
                      border: Border.all(color: dangerBorder),
                    ),
                    child: const Icon(Icons.location_off_rounded, color: danger, size: 28),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Verifikasi Lokasi Gagal',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: danger),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: dangerBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: dangerBorder),
                  ),
                  child: Text(
                    _geoResult?.errorMessage ?? 'Posisi berada di luar radius geofencing kantor.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12.5, color: danger),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Batal'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: _startLocationDetection,
                        icon: const Icon(Icons.refresh_rounded, size: 18),
                        label: const Text('Coba Lagi'),
                      ),
                    ),
                  ],
                ),
              ] else if (_stage == _FlowStage.selfieCapture) ...[
                // Verified location banner
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: successBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: successBorder),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: success, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.isWfh
                              ? 'Mode WFH terverifikasi'
                              : 'Dalam radius kantor (${_geoResult?.distance.round() ?? 0} m / maks ${_geoResult?.radius.round() ?? 100} m)',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: success,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Selfie Preview / Prompt
                Center(
                  child: Container(
                    width: 148,
                    height: 148,
                    decoration: BoxDecoration(
                      color: surfaceMuted,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _selfieFile != null ? success : line,
                        width: 2.5,
                      ),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: _selfieFile != null && !kIsWeb
                        ? Image.file(File(_selfieFile!.path), fit: BoxFit.cover)
                        : Icon(
                            _selfieFile != null
                                ? Icons.check_circle_rounded
                                : Icons.face_retouching_natural_rounded,
                            size: 56,
                            color: _selfieFile != null ? success : muted,
                          ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  _selfieFile != null ? 'Foto Selfie Siap' : 'Ambil Foto Selfie Wajah',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, color: ink),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Pastikan wajah terlihat jelas dengan pencahayaan cukup sebagai bukti kehadiran.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12.5, color: muted),
                ),

                if (_errorMsg != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _errorMsg!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12, color: danger, fontWeight: FontWeight.w600),
                  ),
                ],

                const SizedBox(height: 18),
                OutlinedButton.icon(
                  onPressed: _captureSelfie,
                  icon: const Icon(Icons.camera_alt_outlined, size: 18),
                  label: Text(_selfieFile != null ? 'Ambil Ulang Selfie' : 'Buka Kamera Depan'),
                ),
                const SizedBox(height: 10),
                FilledButton(
                  onPressed: (_selfieFile != null || !isMobile) ? _proceedToAuth : null,
                  child: Text(
                    _selfieFile != null
                        ? 'Lanjut ke Verifikasi Identitas'
                        : isMobile
                        ? 'Ambil Selfie untuk Melanjutkan'
                        : 'Lanjut (Tanpa Kamera Desktop)',
                  ),
                ),
              ] else ...[
                // STEP 3: AUTHENTICATION (Real Biometric on Mobile + Server-Verified PIN)
                const Text(
                  'Verifikasi Identitas',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, color: ink),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Gunakan biometrik perangkat atau masukkan 6 digit PIN presensi Anda.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12.5, color: muted),
                ),
                const SizedBox(height: 16),

                if (_biometricSupported) ...[
                  InkWell(
                    onTap: _stage == _FlowStage.authenticatingBiometric
                        ? null
                        : _authenticateBiometric,
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                      decoration: BoxDecoration(
                        color: canvas,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: line),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            Icons.fingerprint_rounded,
                            size: 42,
                            color: _stage == _FlowStage.authenticatingBiometric
                                ? success
                                : navy,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _stage == _FlowStage.authenticatingBiometric
                                ? 'Memverifikasi biometrik...'
                                : 'Gunakan Sidik Jari / Face ID',
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              color: ink,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Row(
                    children: [
                      Expanded(child: Divider()),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          'atau masukkan PIN',
                          style: TextStyle(fontSize: 11.5, color: muted),
                        ),
                      ),
                      Expanded(child: Divider()),
                    ],
                  ),
                  const SizedBox(height: 14),
                ],

                TextField(
                  controller: _pinController,
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
                    hintText: '••••••',
                    labelText: 'PIN Presensi (6 Digit)',
                  ),
                  onSubmitted: (_) => _submitPin(),
                ),

                if (_errorMsg != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    _errorMsg!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12, color: danger, fontWeight: FontWeight.w600),
                  ),
                ],

                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => setState(() {
                          _errorMsg = null;
                          _stage = _FlowStage.selfieCapture;
                        }),
                        child: const Text('Kembali'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton(
                        onPressed: _submitPin,
                        child: const Text('Kirim Presensi'),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
