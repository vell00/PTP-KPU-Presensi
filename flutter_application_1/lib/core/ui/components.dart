import 'package:flutter/material.dart';
import '../theme/colors.dart';
export '../theme/colors.dart';

Widget text(
  String s, {
  double size = 13,
  Color color = ink,
  FontWeight weight = FontWeight.w400,
}) => Text(
  s,
  style: TextStyle(fontSize: size, color: color, fontWeight: weight),
);
Widget card(Widget child, {EdgeInsets padding = const EdgeInsets.all(22)}) =>
    Container(
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: line),
      ),
      child: child,
    );
Widget pill(String label, Color color, {IconData? icon}) => Container(
  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
  decoration: BoxDecoration(
    color: color.withValues(alpha: .09),
    borderRadius: BorderRadius.circular(5),
  ),
  child: Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      if (icon != null) ...[
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 5),
      ],
      text(label, size: 11, color: color, weight: FontWeight.w600),
    ],
  ),
);
Widget avatar(String name, {double radius = 18}) => CircleAvatar(
  radius: radius,
  backgroundColor: [
    const Color(0xFFE6EDE8),
    const Color(0xFFECE6DE),
    const Color(0xFFE3E9F1),
  ][name.length % 3],
  child: text(
    name.split(' ').take(2).map((s) => s[0]).join(),
    size: radius * .65,
    color: teal,
    weight: FontWeight.w700,
  ),
);

Widget heading(String title, String subtitle, {Widget? action}) =>
    LayoutBuilder(
      builder: (context, c) => Padding(
        padding: const EdgeInsets.only(bottom: 26),
        child: Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 24,
          runSpacing: 16,
          children: [
            SizedBox(
              width: c.maxWidth > 650 ? c.maxWidth - 310 : c.maxWidth,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  text(title, size: 26, weight: FontWeight.w700),
                  const SizedBox(height: 8),
                  text(subtitle, color: muted, size: 12),
                ],
              ),
            ),
            ?action,
          ],
        ),
      ),
    );
Widget stat(
  String title,
  String value,
  String caption,
  IconData icon,
  Color color,
) => card(
  Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Expanded(child: text(title, size: 12, color: muted)),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: .08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 19),
          ),
        ],
      ),
      const SizedBox(height: 10),
      text(value, size: 31, weight: FontWeight.w700),
      const SizedBox(height: 8),
      text(caption, size: 10, color: muted),
    ],
  ),
  padding: const EdgeInsets.all(19),
);
Widget legend(String label, Color color) => Row(
  mainAxisSize: MainAxisSize.min,
  children: [
    Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(2),
      ),
    ),
    const SizedBox(width: 6),
    text(label, size: 10, color: muted),
  ],
);

void showMessage(BuildContext context, String message) {
  if (!context.mounted) return;
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
  );
}

Future<void> runUiAction(
  BuildContext context,
  Future<void> Function() action,
) async {
  try {
    await action();
  } catch (error) {
    if (context.mounted) showMessage(context, error.toString());
  }
}
