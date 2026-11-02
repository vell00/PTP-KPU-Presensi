import 'package:flutter/material.dart';
import '../../../core/theme/colors.dart';

class AttendanceChart extends CustomPainter {
  const AttendanceChart();
  @override
  void paint(Canvas canvas, Size size) {
    final left = 28.0, w = size.width - left, h = size.height - 25;
    void label(String s, Offset offset, {Color color = muted}) {
      final tp = TextPainter(
        text: TextSpan(
          text: s,
          style: TextStyle(color: color, fontSize: 9),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, offset);
    }

    for (var i = 0; i <= 3; i++) {
      final y = h * i / 3;
      canvas.drawLine(
        Offset(left, y),
        Offset(size.width, y),
        Paint()
          ..color = line
          ..strokeWidth = 1,
      );
      label('${60 - i * 20}', Offset(0, y - 5));
    }
    const data = [42, 45, 43, 46, 40];
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    for (var i = 0; i < 5; i++) {
      final x = left + w * (i + .5) / 5;
      final bw = (w / 5 * .43).clamp(10.0, 42.0);
      final values = [data[i], 4, 3];
      var y = h;
      for (var j = 0; j < 3; j++) {
        final bh = values[j] / 60 * h;
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(x - bw / 2, y - bh, bw, bh - 2),
            const Radius.circular(3),
          ),
          Paint()
            ..color = [
              teal,
              const Color(0xFFE8BD77),
              const Color(0xFFE8DDD4),
            ][j],
        );
        y -= bh;
      }
      label(days[i], Offset(x - 13, h + 12));
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
