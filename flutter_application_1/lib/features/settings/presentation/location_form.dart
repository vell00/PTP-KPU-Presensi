import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/data/app_store.dart';

class LocationForm extends StatefulWidget {
  final AppStore store;
  final VoidCallback onSaved;
  const LocationForm({super.key, required this.store, required this.onSaved});
  @override
  State<LocationForm> createState() => _LocationFormState();
}

class _LocationFormState extends State<LocationForm> {
  final form = GlobalKey<FormState>();
  late final TextEditingController lat, lng, radius;
  @override
  void initState() {
    super.initState();
    lat = TextEditingController(text: widget.store.latitude?.toString() ?? '');
    lng = TextEditingController(text: widget.store.longitude?.toString() ?? '');
    radius = TextEditingController(
      text: widget.store.radius.toStringAsFixed(0),
    );
  }

  @override
  void dispose() {
    lat.dispose();
    lng.dispose();
    radius.dispose();
    super.dispose();
  }

  Widget field(
    String label,
    TextEditingController controller,
    double min,
    double max,
  ) => SizedBox(
    width: 220,
    child: TextFormField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(
        decimal: true,
        signed: true,
      ),
      decoration: InputDecoration(labelText: label),
      validator: (v) {
        final n = double.tryParse(v ?? '');
        return n == null || !n.isFinite || n < min || n > max
            ? 'Masukkan nilai $min sampai $max'
            : null;
      },
    ),
  );
  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 14,
          runSpacing: 14,
          children: [
            field('Latitude', lat, -90, 90),
            field('Longitude', lng, -180, 180),
            field('Radius kantor (m)', radius, 50, 1000),
          ],
        ),
        const SizedBox(height: 18),
        FilledButton(
          onPressed: () async {
            if (!form.currentState!.validate()) return;
            widget.store.latitude = double.parse(lat.text);
            widget.store.longitude = double.parse(lng.text);
            widget.store.radius = double.parse(radius.text);
            if (!await widget.store.save()) return;
            widget.onSaved();
          },
          child: const Text('Simpan pengaturan'),
        ),
      ],
    ),
  );
}
