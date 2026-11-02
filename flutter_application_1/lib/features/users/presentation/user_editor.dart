import 'package:flutter/material.dart';
import '../domain/organization.dart';
import '../domain/user_profile.dart';
import '../data/user_repository.dart';

Future<bool?> showUserEditor(
  BuildContext context,
  UserRepository repository, {
  UserProfile? user,
}) => showDialog<bool>(
  context: context,
  barrierDismissible: false,
  builder: (_) => _UserEditor(repository: repository, user: user),
);

class _UserEditor extends StatefulWidget {
  final UserRepository repository;
  final UserProfile? user;
  const _UserEditor({required this.repository, this.user});
  @override
  State<_UserEditor> createState() => _UserEditorState();
}

class _UserEditorState extends State<_UserEditor> {
  final form = GlobalKey<FormState>();
  late final TextEditingController name, nip;
  late JobRole role;
  late String departmentId;
  String? subdepartmentId, error;
  bool busy = false;
  Department get department =>
      departments.firstWhere((d) => d.id == departmentId);
  @override
  void initState() {
    super.initState();
    name = TextEditingController(text: widget.user?.name);
    nip = TextEditingController(text: widget.user?.nip);
    role = widget.user?.role ?? JobRole.staff;
    departmentId = widget.user?.departmentId ?? departments.first.id;
    subdepartmentId =
        widget.user?.subdepartmentId ??
        (role == JobRole.kepalaBagian
            ? null
            : department.subdepartments.first.id);
  }

  @override
  void dispose() {
    name.dispose();
    nip.dispose();
    super.dispose();
  }

  Future<void> save() async {
    if (busy || !form.currentState!.validate()) return;
    setState(() {
      busy = true;
      error = null;
    });
    final profile = UserProfile(
      uid: widget.user?.uid ?? 'nip_${nip.text.trim()}',
      nip: nip.text.trim(),
      name: name.text.trim(),
      role: role,
      departmentId: departmentId,
      subdepartmentId: subdepartmentId,
    );
    try {
      if (widget.user == null) {
        await widget.repository.create(profile);
      } else {
        await widget.repository.update(profile);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !busy,
    child: AlertDialog(
      title: Text(
        widget.user == null ? 'Tambah pengguna' : 'Edit jabatan pengguna',
      ),
      content: SizedBox(
        width: 520,
        child: SingleChildScrollView(
          child: Form(
            key: form,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextFormField(
                  controller: name,
                  enabled: !busy,
                  decoration: const InputDecoration(labelText: 'Nama lengkap'),
                  validator: (v) => v == null || v.trim().length < 2
                      ? 'Isi nama lengkap'
                      : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: nip,
                  enabled: !busy && widget.user == null,
                  keyboardType: TextInputType.number,
                  maxLength: 18,
                  decoration: const InputDecoration(
                    labelText: 'NIP',
                    helperText:
                        'NIP digunakan untuk login dan tidak dapat diubah.',
                  ),
                  validator: (v) =>
                      !validNip(v?.trim() ?? '') ? 'NIP harus 18 digit' : null,
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<JobRole>(
                  initialValue: role,
                  decoration: const InputDecoration(labelText: 'Jabatan'),
                  items: JobRole.values
                      .map(
                        (r) => DropdownMenuItem(value: r, child: Text(r.label)),
                      )
                      .toList(),
                  onChanged: busy
                      ? null
                      : (r) => setState(() {
                          role = r!;
                          subdepartmentId = role == JobRole.kepalaBagian
                              ? null
                              : department.subdepartments.first.id;
                        }),
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: departmentId,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Bagian'),
                  items: departments
                      .map(
                        (d) => DropdownMenuItem(
                          value: d.id,
                          child: Text(d.name, overflow: TextOverflow.ellipsis),
                        ),
                      )
                      .toList(),
                  onChanged: busy
                      ? null
                      : (id) => setState(() {
                          departmentId = id!;
                          subdepartmentId = role == JobRole.kepalaBagian
                              ? null
                              : department.subdepartments.first.id;
                        }),
                ),
                const SizedBox(height: 8),
                Text(
                  department.name,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 14),
                if (role != JobRole.kepalaBagian)
                  DropdownButtonFormField<String>(
                    key: ValueKey('$departmentId-${role.id}'),
                    initialValue: subdepartmentId,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Subbagian'),
                    items: department.subdepartments
                        .map(
                          (s) => DropdownMenuItem(
                            value: s.id,
                            child: Text(
                              s.name,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: busy
                        ? null
                        : (id) => setState(() => subdepartmentId = id),
                    validator: (v) => v == null ? 'Pilih subbagian' : null,
                  ),
                if (role == JobRole.kepalaBagian)
                  const Text(
                    'Kepala Bagian membawahi seluruh subbagian dalam bagian ini.',
                  ),
                const SizedBox(height: 18),
                const Text(
                  'Akun baru memakai password awal yang diberikan pengelola dan wajib menggantinya saat pertama masuk. Jabatan ini tidak otomatis memberi hak administrator.',
                  style: TextStyle(fontSize: 12),
                ),
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: busy ? null : () => Navigator.pop(context, false),
          child: const Text('Batal'),
        ),
        FilledButton(
          onPressed: busy ? null : save,
          child: Text(
            busy
                ? 'Menyimpan...'
                : widget.user == null
                ? 'Buat akun'
                : 'Simpan jabatan',
          ),
        ),
      ],
    ),
  );
}
