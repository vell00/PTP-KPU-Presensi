class LeaveRequest {
  final String name, type, reason, date;
  String status;
  LeaveRequest(
    this.name,
    this.type,
    this.reason,
    this.date, [
    this.status = 'Menunggu',
  ]);
  Map<String, dynamic> toJson() => {
    'name': name,
    'type': type,
    'reason': reason,
    'date': date,
    'status': status,
  };
  factory LeaveRequest.fromJson(Map<String, dynamic> j) =>
      LeaveRequest(j['name'], j['type'], j['reason'], j['date'], j['status']);
}
