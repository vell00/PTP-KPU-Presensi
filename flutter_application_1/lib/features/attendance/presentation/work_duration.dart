import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/ui/components.dart';
import '../../../core/utils/date_time.dart';
import '../domain/work_policy.dart';

class WorkDuration extends StatefulWidget {
  final DateTime? entered, exited;
  final WorkHoursConfig config;

  const WorkDuration({
    super.key,
    this.entered,
    this.exited,
    this.config = const WorkHoursConfig(),
  });

  @override
  State<WorkDuration> createState() => _WorkDurationState();
}

class _WorkDurationState extends State<WorkDuration> {
  Timer? _timer;

  void _schedule() {
    _timer?.cancel();
    if (widget.entered != null && widget.exited == null) {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) setState(() {});
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _schedule();
  }

  @override
  void didUpdateWidget(covariant WorkDuration oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.entered != widget.entered || oldWidget.exited != widget.exited) {
      _schedule();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final now = witaNow();
    final elapsed = widget.entered == null
        ? Duration.zero
        : WorkPolicy.worked(widget.entered!, widget.exited ?? now);
    final target = WorkPolicy.targetDailyDuration(widget.entered ?? now, config: widget.config);
    final progress = target.inSeconds > 0
        ? (elapsed.inSeconds / target.inSeconds).clamp(0.0, 1.0)
        : 0.0;
    final pct = (progress * 100).round();

    final hh = elapsed.inHours.toString().padLeft(2, '0');
    final mm = (elapsed.inMinutes % 60).toString().padLeft(2, '0');
    final ss = (elapsed.inSeconds % 60).toString().padLeft(2, '0');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: canvas,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: line),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              text('Durasi Kerja Efektif', size: 12, color: muted, weight: FontWeight.w600),
              text('$pct% target harian', size: 12, color: navy, weight: FontWeight.w700, tabular: true),
            ],
          ),
          const SizedBox(height: 8),
          text(
            '$hh:$mm:$ss',
            size: 38,
            weight: FontWeight.w800,
            color: navy,
            tabular: true,
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 7,
              backgroundColor: line,
              valueColor: AlwaysStoppedAnimation<Color>(
                progress >= 1.0 ? success : navy,
              ),
            ),
          ),
          const SizedBox(height: 8),
          text(
            'Waktu istirahat ISHOMA otomatis dikecualikan',
            size: 11.5,
            color: muted,
          ),
        ],
      ),
    );
  }
}
