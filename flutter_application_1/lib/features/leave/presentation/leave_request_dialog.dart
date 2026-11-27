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
  final submitted = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (_) => _LeaveRequestDialog(
      store: store,
      initialType: initialType,
      initialReason: initialReason,
    ),
  );
  return submitted == true;
}

class _LeaveRequestDialog extends StatefulWidget {
  final AppStore store;
  final String initialType;
  final String? initialReason;

  const _LeaveRequestDialog({
    required this.store,
    required this.initialType,
    this.initialReason,
  });

  @override
  State<_LeaveRequestDialog> createState() => _LeaveRequestDialogState();
}

class _LeaveRequestDialogState extends State<_LeaveRequestDialog> {
  late final TextEditingController _reasonController;
  late final TextEditingController _attachmentController;
  late String _selectedType;
  late DateTime _startDate;
  late DateTime _endDate;
  late int _baseYear;
  bool _busy = false;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    final now = witaNow();
    _baseYear = now.year;
    final todayOnly = DateTime(now.year, now.month, now.day);
    _startDate = todayOnly;
    _endDate = todayOnly;
    _selectedType = _leaveTypes.contains(widget.initialType)
        ? widget.initialType
        : 'Izin';
    _reasonController = TextEditingController(text: widget.initialReason ?? '');
    _attachmentController = TextEditingController();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _attachmentController.dispose();
    super.dispose();
  }

  int get _daysCount => _endDate.difference(_startDate).inDays + 1;

  Future<void> _pickDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(_baseYear - 1, 1, 1),
      lastDate: DateTime(_baseYear + 1, 12, 31),
      initialDateRange: DateTimeRange(start: _startDate, end: _endDate),
      helpText: 'Pilih Rentang Tanggal Izin / Cuti',
    );
    if (picked != null && mounted) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
        _errorMsg = null;
      });
    }
  }

  Future<void> _submit() async {
    if (_busy) return;
    final reasonText = _reasonController.text.trim();
    if (reasonText.length < 3) {
      setState(() => _errorMsg = 'Alasan pengajuan minimal 3 karakter.');
      return;
    }
    if (_daysCount < 1 || _daysCount > 60) {
      setState(
        () => _errorMsg = 'Durasi pengajuan harus antara 1 hingga 60 hari.',
      );
      return;
    }
    final attachmentInput = _attachmentController.text.trim();
    if (attachmentInput.isNotEmpty &&
        !RegExp(r'^https?://.+', caseSensitive: false).hasMatch(attachmentInput)) {
      setState(
        () => _errorMsg = 'Tautan lampiran harus diawali dengan https:// atau http://.',
      );
      return;
    }

    setState(() {
      _busy = true;
      _errorMsg = null;
    });

    try {
      final store = widget.store;
      final user = store.currentUser;
      final attachment = _attachmentController.text.trim();
      if (store.isRemote && user != null) {
        final created = await PresensiSyncService.kirimPengajuanIzin(
          nip: user.nip,
          name: user.name,
          unit: user.unitName,
          type: _selectedType,
          startDate: _startDate,
          endDate: _endDate,
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
            _selectedType,
            reasonText,
            dayKey(_startDate),
            'Menunggu',
            'local-${DateTime.now().millisecondsSinceEpoch}',
            user?.uid,
            user?.nip,
            user?.unitName,
            dayKey(_endDate),
            _daysCount,
            attachment.isEmpty ? null : attachment,
          ),
        );
        await store.save();
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _errorMsg = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
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
                        text(
                          'Ajukan Izin / Cuti',
                          size: 17,
                          weight: FontWeight.w800,
                        ),
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
                    onPressed: _busy
                        ? null
                        : () => Navigator.pop(context, false),
                    icon: const Icon(Icons.close_rounded, color: muted),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                initialValue: _selectedType,
                decoration: const InputDecoration(
                  labelText: 'Jenis Permohonan',
                ),
                items: _leaveTypes
                    .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                    .toList(),
                onChanged: _busy
                    ? null
                    : (v) {
                        if (v != null) setState(() => _selectedType = v);
                      },
              ),
              const SizedBox(height: 12),

              InkWell(
                onTap: _busy ? null : _pickDateRange,
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
                          _startDate == _endDate
                              ? formatShortDateKey(dayKey(_startDate))
                              : '${formatShortDateKey(dayKey(_startDate))} – ${formatShortDateKey(dayKey(_endDate))}',
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            color: ink,
                          ),
                        ),
                      ),
                      pill('$_daysCount hari', navy, bg: surfaceMuted),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              TextField(
                controller: _reasonController,
                enabled: !_busy,
                maxLines: 3,
                maxLength: 500,
                decoration: const InputDecoration(
                  labelText: 'Alasan / Keterangan *',
                  hintText:
                      'Jelaskan keperluan izin, cuti, atau koreksi absen...',
                ),
              ),
              const SizedBox(height: 8),

              TextField(
                controller: _attachmentController,
                enabled: !_busy,
                keyboardType: TextInputType.url,
                decoration: const InputDecoration(
                  labelText: 'Tautan Surat / Bukti (Opsional)',
                  hintText: 'https://drive.google.com/... (surat dokter / SPT)',
                  prefixIcon: Icon(Icons.attach_file_rounded, size: 18),
                ),
              ),

              if (_errorMsg != null) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: dangerBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: dangerBorder),
                  ),
                  child: Text(
                    _errorMsg!,
                    style: const TextStyle(
                      color: danger,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _busy
                          ? null
                          : () => Navigator.pop(context, false),
                      child: const Text('Batal'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: _busy ? null : _submit,
                      child: _busy
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
  }
}
