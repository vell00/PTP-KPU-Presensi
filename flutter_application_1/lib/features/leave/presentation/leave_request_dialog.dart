import 'package:flutter/material.dart';
import 'package:flutter_application_1/core/data/app_store.dart';
import 'package:flutter_application_1/core/ui/components.dart';
import 'package:flutter_application_1/core/utils/date_time.dart';
import '../../attendance/data/presensi_sync_service.dart';
import '../domain/leave_request.dart';

const _leaveTypes = [
  'Izin',
  'Cuti Tahunan',
  'Cuti Sakit',
  'Perjalanan Dinas',
  'Koreksi Absen',
];

Future<bool> showLeaveRequestDialog(
  BuildContext context,
  AppStore store, {
  String initialType = 'Izin',
  String? initialReason,
}) async {
  final now = witaNow();
  final todayOnly = DateTime(now.year, now.month, now.day);
  final reasonController = TextEditingController(text: initialReason ?? '');
  final attachmentController = TextEditingController();
  String selectedType = _leaveTypes.contains(initialType) ? initialType : 'Izin';
  DateTime startDate = todayOnly;
  DateTime endDate = todayOnly;
  bool busy = false;
  String? errorMsg;

  final submitted = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setModalState) {
        final daysCount = endDate.difference(startDate).inDays + 1;

        Future<void> pickDateRange() async {
          final picked = await showDateRangePicker(
            context: ctx,
            firstDate: DateTime(now.year - 1, 1, 1),
            lastDate: DateTime(now.year + 1, 12, 31),
            initialDateRange: DateTimeRange(start: startDate, end: endDate),
            helpText: 'Pilih Rentang Tanggal Izin / Cuti',
          );
          if (picked != null) {
            setModalState(() {
              startDate = picked.start;
              endDate = picked.end;
              errorMsg = null;
            });
          }
        }

        Future<void> submit() async {
          if (busy) return;
          final reasonText = reasonController.text.trim();
          if (reasonText.length < 3) {
            setModalState(() => errorMsg = 'Alasan pengajuan minimal 3 karakter.');
            return;
          }
          if (daysCount < 1 || daysCount > 60) {
            setModalState(() => errorMsg = 'Durasi pengajuan harus antara 1 hingga 60 hari.');
            return;
          }

          setModalState(() {
            busy = true;
            errorMsg = null;
          });

          try {
            final user = store.currentUser;
            final attachment = attachmentController.text.trim();
            if (store.isRemote && user != null) {
              final created = await PresensiSyncService.kirimPengajuanIzin(
                nip: user.nip,
                name: user.name,
                unit: user.unitName,
                type: selectedType,
                startDate: startDate,
                endDate: endDate,
                reason: reasonText,
                attachmentUrl: attachment.isEmpty ? null : attachment,
              );
              store.requests.insert(0, created);
              await store.refresh();
            } else {
              store.requests.insert(
                0,
                LeaveRequest(
                  user?.name ?? 'Pegawai',
                  selectedType,
                  reasonText,
                  dayKey(startDate),
                  'Menunggu',
                  'local-${DateTime.now().millisecondsSinceEpoch}',
                  user?.uid,
                  user?.nip,
                  user?.unitName,
                  dayKey(endDate),
                  daysCount,
                  attachment.isEmpty ? null : attachment,
                ),
              );
              await store.save();
            }
            if (ctx.mounted) Navigator.pop(ctx, true);
          } catch (e) {
            setModalState(() {
              busy = false;
              errorMsg = e.toString().replaceFirst('Exception: ', '');
            });
          }
        }

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
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            text('Ajukan Izin / Cuti', size: 17, weight: FontWeight.w800),
                            text(
                              'Terkirim langsung ke Portal Administrator KPU',
                              size: 11.5,
                              color: muted,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: 'Tutup',
                        onPressed: busy ? null : () => Navigator.pop(ctx, false),
                        icon: const Icon(Icons.close_rounded, color: muted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  DropdownButtonFormField<String>(
                    initialValue: selectedType,
                    decoration: const InputDecoration(labelText: 'Jenis Permohonan'),
                    items: _leaveTypes
                        .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                        .toList(),
                    onChanged: busy
                        ? null
                        : (v) {
                            if (v != null) setModalState(() => selectedType = v);
                          },
                  ),
                  const SizedBox(height: 12),

                  InkWell(
                    onTap: busy ? null : pickDateRange,
                    borderRadius: BorderRadius.circular(12),
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Rentang Tanggal',
                        prefixIcon: Icon(Icons.date_range_rounded, size: 19),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              startDate == endDate
                                  ? formatShortDateKey(dayKey(startDate))
                                  : '${formatShortDateKey(dayKey(startDate))} – ${formatShortDateKey(dayKey(endDate))}',
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w600,
                                color: ink,
                              ),
                            ),
                          ),
                          pill('$daysCount hari', navy, bg: surfaceMuted),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: reasonController,
                    enabled: !busy,
                    maxLines: 3,
                    maxLength: 500,
                    decoration: const InputDecoration(
                      labelText: 'Alasan / Keterangan *',
                      hintText: 'Jelaskan keperluan izin, cuti, atau koreksi absen...',
                    ),
                  ),
                  const SizedBox(height: 8),

                  TextField(
                    controller: attachmentController,
                    enabled: !busy,
                    keyboardType: TextInputType.url,
                    decoration: const InputDecoration(
                      labelText: 'Tautan Surat / Bukti (Opsional)',
                      hintText: 'https://drive.google.com/... (surat dokter / SPT)',
                      prefixIcon: Icon(Icons.attach_file_rounded, size: 18),
                    ),
                  ),

                  if (errorMsg != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: dangerBg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: dangerBorder),
                      ),
                      child: Text(
                        errorMsg!,
                        style: const TextStyle(color: danger, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],

                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: busy ? null : () => Navigator.pop(ctx, false),
                          child: const Text('Batal'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FilledButton(
                          onPressed: busy ? null : submit,
                          child: busy
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Kirim Pengajuan'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    ),
  );

  await Future<void>.delayed(const Duration(milliseconds: 250));
  reasonController.dispose();
  attachmentController.dispose();
  return submitted == true;
}
