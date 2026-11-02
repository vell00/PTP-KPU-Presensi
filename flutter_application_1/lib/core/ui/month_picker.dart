import 'package:flutter/material.dart';
import '../config/app_constants.dart';

class MonthPicker extends StatelessWidget {
  final DateTime value;
  final ValueChanged<DateTime> onChanged;
  const MonthPicker({super.key, required this.value, required this.onChanged});
  @override
  Widget build(BuildContext context) => OutlinedButton.icon(
    icon: const Icon(Icons.calendar_today_outlined, size: 16),
    label: Text('${months[value.month - 1]} ${value.year}'),
    onPressed: () async {
      final date = await showDatePicker(
        context: context,
        initialDate: value,
        firstDate: DateTime(2020),
        lastDate: DateTime(2035),
        helpText: 'Pilih bulan laporan',
      );
      if (date != null && context.mounted) {
        onChanged(DateTime(date.year, date.month));
      }
    },
  );
}
