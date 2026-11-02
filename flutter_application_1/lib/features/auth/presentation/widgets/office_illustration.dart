import 'package:flutter/material.dart';

/// Lightweight, resolution-independent illustration inspired by the public preview.
/// This is an illustration, not an official KPU emblem or architectural drawing.
class OfficeIllustration extends StatelessWidget {
  const OfficeIllustration({super.key});
  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Ilustrasi gedung kantor',
    image: true,
    child: ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: const SizedBox(
        height: 125,
        width: double.infinity,
        child: CustomPaint(painter: _OfficePainter()),
      ),
    ),
  );
}

class _OfficePainter extends CustomPainter {
  const _OfficePainter();
  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 320, size.height / 125);
    canvas.drawRect(
      const Rect.fromLTWH(0, 0, 320, 125),
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFD6E7F6), Color(0xFFE8F2FA)],
        ).createShader(const Rect.fromLTWH(0, 0, 320, 125)),
    );
    final foliage = Paint()..color = const Color(0xFF9DB9CE);
    for (final x in [12.0, 35.0, 278.0, 305.0]) {
      canvas.drawCircle(Offset(x, 86), 18, foliage);
      canvas.drawCircle(Offset(x + 8, 77), 13, foliage);
      canvas.drawRect(
        Rect.fromLTWH(x - 2, 85, 4, 29),
        Paint()..color = const Color(0xFF7195AC),
      );
    }
    final wall = Paint()..color = const Color(0xFF769CB7);
    canvas.drawRect(const Rect.fromLTWH(40, 83, 240, 32), wall);
    canvas.drawRect(
      const Rect.fromLTWH(98, 62, 124, 53),
      Paint()..color = const Color(0xFF88ABC5),
    );
    final roof = Path()
      ..moveTo(79, 76)
      ..lineTo(160, 22)
      ..lineTo(241, 76)
      ..close();
    canvas.drawPath(roof, Paint()..color = const Color(0xFF456D91));
    canvas.drawPath(
      Path()
        ..moveTo(32, 84)
        ..lineTo(66, 60)
        ..lineTo(99, 84)
        ..close(),
      Paint()..color = const Color(0xFF577F9F),
    );
    canvas.drawPath(
      Path()
        ..moveTo(220, 84)
        ..lineTo(252, 60)
        ..lineTo(288, 84)
        ..close(),
      Paint()..color = const Color(0xFF577F9F),
    );
    for (final x in [53.0, 77.0, 112.0, 136.0, 178.0, 202.0, 237.0, 260.0]) {
      canvas.drawRect(
        Rect.fromLTWH(x, 88, 11, 15),
        Paint()..color = const Color(0xFFDDECF5),
      );
    }
    canvas.drawRect(
      const Rect.fromLTWH(151, 90, 19, 25),
      Paint()..color = const Color(0xFF365D80),
    );
    canvas.drawRect(
      const Rect.fromLTWH(31, 114, 259, 6),
      Paint()..color = const Color(0xFFBCCFDD),
    );
    canvas.drawLine(
      const Offset(160, 25),
      const Offset(160, 4),
      Paint()
        ..color = const Color(0xFF4D6278)
        ..strokeWidth = 1.7,
    );
    canvas.drawRect(
      const Rect.fromLTWH(161, 4, 16, 5),
      Paint()..color = const Color(0xFFDC303A),
    );
    canvas.drawRect(
      const Rect.fromLTWH(161, 9, 16, 5),
      Paint()..color = Colors.white,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _OfficePainter oldDelegate) => false;
}
