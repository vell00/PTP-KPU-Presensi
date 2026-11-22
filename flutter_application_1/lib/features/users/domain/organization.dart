enum JobRole {
  kepalaBagian('kepala_bagian', 'Kepala Bagian'),
  kepalaSubBagian('kepala_sub_bagian', 'Kepala Sub Bagian'),
  staff('staff', 'Staf');

  final String id, label;
  const JobRole(this.id, this.label);
  static JobRole parse(String id) =>
      values.firstWhere((role) => role.id == id, orElse: () => JobRole.staff);
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
const List<String> allUnitsAndPositions = [
  // 1. Jabatan Fungsional, Struktural & Pimpinan
  'Ketua KPU Provinsi Sulut',
  'Sekretaris KPU Provinsi Sulut',
  'Ketua Divisi Teknis Penyelenggaraan Pemilu',
  'Ketua Divisi Perencanaan Data & Informasi',
  'Ketua Divisi Keuangan, Umum, Rumah Tangga & Logistik',
  'Ketua Divisi Hukum & Pengawasan',
  'Ketua Divisi Sosialisasi Pendidikan Pemilih, Partisipasi Masyarakat & Sumber Daya Manusia',
  'Kepala Bagian Keuangan, Umum dan Logistik',
  'Kepala Bagian Teknis Penyelenggaraan Pemilu dan Hukum',
  'Kepala Bagian Perencanaan, Data dan Informasi, Partisipasi, Hubungan Masyarakat, dan Sumber Daya Manusia',
  'Kepala Subbagian Keuangan',
  'Kepala Subbagian Umum dan Logistik',
  'Kepala Subbagian Teknis Penyelenggaraan Pemilu',
  'Kepala Subbagian Hukum',
  'Kepala Subbagian Perencanaan Data dan Informasi',
  'Kepala Subbagian Partisipasi, Hubungan Masyarakat dan Sumber Daya Manusia',
  'Jabatan Fungsional',
  'Jagat Saksana',
  'Pramubakti',
  // 2. Unit Subbagian
  'Keuangan',
  'Umum dan Logistik',
  'Teknis Penyelenggaraan Pemilu',
  'Hukum',
  'Perencanaan Data dan Informasi',
  'Partisipasi, Humas & SDM',
];

String nipEmail(String nip) => '${nip.trim()}@nip.hadir.invalid';
bool validNip(String nip) => RegExp(r'^\d{18}$').hasMatch(nip);
