<?php
$page_title = 'Data Siswa';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$school_id = auth_school_id();

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
                $stmt = $pdo->prepare("SELECT user_id FROM students WHERE id = ? AND school_id = ?");
                $stmt->execute([$student_id, $school_id]);
                $user_id = $stmt->fetchColumn();

                if (!$user_id) {
                    throw new Exception('Siswa tidak ditemukan pada sekolah ini.');
                }

                // Update users table
                $updUser = $pdo->prepare("UPDATE users SET full_name = ?, identifier = ?, updated_at = NOW() WHERE id = ? AND school_id = ?");
                $updUser->execute([$full_name, $nisn, $user_id, $school_id]);

                // Update students table
                $updStd = $pdo->prepare("
                    UPDATE students 
                    SET full_name = ?, nisn = ?, class_id = ?, gender = ?, parent_name = ?, parent_phone = ?, updated_at = NOW() 
                    WHERE id = ? AND school_id = ?
                ");
                $updStd->execute([$full_name, $nisn, $class_id, $gender, $parent_name, $parent_phone, $student_id, $school_id]);

                $pdo->commit();
                log_audit('UPDATE_STUDENT', 'students', $student_id, "Updated student $full_name");
                set_flash('success', 'Data siswa berhasil diperbarui!');
            } else {
                // INSERT NEW USER & STUDENT
                $default_pass = password_hash('hadir123', PASSWORD_BCRYPT);
                $insUser = $pdo->prepare("
                    INSERT INTO users (school_id, role_id, identifier, full_name, password_hash, status, created_at, updated_at) 
                    VALUES (?, 3, ?, ?, ?, 'active', NOW(), NOW())
                ");
                $insUser->execute([$school_id, $nisn, $full_name, $default_pass]);
                $user_id = $pdo->lastInsertId();

                $insStd = $pdo->prepare("
                    INSERT INTO students (school_id, user_id, class_id, full_name, nisn, gender, parent_name, parent_phone, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $insStd->execute([$school_id, $user_id, $class_id, $full_name, $nisn, $gender, $parent_name, $parent_phone]);

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
            $stmt = $pdo->prepare("SELECT user_id FROM students WHERE id = ? AND school_id = ?");
            $stmt->execute([$del_id, $school_id]);
            $user_id = $stmt->fetchColumn();

            if (!$user_id) {
                $pdo->rollBack();
                set_flash('error', 'Siswa tidak ditemukan pada sekolah ini.');
                header("Location: students.php");
                exit;
            }

            $pdo->prepare("DELETE FROM students WHERE id = ? AND school_id = ?")->execute([$del_id, $school_id]);
            if ($user_id) {
                $pdo->prepare("DELETE FROM users WHERE id = ? AND school_id = ?")->execute([$user_id, $school_id]);
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
$classes = $pdo->prepare("SELECT * FROM classes WHERE school_id = ? ORDER BY grade, class_name");
$classes->execute([$school_id]);
$classes = $classes->fetchAll();

// Build Query
$sql = "
    SELECT s.*, c.class_name, c.grade, c.major, u.status AS user_status, u.last_login_at
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.deleted_at IS NULL AND s.school_id = :school_id
";
$params = [':school_id' => $school_id];

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

        <?= ds_page_header('Data Siswa', 'Kelola informasi peserta didik, NISN, dan generate kartu pelajar digital.', ds_button('<i class="fa-solid fa-user-plus"></i> <span>Tambah Siswa</span>', 'primary', 'button', ['onclick' => 'openStudentModal()']) . '<a href="' . $base_url . '/admin/cards.php" class="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition flex items-center gap-2"><i class="fa-solid fa-id-card text-emerald-600"></i><span>Cetak Kartu Pelajar</span></a>') ?>

        <?php if (!empty($error)): ?>
            <?= ds_alert($error, 'danger') ?>
        <?php endif; ?>

        <!-- Filter & Search Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <form method="GET" action="" class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                    <?= ds_select('class_id', ['' => '-- Semua Kelas --'] + array_column($classes, 'class_name', 'id'), $filter_class, 'Filter Kelas') ?>
                </div>

                <div>
                    <?= ds_input('search', 'Cari Nama / NISN', 'text', $search, ['placeholder' => 'Ketik nama atau NISN...']) ?>
                </div>

                <div class="flex gap-2">
                    <?= ds_button('Terapkan', 'secondary', 'submit', ['class' => 'flex-1']) ?>
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
                    <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
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
                                <td colspan="7" class="text-center py-10 text-slate-500" data-label="">
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
                                        <span class="block text-[10px] text-slate-500"><?= htmlspecialchars($s['major'] ?? '') ?></span>
                                    </td>
                                    <td class="py-3 px-4" data-label="Gender">
                                        <?= ds_badge(($s['gender'] === 'L') ? 'Laki-laki' : 'Perempuan', ($s['gender'] === 'L') ? 'info' : 'danger') ?>
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
<?= ds_modal_start('modal-student', 'Tambah Siswa Baru', 'lg') ?>

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="save_student">
            <input type="hidden" id="form-student-id" name="student_id" value="">

            <?= ds_input('full_name', 'Nama Lengkap Siswa', 'text', '', ['id' => 'form-full-name', 'required' => true, 'placeholder' => 'Contoh: Ahmad Maulana']) ?>

            <div class="grid grid-cols-2 gap-3">
                <?= ds_input('nisn', 'NISN / ID Siswa', 'text', '', ['id' => 'form-nisn', 'required' => true, 'placeholder' => 'Contoh: 12009105', 'class' => 'font-mono']) ?>
                <?= ds_select('gender', ['L' => 'Laki-laki', 'P' => 'Perempuan'], 'L', 'Jenis Kelamin', ['id' => 'form-gender']) ?>
            </div>

            <?php
            $class_options = ['' => '-- Pilih Kelas --'];
            foreach ($classes as $c) {
                $class_options[$c['id']] = htmlspecialchars($c['class_name']) . ' (' . htmlspecialchars($c['major']) . ')';
            }
            ?>
            <?= ds_select('class_id', $class_options, '', 'Kelas', ['id' => 'form-class-id', 'required' => true]) ?>

            <div class="grid grid-cols-2 gap-3">
                <?= ds_input('parent_name', 'Nama Orang Tua / Wali', 'text', '', ['id' => 'form-parent-name', 'placeholder' => 'Nama ayah/ibu']) ?>
                <?= ds_input('parent_phone', 'No. WhatsApp Orang Tua', 'text', '', ['id' => 'form-parent-phone', 'placeholder' => '08xxxxxxxx', 'class' => 'font-mono']) ?>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <?= ds_button('Batal', 'ghost', 'button', ['onclick' => "closeModal('modal-student')"]) ?>
                <?= ds_button('Simpan Data Siswa', 'primary', 'submit') ?>
            </div>
        </form>

<?= ds_modal_end() ?>

<script>
    function openStudentModal() {
        document.getElementById('form-student-id').value = '';
        document.getElementById('form-full-name').value = '';
        document.getElementById('form-nisn').value = '';
        document.getElementById('form-parent-name').value = '';
        document.getElementById('form-parent-phone').value = '';
        openModal('modal-student');
    }

    function editStudent(data) {
        document.getElementById('form-student-id').value = data.id;
        document.getElementById('form-full-name').value = data.full_name;
        document.getElementById('form-nisn').value = data.nisn;
        document.getElementById('form-gender').value = data.gender;
        document.getElementById('form-class-id').value = data.class_id || '';
        document.getElementById('form-parent-name').value = data.parent_name || '';
        document.getElementById('form-parent-phone').value = data.parent_phone || '';
        openModal('modal-student');
    }
</script>

<?= ds_modal_js() ?>

<?php include __DIR__ . '/../includes/footer.php'; ?>
