import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/config/app_constants.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import '../domain/leave_request.dart';

Future<void> showLeaveRequestDialog(
  BuildContext context,
  AppStore store,
) async {
  final now = witaNow();
  final reason = TextEditingController();
  String type = 'Izin';
  DateTime date = now;
  await showDialog(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, update) => AlertDialog(
        title: const Text('Ajukan izin / cuti'),
        content: SizedBox(
          width: 400,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: type,
                items: ['Izin', 'Cuti tahunan', 'Sakit']
                    .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                    .toList(),
                onChanged: (v) => update(() => type = v!),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  final d = await showDatePicker(
                    context: context,
                    initialDate: date,
                    firstDate: DateTime(now.year, now.month, now.day),
                    lastDate: DateTime(now.year + 1),
                  );
                  if (d != null) update(() => date = d);
                },
                icon: const Icon(Icons.calendar_month),
                label: Text(dayKey(date)),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: reason,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Alasan pengajuan',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () async {
              if (reason.text.trim().isEmpty) return;
              store.requests.insert(
                0,
                LeaveRequest(
                  store.currentUser?.name ?? demoNames.first,
                  type,
                  reason.text.trim(),
                  dayKey(date),
                ),
              );
              if (!await store.save()) return;
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Kirim pengajuan'),
          ),
        ],
      ),
    ),
  );
  // Controller is owned by this modal and must outlive its closing animation.
  await Future<void>.delayed(const Duration(milliseconds: 300));
  reason.dispose();
}
