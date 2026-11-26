import 'package:geolocator/geolocator.dart';
import '../../../core/data/app_store.dart';

class GeolocationVerificationResult {
  final bool verified;
  final double distance;
  final double radius;
  final double? latitude;
  final double? longitude;
  final double? accuracyMeters;
  final bool isMocked;
  final String? errorMessage;

  const GeolocationVerificationResult({
    required this.verified,
    required this.distance,
    required this.radius,
    this.latitude,
    this.longitude,
    this.accuracyMeters,
    this.isMocked = false,
    this.errorMessage,
  });
}

class DeviceAttendanceService {
  static const double maxAcceptableAccuracyMeters = 150.0;

  Future<GeolocationVerificationResult> verifyLocation(
    AppStore store, {
    required bool wfh,
  }) async {
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
        errorMessage:
            'Titik koordinat geofencing kantor belum diatur oleh administrator.',
      );
    }

    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        return GeolocationVerificationResult(
          verified: false,
          distance: 0,
          radius: targetRadius,
          errorMessage:
              'Layanan lokasi (GPS) pada perangkat belum aktif. Aktifkan GPS lalu coba lagi.',
        );
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return GeolocationVerificationResult(
          verified: false,
          distance: 0,
          radius: targetRadius,
          errorMessage:
              'Izin akses lokasi ditolak. Izinkan lokasi di pengaturan perangkat untuk presensi WFO.',
        );
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );

      if (position.isMocked) {
        return GeolocationVerificationResult(
          verified: false,
          distance: 0,
          radius: targetRadius,
          isMocked: true,
          errorMessage:
              'Lokasi tiruan (Fake GPS) terdeteksi. Matikan aplikasi lokasi palsu untuk melanjutkan.',
        );
      }

      if (position.accuracy > maxAcceptableAccuracyMeters) {
        return GeolocationVerificationResult(
          verified: false,
          distance: 0,
          radius: targetRadius,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracyMeters: position.accuracy,
          errorMessage:
              'Sinyal GPS kurang akurat (±${position.accuracy.round()} m). Pindah ke area terbuka lalu coba lagi.',
        );
      }

      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        store.latitude!,
        store.longitude!,
      );

      if (distance > targetRadius) {
        return GeolocationVerificationResult(
          verified: false,
          distance: distance,
          radius: targetRadius,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracyMeters: position.accuracy,
          errorMessage:
              'Anda berada di luar radius kantor (${distance.round()} m dari kantor, batas ${targetRadius.round()} m).',
        );
      }

      return GeolocationVerificationResult(
        verified: true,
        distance: distance,
        radius: targetRadius,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: position.accuracy,
      );
    } catch (e) {
      return GeolocationVerificationResult(
        verified: false,
        distance: 0,
        radius: targetRadius,
        errorMessage:
            'Gagal memperoleh titik GPS: ${e.toString().replaceFirst('Exception: ', '')}.',
      );
    }
  }
}
