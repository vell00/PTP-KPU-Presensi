import 'package:flutter/material.dart';
import '../../../core/data/app_store.dart';
import '../../../core/ui/components.dart';
import '../domain/organization.dart';
import '../domain/user_profile.dart';
import '../data/user_repository.dart';
import 'user_editor.dart';

class UserManagementPage extends StatefulWidget {
  final AppStore store;
  const UserManagementPage({super.key, required this.store});
  @override
  State<UserManagementPage> createState() => _UserManagementPageState();
}

class _UserManagementPageState extends State<UserManagementPage> {
  late final UserRepository repository;
  List<UserProfile> users = [];
  bool loading = true;
  String query = '', departmentFilter = '', roleFilter = '';
  String? error;
  @override
  void initState() {
    super.initState();
    repository = widget.store.isRemote
        ? FirebaseUserRepository()
        : DemoUserRepository(widget.store);
    load();
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final result = await repository.list();
      if (mounted) setState(() => users = result);
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> edit([UserProfile? user]) async {
    if (await showUserEditor(context, repository, user: user) == true &&
        mounted) {
      await load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final visible = users
        .where(
          (u) =>
              (departmentFilter.isEmpty ||
                  u.departmentId == departmentFilter) &&
              (roleFilter.isEmpty || u.role.id == roleFilter) &&
              (u.name.toLowerCase().contains(query.toLowerCase()) ||
                  u.nip.contains(query)),
        )
        .toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        heading(
          'Manajemen Pengguna',
          'Kelola akun, jabatan, dan penempatan pada 3 bagian serta 6 subbagian.',
          action: FilledButton.icon(
            onPressed: () => edit(),
            icon: const Icon(Icons.person_add_alt_1, size: 18),
            label: const Text('Tambah pengguna'),
          ),
        ),
        if (!widget.store.isRemote)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: card(
              const Text(
                'Mode demo: formulir hanya menyimpan contoh data lokal. Akun login dibuat ketika Firebase dan Cloud Functions sudah aktif.',
              ),
            ),
          ),
        card(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  SizedBox(
                    width: 230,
                    child: TextField(
                      onChanged: (v) => setState(() => query = v),
                      decoration: const InputDecoration(
                        hintText: 'Cari nama atau NIP',
                        prefixIcon: Icon(Icons.search),
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 200,
                    child: DropdownButtonFormField<String>(
                      initialValue: '',
                      isExpanded: true,
                      items: [
                        const DropdownMenuItem(
                          value: '',
                          child: Text('Semua jabatan'),
                        ),
                        ...JobRole.values.map(
                          (r) => DropdownMenuItem(
                            value: r.id,
                            child: Text(r.label),
                          ),
                        ),
                      ],
                      onChanged: (v) => setState(() => roleFilter = v!),
                    ),
                  ),
                  SizedBox(
                    width: 280,
                    child: DropdownButtonFormField<String>(
                      initialValue: '',
                      isExpanded: true,
                      items: [
                        const DropdownMenuItem(
                          value: '',
                          child: Text('Semua bagian'),
                        ),
                        ...departments.map(
                          (d) => DropdownMenuItem(
                            value: d.id,
                            child: Text(
                              d.name,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      ],
                      onChanged: (v) => setState(() => departmentFilter = v!),
                    ),
                  ),
                  IconButton(
                    onPressed: loading ? null : load,
                    tooltip: 'Muat ulang pengguna',
                    icon: const Icon(Icons.refresh),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              if (loading)
                const Center(child: CircularProgressIndicator())
              else if (error != null)
                Text(error!, style: const TextStyle(color: Colors.red))
              else if (visible.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('Belum ada pengguna yang sesuai.'),
                )
              else
                ...visible.map(
                  (u) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        avatar(u.name),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              text(u.name, weight: FontWeight.w700),
                              const SizedBox(height: 5),
                              text(u.nip, size: 12, color: muted),
                              const SizedBox(height: 5),
                              text(u.department.name, size: 12),
                              if (u.subdepartmentId != null)
                                text(
                                  'Subbagian ${u.unitName}',
                                  size: 12,
                                  color: muted,
                                ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 6,
                                runSpacing: 6,
                                children: [
                                  pill(u.role.label, teal),
                                  if (u.isAdmin)
                                    pill('Administrator', Colors.indigo),
                                  if (u.mustChangePassword)
                                    pill('Wajib ganti password', Colors.orange),
                                ],
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'Edit jabatan',
                          onPressed: () => edit(u),
                          icon: const Icon(Icons.edit_outlined, size: 19),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              text(
                'Menampilkan ${visible.length} pengguna • maksimal 500 akun per pemuatan',
                size: 11,
                color: muted,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
