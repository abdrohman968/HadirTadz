<?php
$page_title = 'Data Guru';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$base_url = get_base_url();

$error = '';
$search = trim($_GET['search'] ?? '');

// Handle CRUD operations
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'save_teacher') {
        $teacher_id = $_POST['teacher_id'] ?? '';
        $full_name = trim($_POST['full_name'] ?? '');
        $nip = trim($_POST['nip'] ?? '');
        $gender = $_POST['gender'] ?? 'L';
        $subject = trim($_POST['subject_specialty'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $email = trim($_POST['email'] ?? '');

        try {
            $pdo->beginTransaction();

            if ($teacher_id) {
                // UPDATE
                $stmt = $pdo->prepare("SELECT user_id FROM teachers WHERE id = ?");
                $stmt->execute([$teacher_id]);
                $user_id = $stmt->fetchColumn();

                $updUser = $pdo->prepare("UPDATE users SET full_name = ?, identifier = ?, phone = ?, email = ?, updated_at = NOW() WHERE id = ?");
                $updUser->execute([$full_name, $nip, $phone, $email, $user_id]);

                $updTeacher = $pdo->prepare("
                    UPDATE teachers 
                    SET full_name = ?, nip = ?, gender = ?, subject_specialty = ?, updated_at = NOW() 
                    WHERE id = ?
                ");
                $updTeacher->execute([$full_name, $nip, $gender, $subject, $teacher_id]);

                $pdo->commit();
                log_audit('UPDATE_TEACHER', 'teachers', $teacher_id, "Updated teacher $full_name");
                set_flash('success', 'Data guru berhasil diperbarui!');
            } else {
                // INSERT
                $default_pass = password_hash('hadir123', PASSWORD_BCRYPT);
                $insUser = $pdo->prepare("
                    INSERT INTO users (role_id, identifier, full_name, password_hash, email, phone, status, created_at, updated_at) 
                    VALUES (2, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
                ");
                $insUser->execute([$nip, $full_name, $default_pass, $email, $phone]);
                $user_id = $pdo->lastInsertId();

                $insTeacher = $pdo->prepare("
                    INSERT INTO teachers (user_id, full_name, nip, gender, subject_specialty, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $insTeacher->execute([$user_id, $full_name, $nip, $gender, $subject]);

                $pdo->commit();
                log_audit('CREATE_TEACHER', 'teachers', $pdo->lastInsertId(), "Created teacher $full_name");
                set_flash('success', 'Guru baru berhasil ditambahkan! (Password: hadir123)');
            }

            header("Location: teachers.php");
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            $error = 'Gagal menyimpan: ' . $e->getMessage();
        }
    } elseif ($action === 'delete_teacher') {
        $del_id = $_POST['teacher_id'] ?? '';
        if ($del_id) {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("SELECT user_id FROM teachers WHERE id = ?");
            $stmt->execute([$del_id]);
            $user_id = $stmt->fetchColumn();

            $pdo->prepare("DELETE FROM teachers WHERE id = ?")->execute([$del_id]);
            if ($user_id) {
                $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$user_id]);
            }
            $pdo->commit();
            log_audit('DELETE_TEACHER', 'teachers', $del_id, "Deleted teacher");
            set_flash('success', 'Data guru berhasil dihapus.');
            header("Location: teachers.php");
            exit;
        }
    }
}

// Build Query
$sql = "
    SELECT t.*, u.phone, u.email, u.last_login_at
    FROM teachers t
    JOIN users u ON t.user_id = u.id
    WHERE t.deleted_at IS NULL
";
$params = [];

if (!empty($search)) {
    $sql .= " AND (t.full_name LIKE :s OR t.nip LIKE :s OR t.subject_specialty LIKE :s)";
    $params[':s'] = "%$search%";
}

$sql .= " ORDER BY t.full_name";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$teachers = $stmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Data Guru Pengajar</h1>
                <p class="text-xs sm:text-sm text-slate-500">Kelola tenaga pendidik, NIP, mata pelajaran, dan kontak.</p>
            </div>
            <button onclick="openTeacherModal()" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2">
                <i class="fa-solid fa-chalkboard-user"></i>
                <span>Tambah Guru</span>
            </button>
        </div>

        <?php if (!empty($error)): ?>
            <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- Search Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <form method="GET" action="" class="flex gap-3">
                <div class="flex-1 relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <i class="fa-solid fa-magnifying-glass text-xs"></i>
                    </div>
                    <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Cari nama guru, NIP, atau mata pelajaran..." class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
                <button type="submit" class="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition">
                    Cari
                </button>
            </form>
        </div>

        <!-- Teachers Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Guru: <strong class="text-slate-800 font-extrabold"><?= count($teachers) ?></strong> Orang
                </span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-600">
                    <thead class="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                        <tr>
                            <th class="py-3 px-4">Nama Lengkap & NIP</th>
                            <th class="py-3 px-4">Mata Pelajaran</th>
                            <th class="py-3 px-4">Gender</th>
                            <th class="py-3 px-4">Email</th>
                            <th class="py-3 px-4">No. HP / WA</th>
                            <th class="py-3 px-4">Terakhir Masuk</th>
                            <th class="py-3 px-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php if (empty($teachers)): ?>
                            <tr>
                                <td colspan="7" class="text-center py-10 text-slate-400">
                                    Belum ada data guru pengajar yang ditemukan.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($teachers as $t): ?>
                                <tr class="hover:bg-slate-50/80 transition">
                                    <td class="py-3 px-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                                                <?= strtoupper(substr($t['full_name'], 0, 1)) ?>
                                            </div>
                                            <div>
                                                <div class="font-bold text-slate-800"><?= htmlspecialchars($t['full_name']) ?></div>
                                                <div class="font-mono text-[10px] text-slate-400">NIP: <?= htmlspecialchars($t['nip']) ?></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4">
                                        <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <?= htmlspecialchars($t['subject_specialty'] ?: 'Umum') ?>
                                        </span>
                                    </td>
                                    <td class="py-3 px-4">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold <?= ($t['gender'] === 'L') ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800' ?>">
                                            <?= ($t['gender'] === 'L') ? 'Laki-laki' : 'Perempuan' ?>
                                        </span>
                                    </td>
                                    <td class="py-3 px-4 text-slate-600">
                                        <?= htmlspecialchars($t['email'] ?: '-') ?>
                                    </td>
                                    <td class="py-3 px-4 font-mono text-slate-600">
                                        <?= htmlspecialchars($t['phone'] ?: '-') ?>
                                    </td>
                                    <td class="py-3 px-4 text-slate-400 text-[11px]">
                                        <?= $t['last_login_at'] ? format_date_indo($t['last_login_at'], false, true) : 'Belum pernah' ?>
                                    </td>
                                    <td class="py-3 px-4 text-center">
                                        <div class="flex items-center justify-center gap-1.5">
                                            <button type="button" onclick="editTeacher(<?= htmlspecialchars(json_encode($t)) ?>)" class="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition" title="Edit">
                                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                                            </button>
                                            <form method="POST" action="" onsubmit="return confirm('Hapus data guru ini?');" class="inline">
                                                <input type="hidden" name="action" value="delete_teacher">
                                                <input type="hidden" name="teacher_id" value="<?= $t['id'] ?>">
                                                <button type="submit" class="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition" title="Hapus">
                                                    <i class="fa-solid fa-trash text-xs"></i>
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</main>

<!-- Modal Add / Edit Teacher -->
<div id="modal-teacher" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 id="modal-teacher-title" class="text-base font-bold text-slate-800">Tambah Guru Pengajar</h3>
            <button onclick="closeModal('modal-teacher')" class="text-slate-400 hover:text-slate-600 text-sm">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="save_teacher">
            <input type="hidden" id="form-teacher-id" name="teacher_id" value="">

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Lengkap & Gelar</label>
                <input type="text" name="full_name" id="form-teacher-name" required placeholder="Contoh: Budi Santoso, S.Kom" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">NIP / ID Guru</label>
                    <input type="text" name="nip" id="form-teacher-nip" required placeholder="19850315..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Jenis Kelamin</label>
                    <select name="gender" id="form-teacher-gender" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Mata Pelajaran yang Diampu</label>
                <input type="text" name="subject_specialty" id="form-teacher-subject" placeholder="Contoh: Informatika / Matematika" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
                    <input type="email" name="email" id="form-teacher-email" placeholder="nama@sekolah.sch.id" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">No. HP / WhatsApp</label>
                    <input type="text" name="phone" id="form-teacher-phone" placeholder="08xxxxxxxx" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                </div>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onclick="closeModal('modal-teacher')" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">
                    Batal
                </button>
                <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm">
                    Simpan Data Guru
                </button>
            </div>
        </form>
    </div>
</div>

<script>
    function openTeacherModal() {
        document.getElementById('form-teacher-id').value = '';
        document.getElementById('form-teacher-name').value = '';
        document.getElementById('form-teacher-nip').value = '';
        document.getElementById('form-teacher-subject').value = '';
        document.getElementById('form-teacher-email').value = '';
        document.getElementById('form-teacher-phone').value = '';
        document.getElementById('modal-teacher-title').textContent = 'Tambah Guru Pengajar';
        document.getElementById('modal-teacher').classList.remove('hidden');
    }

    function editTeacher(data) {
        document.getElementById('form-teacher-id').value = data.id;
        document.getElementById('form-teacher-name').value = data.full_name;
        document.getElementById('form-teacher-nip').value = data.nip;
        document.getElementById('form-teacher-gender').value = data.gender;
        document.getElementById('form-teacher-subject').value = data.subject_specialty || '';
        document.getElementById('form-teacher-email').value = data.email || '';
        document.getElementById('form-teacher-phone').value = data.phone || '';
        document.getElementById('modal-teacher-title').textContent = `Edit Guru: ${data.full_name}`;
        document.getElementById('modal-teacher').classList.remove('hidden');
    }

    function closeModal(id) {
        document.getElementById(id).classList.add('hidden');
    }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
