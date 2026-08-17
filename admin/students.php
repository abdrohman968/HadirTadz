<?php
$page_title = 'Data Siswa';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$base_url = get_base_url();

$error = '';
$filter_class = $_GET['class_id'] ?? '';
$search = trim($_GET['search'] ?? '');

// Handle CRUD operations
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'save_student') {
        $student_id = $_POST['student_id'] ?? '';
        $full_name = trim($_POST['full_name'] ?? '');
        $nisn = trim($_POST['nisn'] ?? '');
        $class_id = $_POST['class_id'] ?: null;
        $gender = $_POST['gender'] ?? 'L';
        $parent_name = trim($_POST['parent_name'] ?? '');
        $parent_phone = trim($_POST['parent_phone'] ?? '');

        try {
            $pdo->beginTransaction();

            if ($student_id) {
                // UPDATE
                $stmt = $pdo->prepare("SELECT user_id FROM students WHERE id = ?");
                $stmt->execute([$student_id]);
                $user_id = $stmt->fetchColumn();

                // Update users table
                $updUser = $pdo->prepare("UPDATE users SET full_name = ?, identifier = ?, updated_at = NOW() WHERE id = ?");
                $updUser->execute([$full_name, $nisn, $user_id]);

                // Update students table
                $updStd = $pdo->prepare("
                    UPDATE students 
                    SET full_name = ?, nisn = ?, class_id = ?, gender = ?, parent_name = ?, parent_phone = ?, updated_at = NOW() 
                    WHERE id = ?
                ");
                $updStd->execute([$full_name, $nisn, $class_id, $gender, $parent_name, $parent_phone, $student_id]);

                $pdo->commit();
                log_audit('UPDATE_STUDENT', 'students', $student_id, "Updated student $full_name");
                set_flash('success', 'Data siswa berhasil diperbarui!');
            } else {
                // INSERT NEW USER & STUDENT
                $default_pass = password_hash('hadir123', PASSWORD_BCRYPT);
                $insUser = $pdo->prepare("
                    INSERT INTO users (role_id, identifier, full_name, password_hash, status, created_at, updated_at) 
                    VALUES (3, ?, ?, ?, 'active', NOW(), NOW())
                ");
                $insUser->execute([$nisn, $full_name, $default_pass]);
                $user_id = $pdo->lastInsertId();

                $insStd = $pdo->prepare("
                    INSERT INTO students (user_id, class_id, full_name, nisn, gender, parent_name, parent_phone, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $insStd->execute([$user_id, $class_id, $full_name, $nisn, $gender, $parent_name, $parent_phone]);

                $pdo->commit();
                log_audit('CREATE_STUDENT', 'students', $pdo->lastInsertId(), "Created student $full_name");
                set_flash('success', 'Siswa baru berhasil ditambahkan! (Password default: hadir123)');
            }

            header("Location: students.php");
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            $error = 'Gagal menyimpan: ' . $e->getMessage();
        }
    } elseif ($action === 'delete_student') {
        $del_id = $_POST['student_id'] ?? '';
        if ($del_id) {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("SELECT user_id FROM students WHERE id = ?");
            $stmt->execute([$del_id]);
            $user_id = $stmt->fetchColumn();

            $pdo->prepare("DELETE FROM students WHERE id = ?")->execute([$del_id]);
            if ($user_id) {
                $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$user_id]);
            }
            $pdo->commit();
            log_audit('DELETE_STUDENT', 'students', $del_id, "Deleted student");
            set_flash('success', 'Data siswa berhasil dihapus.');
            header("Location: students.php");
            exit;
        }
    }
}

// Fetch Classes for dropdown & filter
$classes = $pdo->query("SELECT * FROM classes ORDER BY grade, class_name")->fetchAll();

// Build Query
$sql = "
    SELECT s.*, c.class_name, c.grade, c.major, u.status AS user_status, u.last_login_at
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.deleted_at IS NULL
";
$params = [];

if (!empty($filter_class)) {
    $sql .= " AND s.class_id = :class_id";
    $params[':class_id'] = $filter_class;
}

if (!empty($search)) {
    $sql .= " AND (s.full_name LIKE :s OR s.nisn LIKE :s OR s.parent_name LIKE :s)";
    $params[':s'] = "%$search%";
}

$sql .= " ORDER BY c.grade, c.class_name, s.full_name";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$students = $stmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Data Siswa</h1>
                <p class="text-xs sm:text-sm text-slate-500">Kelola informasi peserta didik, NISN, dan generate kartu pelajar digital.</p>
            </div>
            <div class="flex items-center gap-2.5">
                <button onclick="openStudentModal()" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2">
                    <i class="fa-solid fa-user-plus"></i>
                    <span>Tambah Siswa</span>
                </button>
                <a href="<?= $base_url ?>/admin/cards.php" class="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition flex items-center gap-2">
                    <i class="fa-solid fa-id-card text-emerald-600"></i>
                    <span>Cetak Kartu Pelajar</span>
                </a>
            </div>
        </div>

        <?php if (!empty($error)): ?>
            <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- Filter & Search Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <form method="GET" action="" class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Kelas</label>
                    <select name="class_id" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="">-- Semua Kelas --</option>
                        <?php foreach ($classes as $c): ?>
                            <option value="<?= $c['id'] ?>" <?= ($filter_class == $c['id']) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($c['class_name']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cari Nama / NISN</label>
                    <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Ketik nama atau NISN..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>

                <div class="flex gap-2">
                    <button type="submit" class="flex-1 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition">
                        Terapkan
                    </button>
                    <a href="students.php" class="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition" title="Reset">
                        <i class="fa-solid fa-rotate-left"></i>
                    </a>
                </div>
            </form>
        </div>

        <!-- Students Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Siswa: <strong class="text-slate-800 font-extrabold"><?= count($students) ?></strong> Orang
                </span>
            </div>

            <div class="table-responsive-card">
                <table class="w-full text-left text-xs text-slate-600">
                    <thead class="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                        <tr>
                            <th class="py-3 px-4">Nama Lengkap</th>
                            <th class="py-3 px-4">NISN</th>
                            <th class="py-3 px-4">Kelas & Jurusan</th>
                            <th class="py-3 px-4">Gender</th>
                            <th class="py-3 px-4">Orang Tua / Wali</th>
                            <th class="py-3 px-4">No. HP Orang Tua</th>
                            <th class="py-3 px-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php if (empty($students)): ?>
                            <tr>
                                <td colspan="7" class="text-center py-10 text-slate-400" data-label="">
                                    Belum ada data siswa yang ditemukan.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($students as $s): ?>
                                <tr class="hover:bg-slate-50/80 transition">
                                    <td class="py-3 px-4" data-label="Nama Lengkap">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                                                <?= strtoupper(substr($s['full_name'], 0, 1)) ?>
                                            </div>
                                            <div>
                                                <div class="font-bold text-slate-800"><?= htmlspecialchars($s['full_name']) ?></div>
                                                <div class="text-[10px] text-emerald-600 font-medium">Password: hadir123</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4 font-mono font-bold text-slate-700" data-label="NISN">
                                        <?= htmlspecialchars($s['nisn']) ?>
                                    </td>
                                    <td class="py-3 px-4" data-label="Kelas & Jurusan">
                                        <span class="font-bold text-slate-700"><?= htmlspecialchars($s['class_name'] ?? 'Belum Ditentukan') ?></span>
                                        <span class="block text-[10px] text-slate-400"><?= htmlspecialchars($s['major'] ?? '') ?></span>
                                    </td>
                                    <td class="py-3 px-4" data-label="Gender">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold <?= ($s['gender'] === 'L') ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800' ?>">
                                            <?= ($s['gender'] === 'L') ? 'Laki-laki' : 'Perempuan' ?>
                                        </span>
                                    </td>
                                    <td class="py-3 px-4 text-slate-700" data-label="Orang Tua / Wali">
                                        <?= htmlspecialchars($s['parent_name'] ?: '-') ?>
                                    </td>
                                    <td class="py-3 px-4 font-mono text-slate-600" data-label="No. HP Orang Tua">
                                        <?= htmlspecialchars($s['parent_phone'] ?: '-') ?>
                                    </td>
                                    <td class="py-3 px-4 text-center" data-label="Aksi">
                                        <div class="flex items-center justify-center gap-1.5">
                                            <button type="button" onclick="editStudent(<?= htmlspecialchars(json_encode($s)) ?>)" class="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition" title="Edit Data">
                                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                                            </button>
                                            <form method="POST" action="" onsubmit="return confirm('Yakin ingin menghapus siswa ini? Seluruh data akun & absensi juga akan terhapus.');" class="inline">
                                                <input type="hidden" name="action" value="delete_student">
                                                <input type="hidden" name="student_id" value="<?= $s['id'] ?>">
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

<!-- Modal Add / Edit Student -->
<div id="modal-student" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 id="modal-student-title" class="text-base font-bold text-slate-800">Tambah Siswa Baru</h3>
            <button onclick="closeModal('modal-student')" class="text-slate-400 hover:text-slate-600 text-sm">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="save_student">
            <input type="hidden" id="form-student-id" name="student_id" value="">

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Lengkap Siswa</label>
                <input type="text" name="full_name" id="form-full-name" required placeholder="Contoh: Ahmad Maulana" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">NISN / ID Siswa</label>
                    <input type="text" name="nisn" id="form-nisn" required placeholder="Contoh: 12009105" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Jenis Kelamin</label>
                    <select name="gender" id="form-gender" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Kelas</label>
                <select name="class_id" id="form-class-id" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    <option value="">-- Pilih Kelas --</option>
                    <?php foreach ($classes as $c): ?>
                        <option value="<?= $c['id'] ?>">
                            <?= htmlspecialchars($c['class_name']) ?> (<?= htmlspecialchars($c['major']) ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Orang Tua / Wali</label>
                    <input type="text" name="parent_name" id="form-parent-name" placeholder="Nama ayah/ibu" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">No. WhatsApp Orang Tua</label>
                    <input type="text" name="parent_phone" id="form-parent-phone" placeholder="08xxxxxxxx" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                </div>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onclick="closeModal('modal-student')" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">
                    Batal
                </button>
                <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm">
                    Simpan Data Siswa
                </button>
            </div>
        </form>
    </div>
</div>

<script>
    function openStudentModal() {
        document.getElementById('form-student-id').value = '';
        document.getElementById('form-full-name').value = '';
        document.getElementById('form-nisn').value = '';
        document.getElementById('form-parent-name').value = '';
        document.getElementById('form-parent-phone').value = '';
        document.getElementById('modal-student-title').textContent = 'Tambah Siswa Baru';
        document.getElementById('modal-student').classList.remove('hidden');
    }

    function editStudent(data) {
        document.getElementById('form-student-id').value = data.id;
        document.getElementById('form-full-name').value = data.full_name;
        document.getElementById('form-nisn').value = data.nisn;
        document.getElementById('form-gender').value = data.gender;
        document.getElementById('form-class-id').value = data.class_id || '';
        document.getElementById('form-parent-name').value = data.parent_name || '';
        document.getElementById('form-parent-phone').value = data.parent_phone || '';
        document.getElementById('modal-student-title').textContent = `Edit Siswa: ${data.full_name}`;
        document.getElementById('modal-student').classList.remove('hidden');
    }

    function closeModal(id) {
        document.getElementById(id).classList.add('hidden');
    }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
