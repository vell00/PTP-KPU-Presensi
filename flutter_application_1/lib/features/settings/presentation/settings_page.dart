import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'location_form.dart';

class SettingsPage extends StatefulWidget {
  final AppStore store;
  final VoidCallback onOpenEmployee;
  const SettingsPage({
    super.key,
    required this.store,
    required this.onOpenEmployee,
  });
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  AppStore get store => widget.store;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      heading('Pengaturan', 'Atur lokasi kantor dan kebijakan kerja.'),
      card(
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            text('Lokasi kantor', size: 17, weight: FontWeight.w700),
            const SizedBox(height: 8),
            text(
              'Koordinat harus ditetapkan sebelum presensi WFO. Radius default 100 meter.',
              color: muted,
            ),
            const SizedBox(height: 20),
            LocationForm(
              store: store,
              onSaved: () {
                setState(() {});
                showMessage(context, 'Lokasi kantor tersimpan.');
              },
            ),
            const Divider(height: 40),
            text('Jadwal kerja', size: 17, weight: FontWeight.w700),
            const SizedBox(height: 15),
            text('Senin–Kamis    08.00–16.00 WITA   •   ISHOMA 12.00–13.00'),
            const SizedBox(height: 10),
            text(
              'Jumat                08.00–16.30 WITA   •   ISHOMA 11.30–13.00',
            ),
            const SizedBox(height: 10),
            text(
              'Jadwal ISHOMA awal perlu dikonfirmasi instansi. Sabtu–Minggu libur.',
              size: 11,
              color: muted,
            ),
            const Divider(height: 30),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: text(
                'WFH Jumat: Keuangan, Umum & Logistik',
                weight: FontWeight.w600,
              ),
              subtitle: text(
                'Subdivisi lain tetap WFO. Geolokasi tidak diminta saat WFH.',
                color: muted,
                size: 11,
              ),
              value: store.fridayWfh,
              onChanged: (v) async {
                setState(() => store.fridayWfh = v);
                if (!await store.save()) return;
              },
            ),
            const Divider(height: 30),
            text('Lingkungan pengembangan', weight: FontWeight.w700),
            const SizedBox(height: 10),
            text(
              'Pergantian tampilan pegawai/admin digunakan untuk pratinjau. Dalam mode Firebase, semua tindakan menggunakan sesi admin yang masuk. Data contoh tidak masuk laporan.',
              color: muted,
            ),
            const SizedBox(height: 18),
            OutlinedButton.icon(
              onPressed: widget.onOpenEmployee,
              icon: const Icon(Icons.phone_android, size: 18),
              label: const Text('Buka tampilan pegawai'),
            ),
          ],
        ),
      ),
    ],
  );
}
