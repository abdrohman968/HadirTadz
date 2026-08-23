<?php
$page_title = 'Data Guru';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$school_id = auth_school_id();

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
                $stmt = $pdo->prepare("SELECT user_id FROM teachers WHERE id = ? AND school_id = ?");
                $stmt->execute([$teacher_id, $school_id]);
                $user_id = $stmt->fetchColumn();

                if (!$user_id) {
                    throw new Exception('Guru tidak ditemukan pada sekolah ini.');
                }

                $updUser = $pdo->prepare("UPDATE users SET full_name = ?, identifier = ?, phone = ?, email = ?, updated_at = NOW() WHERE id = ? AND school_id = ?");
                $updUser->execute([$full_name, $nip, $phone, $email, $user_id, $school_id]);

                $updTeacher = $pdo->prepare("
                    UPDATE teachers 
                    SET full_name = ?, nip = ?, gender = ?, subject_specialty = ?, updated_at = NOW() 
                    WHERE id = ? AND school_id = ?
                ");
                $updTeacher->execute([$full_name, $nip, $gender, $subject, $teacher_id, $school_id]);

                $pdo->commit();
                log_audit('UPDATE_TEACHER', 'teachers', $teacher_id, "Updated teacher $full_name");
                set_flash('success', 'Data guru berhasil diperbarui!');
            } else {
                // INSERT
                $default_pass = password_hash('hadir123', PASSWORD_BCRYPT);
                $insUser = $pdo->prepare("
                    INSERT INTO users (school_id, role_id, identifier, full_name, password_hash, email, phone, status, created_at, updated_at) 
                    VALUES (?, 2, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
                ");
                $insUser->execute([$school_id, $nip, $full_name, $default_pass, $email, $phone]);
                $user_id = $pdo->lastInsertId();

                $insTeacher = $pdo->prepare("
                    INSERT INTO teachers (school_id, user_id, full_name, nip, gender, subject_specialty, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $insTeacher->execute([$school_id, $user_id, $full_name, $nip, $gender, $subject]);

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
            $stmt = $pdo->prepare("SELECT user_id FROM teachers WHERE id = ? AND school_id = ?");
            $stmt->execute([$del_id, $school_id]);
            $user_id = $stmt->fetchColumn();

            if (!$user_id) {
                $pdo->rollBack();
                set_flash('error', 'Guru tidak ditemukan pada sekolah ini.');
                header("Location: teachers.php");
                exit;
            }

            $pdo->prepare("DELETE FROM teachers WHERE id = ? AND school_id = ?")->execute([$del_id, $school_id]);
            if ($user_id) {
                $pdo->prepare("DELETE FROM users WHERE id = ? AND school_id = ?")->execute([$user_id, $school_id]);
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
    WHERE t.deleted_at IS NULL AND t.school_id = :school_id
";
$params = [':school_id' => $school_id];

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

        <?= ds_page_header('Data Guru Pengajar', 'Kelola tenaga pendidik, NIP, mata pelajaran, dan kontak.', ds_button('<i class="fa-solid fa-chalkboard-user"></i> <span>Tambah Guru</span>', 'primary', 'button', ['onclick' => 'openTeacherModal()'])) ?>

        <?php if (!empty($error)): ?>
            <?= ds_alert($error, 'danger') ?>
        <?php endif; ?>

        <!-- Search Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <form method="GET" action="" class="flex gap-3">
                <div class="flex-1 relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <i class="fa-solid fa-magnifying-glass text-xs"></i>
                    </div>
                    <?= ds_input('search', '', 'text', $search, ['placeholder' => 'Cari nama guru, NIP, atau mata pelajaran...', 'class' => 'pl-9']) ?>
                </div>
                <?= ds_button('Cari', 'secondary', 'submit', ['class' => 'py-2.5 px-5']) ?>
            </form>
        </div>

        <!-- Teachers Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Guru: <strong class="text-slate-800 font-extrabold"><?= count($teachers) ?></strong> Orang
                </span>
            </div>

            <div class="table-responsive-card">
                <table class="w-full text-left text-xs text-slate-600">
                    <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
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
                                <td colspan="7" class="text-center py-10 text-slate-500" data-label="">
                                    Belum ada data guru pengajar yang ditemukan.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($teachers as $t): ?>
                                <tr class="hover:bg-slate-50/80 transition">
                                    <td class="py-3 px-4" data-label="Nama Lengkap & NIP">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                                                <?= strtoupper(substr($t['full_name'], 0, 1)) ?>
                                            </div>
                                            <div>
                                                <div class="font-bold text-slate-800"><?= htmlspecialchars($t['full_name']) ?></div>
                                                <div class="font-mono text-[10px] text-slate-500">NIP: <?= htmlspecialchars($t['nip']) ?></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4" data-label="Mata Pelajaran">
                                        <?= ds_badge(htmlspecialchars($t['subject_specialty'] ?: 'Umum'), 'success') ?>
                                    </td>
                                    <td class="py-3 px-4" data-label="Gender">
                                        <?= ds_badge(($t['gender'] === 'L') ? 'Laki-laki' : 'Perempuan', ($t['gender'] === 'L') ? 'info' : 'danger') ?>
                                    </td>
                                    <td class="py-3 px-4 text-slate-600" data-label="Email">
                                        <?= htmlspecialchars($t['email'] ?: '-') ?>
                                    </td>
                                    <td class="py-3 px-4 font-mono text-slate-600" data-label="No. HP / WA">
                                        <?= htmlspecialchars($t['phone'] ?: '-') ?>
                                    </td>
                                    <td class="py-3 px-4 text-slate-500 text-[11px]" data-label="Terakhir Masuk">
                                        <?= $t['last_login_at'] ? format_date_indo($t['last_login_at'], false, true) : 'Belum pernah' ?>
                                    </td>
                                    <td class="py-3 px-4 text-center" data-label="Aksi">
                                        <div class="flex items-center justify-center gap-1.5">
                                            <?= ds_icon_button('fa-solid fa-pen-to-square', 'primary', 'button', ['onclick' => 'editTeacher(' . htmlspecialchars(json_encode($t)) . ')', 'title' => 'Edit', 'aria_label' => 'Edit ' . htmlspecialchars($t['full_name'])]) ?>
                                            <form method="POST" action="" onsubmit="return confirm('Hapus data guru ini?');" class="inline">
                                                <input type="hidden" name="action" value="delete_teacher">
                                                <input type="hidden" name="teacher_id" value="<?= $t['id'] ?>">
                                                <?= ds_icon_button('fa-solid fa-trash', 'danger', 'submit', ['title' => 'Hapus', 'aria_label' => 'Hapus ' . htmlspecialchars($t['full_name'])]) ?>
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
<?= ds_modal_start('modal-teacher', 'Tambah Guru Pengajar', 'lg') ?>

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="save_teacher">
            <input type="hidden" id="form-teacher-id" name="teacher_id" value="">

            <?= ds_input('full_name', 'Nama Lengkap & Gelar', 'text', '', ['id' => 'form-teacher-name', 'required' => true, 'placeholder' => 'Contoh: Budi Santoso, S.Kom']) ?>

            <div class="grid grid-cols-2 gap-3">
                <?= ds_input('nip', 'NIP / ID Guru', 'text', '', ['id' => 'form-teacher-nip', 'required' => true, 'placeholder' => '19850315...', 'class' => 'font-mono']) ?>
                <?= ds_select('gender', ['L' => 'Laki-laki', 'P' => 'Perempuan'], 'L', 'Jenis Kelamin', ['id' => 'form-teacher-gender']) ?>
            </div>

            <?= ds_input('subject_specialty', 'Mata Pelajaran yang Diampu', 'text', '', ['id' => 'form-teacher-subject', 'placeholder' => 'Contoh: Informatika / Matematika']) ?>

            <div class="grid grid-cols-2 gap-3">
                <?= ds_input('email', 'Email', 'email', '', ['id' => 'form-teacher-email', 'placeholder' => 'nama@sekolah.sch.id']) ?>
                <?= ds_input('phone', 'No. HP / WhatsApp', 'text', '', ['id' => 'form-teacher-phone', 'placeholder' => '08xxxxxxxx', 'class' => 'font-mono']) ?>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <?= ds_button('Batal', 'ghost', 'button', ['onclick' => "closeModal('modal-teacher')"]) ?>
                <?= ds_button('Simpan Data Guru', 'primary', 'submit') ?>
            </div>
        </form>

<?= ds_modal_end() ?>

<script>
    function openTeacherModal() {
        document.getElementById('form-teacher-id').value = '';
        document.getElementById('form-teacher-name').value = '';
        document.getElementById('form-teacher-nip').value = '';
        document.getElementById('form-teacher-subject').value = '';
        document.getElementById('form-teacher-email').value = '';
        document.getElementById('form-teacher-phone').value = '';
        openModal('modal-teacher');
    }

    function editTeacher(data) {
        document.getElementById('form-teacher-id').value = data.id;
        document.getElementById('form-teacher-name').value = data.full_name;
        document.getElementById('form-teacher-nip').value = data.nip;
        document.getElementById('form-teacher-gender').value = data.gender;
        document.getElementById('form-teacher-subject').value = data.subject_specialty || '';
        document.getElementById('form-teacher-email').value = data.email || '';
        document.getElementById('form-teacher-phone').value = data.phone || '';
        openModal('modal-teacher');
    }
</script>

<?= ds_modal_js() ?>

<?php include __DIR__ . '/../includes/footer.php'; ?>
