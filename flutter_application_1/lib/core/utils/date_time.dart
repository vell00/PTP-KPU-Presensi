const _witaOffset = Duration(hours: 8);

const _dayNamesId = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

const _monthNamesId = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const _shortMonthNamesId = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/// Returns current WITA (UTC+8) wall-clock components.
DateTime witaNow() {
  final wita = DateTime.now().toUtc().add(_witaOffset);
  return DateTime(
    wita.year,
    wita.month,
    wita.day,
    wita.hour,
    wita.minute,
    wita.second,
  );
}

/// Serializes a WITA wall-clock DateTime with explicit +08:00 timezone offset.
String witaIsoString(DateTime d) {
  String p(int n) => n.toString().padLeft(2, '0');
  return '${d.year}-${p(d.month)}-${p(d.day)}T${p(d.hour)}:${p(d.minute)}:${p(d.second)}+08:00';
}

/// Parses an ISO string (explicit timezone or legacy timezone-naive WITA string)
/// into WITA wall-clock DateTime components.
DateTime parseWitaIso(String raw) {
  final trimmed = raw.trim();
  final hasZone = RegExp(r'(?:Z|[+-]\d{2}:?\d{2})$', caseSensitive: false).hasMatch(trimmed);
  if (hasZone) {
    final utc = DateTime.parse(trimmed).toUtc().add(_witaOffset);
    return DateTime(utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second);
  }
  final parsed = DateTime.parse(trimmed);
  return DateTime(
    parsed.year,
    parsed.month,
    parsed.day,
    parsed.hour,
    parsed.minute,
    parsed.second,
  );
}

String dayKey(DateTime d) =>
    '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

String clockText(DateTime? d) => d == null
    ? '--:--'
    : '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

String clockWithSeconds(DateTime d) =>
    '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}:${d.second.toString().padLeft(2, '0')}';

String witaDayName(DateTime d) => _dayNamesId[d.weekday - 1];

String formatFullDateId(DateTime d) =>
    '${witaDayName(d)}, ${d.day} ${_monthNamesId[d.month - 1]} ${d.year}';

String formatShortDateKey(String key) {
  final parts = key.split('-');
  if (parts.length != 3) return key;
  final y = int.tryParse(parts[0]);
  final m = int.tryParse(parts[1]);
  final d = int.tryParse(parts[2]);
  if (y == null || m == null || d == null || m < 1 || m > 12) return key;
  return '$d ${_shortMonthNamesId[m - 1]} $y';
}
