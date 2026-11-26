import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import 'leave_request_dialog.dart';

class EmployeeLeaveTab extends StatelessWidget {
  final AppStore store;
  final Future<void> Function() onRefresh;

  const EmployeeLeaveTab({
    super.key,
    required this.store,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final pending = store.requests.where((r) => r.status == 'Menunggu').length;
    final approved = store.requests.where((r) => r.status == 'Disetujui').length;

    return RefreshIndicator(
      color: kpuRed,
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          // Header + Primary Action
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    text('Izin & Cuti Saya', size: 20, weight: FontWeight.w800),
                    const SizedBox(height: 2),
                    text(
                      '$pending menunggu • $approved disetujui',
                      size: 12.5,
                      color: muted,
                      tabular: true,
                    ),
                  ],
                ),
              ),
              FilledButton.icon(
                onPressed: () async {
                  final ok = await showLeaveRequestDialog(context, store);
                  if (ok && context.mounted) {
                    showMessage(context, 'Pengajuan izin / cuti berhasil dikirim.');
                  }
                },
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text('Ajukan'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (store.requests.isEmpty)
            emptyStateCard(
              icon: Icons.event_note_outlined,
              title: 'Belum Ada Pengajuan',
              subtitle:
                  'Ajukan izin, cuti tahunan, cuti sakit, perjalanan dinas, atau koreksi absen di sini. Status persetujuan admin tampil secara real-time.',
              action: FilledButton.icon(
                onPressed: () => showLeaveRequestDialog(context, store),
                icon: const Icon(Icons.edit_calendar_outlined, size: 18),
                label: const Text('Buat Pengajuan Pertama'),
              ),
            )
          else
            ...store.requests.map(
              (req) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: card(
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: text(req.type, size: 14.5, weight: FontWeight.w700),
                          ),
                          leaveStatusBadge(req.status),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.calendar_today_outlined, size: 14, color: muted),
                          const SizedBox(width: 6),
                          Expanded(
                            child: text(
                              req.endDate != req.startDate
                                  ? '${formatShortDateKey(req.startDate)} – ${formatShortDateKey(req.endDate)} (${req.daysCount} hari)'
                                  : '${formatShortDateKey(req.startDate)} (${req.daysCount} hari)',
                              size: 12.5,
                              color: inkSecondary,
                              weight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      text(req.reason, size: 12.5, color: muted),
                      if (req.reviewNote != null && req.reviewNote!.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: canvas,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: line),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.comment_outlined, size: 14, color: muted),
                              const SizedBox(width: 6),
                              Expanded(
                                child: text(
                                  'Catatan Admin: ${req.reviewNote}',
                                  size: 12,
                                  color: inkSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
