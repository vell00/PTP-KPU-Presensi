import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/ui/components.dart';
import '../../../core/utils/date_time.dart';
import '../domain/work_policy.dart';

class WorkDuration extends StatefulWidget {
  final DateTime? entered, exited;
  const WorkDuration({super.key, this.entered, this.exited});
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
    if (oldWidget.entered != widget.entered ||
        oldWidget.exited != widget.exited) {
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
    final elapsed = widget.entered == null
        ? Duration.zero
        : WorkPolicy.worked(widget.entered!, widget.exited ?? witaNow());
    final duration =
        '${elapsed.inHours.toString().padLeft(2, '0')}:${(elapsed.inMinutes % 60).toString().padLeft(2, '0')}:${(elapsed.inSeconds % 60).toString().padLeft(2, '0')}';
    return Center(
      child: Column(
        children: [
          text(duration, size: 52, weight: FontWeight.w700, color: teal),
          text(
            'Durasi kerja efektif • ISHOMA dikecualikan',
            size: 11,
            color: muted,
          ),
        ],
      ),
    );
  }
}
