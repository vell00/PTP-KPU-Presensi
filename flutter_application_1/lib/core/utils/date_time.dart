// Store WITA calendar components consistently as a wall-clock DateTime.
DateTime witaNow() {
  final wita = DateTime.now().toUtc().add(const Duration(hours: 8));
  return DateTime(
    wita.year,
    wita.month,
    wita.day,
    wita.hour,
    wita.minute,
    wita.second,
  );
}

String dayKey(DateTime d) =>
    '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
String clockText(DateTime? d) => d == null
    ? '--:--'
    : '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
