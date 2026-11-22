import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/data/app_store.dart';

class GeolocationVerificationResult {
  final bool verified;
  final double distance;
  final double radius;
  final double? latitude;
  final double? longitude;
  final String? errorMessage;

  GeolocationVerificationResult({
    required this.verified,
    required this.distance,
    required this.radius,
    this.latitude,
    this.longitude,
    this.errorMessage,
  });
}

class DeviceAttendanceService {
  Future<GeolocationVerificationResult> verifyLocation(AppStore store, {required bool wfh}) async {
    final targetRadius = store.radius > 0 ? store.radius : 100.0;
    if (wfh) {
      return GeolocationVerificationResult(
        verified: true,
        distance: 0,
        radius: targetRadius,
      );
    }

    if (store.latitude == null || store.longitude == null) {
      return GeolocationVerificationResult(
        verified: false,
        distance: 0,
        radius: targetRadius,
        errorMessage: 'Titik koordinat geofencing kantor belum diatur oleh admin.',
      );
    }

    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        return GeolocationVerificationResult(
          verified: false,
          distance: 0,
          radius: targetRadius,
          errorMessage: 'Layanan lokasi (GPS) pada perangkat belum aktif.',
        );
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (!kIsWeb) {
          return GeolocationVerificationResult(
            verified: false,
            distance: 0,
            radius: targetRadius,
            errorMessage: 'Izin lokasi diperlukan untuk verifikasi geofencing WFO.',
          );
        }
      }

      final p = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 15),
        ),
      );

      if (p.isMocked) {
        return GeolocationVerificationResult(
          verified: false,
          distance: 0,
          radius: targetRadius,
          errorMessage: 'Lokasi tiruan (Fake GPS) terdeteksi. Presensi ditolak.',
        );
      }

      final distance = Geolocator.distanceBetween(
        p.latitude,
        p.longitude,
        store.latitude!,
        store.longitude!,
      );

      if (distance > targetRadius) {
        return GeolocationVerificationResult(
          verified: false,
          distance: distance,
          radius: targetRadius,
          latitude: p.latitude,
          longitude: p.longitude,
          errorMessage: 'Anda berada di luar radius geofencing kantor (${distance.round()} m dari titik kantor, batas geofencing ${targetRadius.round()} m).',
        );
      }

      return GeolocationVerificationResult(
        verified: true,
        distance: distance,
        radius: targetRadius,
        latitude: p.latitude,
        longitude: p.longitude,
      );
    } catch (e) {
      return GeolocationVerificationResult(
        verified: false,
        distance: 0,
        radius: targetRadius,
        errorMessage: 'Gagal mendeteksi koordinat GPS: ${e.toString().replaceFirst('Exception: ', '')}. Pastikan izin lokasi aplikasi telah diizinkan pada pengaturan perangkat.',
      );
    }
  }
}
