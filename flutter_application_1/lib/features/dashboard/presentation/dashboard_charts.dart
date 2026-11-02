import 'package:flutter/material.dart';
import '../../../core/ui/components.dart';
import 'attendance_chart.dart';

Widget chartCard() => card(
  Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                text('Tren Kehadiran', size: 15, weight: FontWeight.w700),
                const SizedBox(height: 5),
                text(
                  'Ringkasan kehadiran pegawai minggu ini',
                  size: 11,
                  color: muted,
                ),
              ],
            ),
          ),
          pill('Minggu ini', muted, icon: Icons.expand_more),
        ],
      ),
      const SizedBox(height: 20),
      Wrap(
        spacing: 18,
        children: [
          legend('Hadir', teal),
          legend('Izin / Cuti', const Color(0xFFE8BD77)),
          legend('Tidak hadir', const Color(0xFFE8DDD4)),
        ],
      ),
      const SizedBox(height: 20),
      const SizedBox(
        height: 166,
        width: double.infinity,
        child: CustomPaint(painter: AttendanceChart()),
      ),
    ],
  ),
);
Widget summaryCard() => card(
  Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      text('Pola Kerja Hari Ini', size: 15, weight: FontWeight.w700),
      const SizedBox(height: 5),
      text('Distribusi lokasi kerja pegawai', size: 11, color: muted),
      const SizedBox(height: 24),
      Row(
        children: [
          SizedBox(
            width: 119,
            height: 119,
            child: Stack(
              alignment: Alignment.center,
              children: [
                const SizedBox(
                  width: 113,
                  height: 113,
                  child: CircularProgressIndicator(
                    value: 1,
                    strokeWidth: 15,
                    color: Color(0xFFDDEEE7),
                  ),
                ),
                const SizedBox(
                  width: 113,
                  height: 113,
                  child: CircularProgressIndicator(
                    value: .81,
                    strokeWidth: 15,
                    color: teal,
                    strokeCap: StrokeCap.round,
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    text('42', size: 28, weight: FontWeight.w700),
                    text('Pegawai hadir', size: 9, color: muted),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(child: legend('WFO', teal)),
                    text('34', size: 18, weight: FontWeight.w700),
                  ],
                ),
                const SizedBox(height: 5),
                Align(
                  alignment: Alignment.centerLeft,
                  child: text('Work from office', size: 9, color: muted),
                ),
                const SizedBox(height: 19),
                Row(
                  children: [
                    Expanded(child: legend('WFH', const Color(0xFFAFD4C4))),
                    text('8', size: 18, weight: FontWeight.w700),
                  ],
                ),
                const SizedBox(height: 5),
                Align(
                  alignment: Alignment.centerLeft,
                  child: text('Work from home', size: 9, color: muted),
                ),
              ],
            ),
          ),
        ],
      ),
      const SizedBox(height: 23),
      Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: canvas,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          children: [
            const Icon(Icons.info_outline, size: 14, color: muted),
            const SizedBox(width: 7),
            Expanded(
              child: text(
                'WFH mengikuti jadwal subdivisi hari Jumat.',
                size: 9,
                color: muted,
              ),
            ),
          ],
        ),
      ),
    ],
  ),
);
