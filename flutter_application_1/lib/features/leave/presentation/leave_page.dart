import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import '../domain/leave_request.dart';

class LeavePage extends StatefulWidget {
  final AppStore store;
  const LeavePage({super.key, required this.store});
  @override
  State<LeavePage> createState() => _LeavePageState();
}

class _LeavePageState extends State<LeavePage> {
  AppStore get store => widget.store;
  int get pending => store.requests.where((r) => r.status == 'Menunggu').length;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      heading(
        'Izin & Cuti',
        'Tinjau permohonan pegawai dan kelola persetujuannya.',
        action: pill('$pending menunggu persetujuan', const Color(0xFFC5923F)),
      ),
      ...store.requests.map(
        (r) => Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: card(
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    avatar(r.name),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          text(r.name, weight: FontWeight.w600),
                          const SizedBox(height: 4),
                          text('${r.type} • ${r.date}', color: muted, size: 11),
                        ],
                      ),
                    ),
                    pill(r.status, r.status == 'Ditolak' ? Colors.red : teal),
                  ],
                ),
                const SizedBox(height: 15),
                text(r.reason, color: muted),
                if (r.status == 'Menunggu') ...[
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 10,
                    children: [
                      OutlinedButton(
                        onPressed: () => decide(r, 'Ditolak'),
                        child: const Text('Tolak'),
                      ),
                      FilledButton(
                        onPressed: () => decide(r, 'Disetujui'),
                        child: const Text('Setujui pengajuan'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    ],
  );
  Future<void> decide(LeaveRequest r, String result) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('$result: ${r.type}'),
        content: Text('${r.name}\n${r.date}\n\n${r.reason}'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Konfirmasi'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      setState(() => r.status = result);
      if (!await store.save()) return;
    }
  }
}
