enum JobRole {
  kepalaBagian('kepala_bagian', 'Kepala Bagian'),
  kepalaSubBagian('kepala_sub_bagian', 'Kepala Sub Bagian'),
  staff('staff', 'Staf');

  final String id, label;
  const JobRole(this.id, this.label);
  static JobRole parse(String id) => values.firstWhere((role) => role.id == id);
}

class Subdepartment {
  final String id, name;
  const Subdepartment(this.id, this.name);
}

class Department {
  final String id, name;
  final List<Subdepartment> subdepartments;
  const Department(this.id, this.name, this.subdepartments);
}

const departments = [
  Department('keuangan_umum_logistik', 'Bagian Keuangan Umum dan Logistik', [
    Subdepartment('keuangan', 'Keuangan'),
    Subdepartment('umum_logistik', 'Umum dan Logistik'),
  ]),
  Department('teknis_hukum', 'Bagian Teknis Penyelenggaraan Pemilu dan Hukum', [
    Subdepartment('teknis_pemilu', 'Teknis Penyelenggaraan Pemilu'),
    Subdepartment('hukum', 'Hukum'),
  ]),
  Department(
    'perencanaan_sdm',
    'Bagian Perencanaan, Data dan Informasi, Partisipasi, Hubungan Masyarakat dan Sumber Daya Manusia',
    [
      Subdepartment('perencanaan_data', 'Perencanaan Data dan Informasi'),
      Subdepartment(
        'partisipasi_humas_sdm',
        'Partisipasi, Hubungan Masyarakat dan Sumber Daya Manusia',
      ),
    ],
  ),
];
String nipEmail(String nip) => '${nip.trim()}@nip.hadir.invalid';
bool validNip(String nip) => RegExp(r'^\d{18}$').hasMatch(nip);
