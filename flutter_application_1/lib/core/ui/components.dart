import 'package:flutter/material.dart';
import '../theme/colors.dart';
export '../theme/colors.dart';

Widget text(
  String s, {
  double size = 13.5,
  Color color = ink,
  FontWeight weight = FontWeight.w400,
  int? maxLines,
  TextOverflow? overflow,
  TextAlign? textAlign,
  bool tabular = false,
}) => Text(
  s,
  maxLines: maxLines,
  overflow: overflow,
  textAlign: textAlign,
  style: TextStyle(
    fontSize: size,
    color: color,
    fontWeight: weight,
    fontFeatures: tabular ? const [FontFeature.tabularFigures()] : null,
  ),
);

Widget card(
  Widget child, {
  EdgeInsets padding = const EdgeInsets.all(18),
  Color color = surface,
  Color borderColor = line,
  double radius = 14,
}) => Container(
  padding: padding,
  decoration: BoxDecoration(
    color: color,
    borderRadius: BorderRadius.circular(radius),
    border: Border.all(color: borderColor),
  ),
  child: child,
);

Widget pill(
  String label,
  Color fg, {
  Color? bg,
  Color? border,
  IconData? icon,
}) => Container(
  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
  decoration: BoxDecoration(
    color: bg ?? fg.withValues(alpha: 0.1),
    borderRadius: BorderRadius.circular(999),
    border: border != null ? Border.all(color: border) : null,
  ),
  child: Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      if (icon != null) ...[
        Icon(icon, size: 13, color: fg),
        const SizedBox(width: 5),
      ],
      text(label, size: 11.5, color: fg, weight: FontWeight.w700),
    ],
  ),
);

Widget modeBadge(String mode) {
  final isWfh = mode == 'WFH';
  return pill(
    isWfh ? 'WFH' : 'WFO',
    isWfh ? info : navy,
    bg: isWfh ? infoBg : surfaceMuted,
    border: isWfh ? infoBorder : line,
    icon: isWfh ? Icons.home_outlined : Icons.apartment_rounded,
  );
}

Widget attendanceStatusBadge(String status) {
  if (status == 'Tepat Waktu' || status == 'Tepat waktu') {
    return pill('Tepat Waktu', success, bg: successBg, border: successBorder);
  }
  if (status == 'Terlambat' ||
      status == 'Pulang Cepat' ||
      status == 'Belum Absen Pulang') {
    return pill(status, warning, bg: warningBg, border: warningBorder);
  }
  return pill(status, danger, bg: dangerBg, border: dangerBorder);
}

Widget leaveStatusBadge(String status) {
  if (status == 'Disetujui') {
    return pill('Disetujui', success, bg: successBg, border: successBorder);
  }
  if (status == 'Ditolak') {
    return pill('Ditolak', danger, bg: dangerBg, border: dangerBorder);
  }
  return pill('Menunggu', warning, bg: warningBg, border: warningBorder);
}

String safeInitials(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((p) => p.isNotEmpty)
      .toList();
  if (parts.isEmpty) return 'KP';
  return parts.take(2).map((p) => p[0].toUpperCase()).join();
}

Widget avatar(String name, {double radius = 20}) => CircleAvatar(
  radius: radius,
  backgroundColor: navyLight,
  child: text(
    safeInitials(name),
    size: radius * 0.68,
    color: Colors.white,
    weight: FontWeight.w700,
  ),
);

Widget emptyStateCard({
  required IconData icon,
  required String title,
  required String subtitle,
  Widget? action,
}) => card(
  Center(
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: surfaceMuted,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: muted, size: 24),
          ),
          const SizedBox(height: 12),
          text(title, size: 14.5, weight: FontWeight.w700, textAlign: TextAlign.center),
          const SizedBox(height: 4),
          text(subtitle, size: 12.5, color: muted, textAlign: TextAlign.center),
          if (action != null) ...[
            const SizedBox(height: 16),
            action,
          ],
        ],
      ),
    ),
  ),
);

void showMessage(BuildContext context, String message, {bool isError = false}) {
  if (!context.mounted) return;
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? danger : navy,
        behavior: SnackBarBehavior.floating,
      ),
    );
}

Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
  String cancelLabel = 'Batal',
  bool destructive = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
      content: Text(message, style: const TextStyle(fontSize: 13.5, color: inkSecondary)),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text(cancelLabel),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: destructive ? kpuRed : navy,
          ),
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result == true;
}

Future<void> runUiAction(
  BuildContext context,
  Future<void> Function() action,
) async {
  try {
    await action();
  } catch (error) {
    if (context.mounted) {
      showMessage(context, error.toString(), isError: true);
    }
  }
}
