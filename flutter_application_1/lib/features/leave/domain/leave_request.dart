class LeaveRequest {
  final String id;
  final String? uid;
  final String? nip;
  final String name;
  final String? unit;
  final String type;
  final String reason;
  final String startDate;
  final String endDate;
  final int daysCount;
  final String? attachmentUrl;
  final String? reviewNote;
  String status;

  String get date => startDate;

  LeaveRequest(
    this.name,
    this.type,
    this.reason,
    this.startDate, [
    this.status = 'Menunggu',
    this.id = '',
    this.uid,
    this.nip,
    this.unit,
    String? endDate,
    this.daysCount = 1,
    this.attachmentUrl,
    this.reviewNote,
  ]) : endDate = endDate ?? startDate;

  Map<String, dynamic> toJson() => {
    'id': id,
    if (uid != null) 'uid': uid,
    if (nip != null) 'nip': nip,
    'name': name,
    if (unit != null) 'unit': unit,
    'type': type,
    'reason': reason,
    'date': startDate,
    'startDate': startDate,
    'endDate': endDate,
    'daysCount': daysCount,
    if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
    if (reviewNote != null) 'reviewNote': reviewNote,
    'status': status,
  };

  factory LeaveRequest.fromJson(Map<String, dynamic> j, {String? docId}) {
    final start = j['startDate']?.toString() ?? j['date']?.toString() ?? '';
    final end = j['endDate']?.toString() ?? start;
    return LeaveRequest(
      j['name']?.toString() ?? 'Pegawai',
      j['type']?.toString() ?? 'Izin',
      j['reason']?.toString() ?? '',
      start,
      j['status']?.toString() ?? 'Menunggu',
      docId ?? j['id']?.toString() ?? '',
      j['uid']?.toString(),
      j['nip']?.toString(),
      j['unit']?.toString(),
      end,
      (j['daysCount'] as num?)?.toInt() ?? 1,
      j['attachmentUrl']?.toString(),
      j['reviewNote']?.toString(),
    );
  }
}
