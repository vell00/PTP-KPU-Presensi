import 'dart:math';

double tukinEstimate(double base, double deduction, double performance) =>
    max(0, base * .4 * (1 - deduction.clamp(0, 100) / 100)) +
    base * .6 * performance.clamp(0, 100) / 100;
