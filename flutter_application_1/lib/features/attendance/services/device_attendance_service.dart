import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/data/app_store.dart';

class DeviceAttendanceService {
  Future<bool> captureSelfie(AppStore store, {required bool wfh}) async {
    if (!wfh) {
      if (store.latitude == null || store.longitude == null) {
        throw Exception('Lokasi kantor belum dikonfigurasi oleh admin.');
      }
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw Exception('Aktifkan layanan lokasi perangkat.');
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception('Izin lokasi diperlukan untuk presensi WFO.');
      }
      final p = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 20),
        ),
      );
      if (p.isMocked) {
        throw Exception('Lokasi tiruan terdeteksi. Presensi diblokir.');
      }
      if (p.accuracy > 50 || p.accuracy <= 0) {
        throw Exception('Akurasi GPS belum memadai. Coba di area terbuka.');
      }
      if (DateTime.now().toUtc().difference(p.timestamp.toUtc()).abs() >
          const Duration(minutes: 1)) {
        throw Exception('Lokasi kedaluwarsa. Silakan ulangi.');
      }
      final distance = Geolocator.distanceBetween(
        p.latitude,
        p.longitude,
        store.latitude!,
        store.longitude!,
      );
      if (distance + p.accuracy > store.radius) {
        throw Exception(
          'Anda di luar radius kantor atau terlalu dekat batas radius (${distance.round()} m).',
        );
      }
    }
    final selfie = await ImagePicker().pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      maxWidth: 720,
      imageQuality: 75,
    );
    return selfie != null;
  }
}
