<?php
$page_title = 'Data Kelas';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$school_id = auth_school_id();

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'save_class') {
        $class_id = $_POST['class_id'] ?? '';
        $class_code = trim($_POST['class_code'] ?? '');
        $class_name = trim($_POST['class_name'] ?? '');
        $grade = $_POST['grade'] ?? 'X';
        $major = trim($_POST['major'] ?? '');
        $teacher_id = $_POST['homeroom_teacher_id'] ?: null;
        $academic_year = trim($_POST['academic_year'] ?? '2025/2026');

        try {
            if ($class_id) {
                $stmt = $pdo->prepare("
                    UPDATE classes 
                    SET class_code = ?, class_name = ?, grade = ?, major = ?, homeroom_teacher_id = ?, academic_year = ?, updated_at = NOW() 
                    WHERE id = ? AND school_id = ?
                ");
                $stmt->execute([$class_code, $class_name, $grade, $major, $teacher_id, $academic_year, $class_id, $school_id]);
                log_audit('UPDATE_CLASS', 'classes', $class_id, "Updated class $class_name");
                set_flash('success', 'Data kelas berhasil diperbarui!');
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO classes (school_id, class_code, class_name, grade, major, homeroom_teacher_id, academic_year, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([$school_id, $class_code, $class_name, $grade, $major, $teacher_id, $academic_year]);
                log_audit('CREATE_CLASS', 'classes', $pdo->lastInsertId(), "Created class $class_name");
                set_flash('success', 'Kelas baru berhasil ditambahkan!');
            }
            header("Location: classes.php");
            exit;
        } catch (Exception $e) {
            $error = 'Gagal menyimpan: ' . $e->getMessage();
        }
    } elseif ($action === 'delete_class') {
        $del_id = $_POST['class_id'] ?? '';
        if ($del_id) {
            $stmt = $pdo->prepare("DELETE FROM classes WHERE id = ? AND school_id = ?");
            $stmt->execute([$del_id, $school_id]);
            log_audit('DELETE_CLASS', 'classes', $del_id, "Deleted class");
            set_flash('success', 'Data kelas berhasil dihapus.');
            header("Location: classes.php");
            exit;
        }
    }
}

// Fetch Teachers for Homeroom assignment (opsional untuk sekolah ini)
$teachers = $pdo->prepare("SELECT * FROM teachers WHERE deleted_at IS NULL AND school_id = ? ORDER BY full_name");
$teachers->execute([$school_id]);
$teachers = $teachers->fetchAll();

// Fetch Classes with Homeroom & Student count
$classes = $pdo->prepare("
    SELECT c.*, t.full_name AS homeroom_name, t.nip AS homeroom_nip,
           COUNT(s.id) AS student_count
    FROM classes c
    LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id AND t.school_id = c.school_id
    LEFT JOIN students s ON c.id = s.class_id AND s.deleted_at IS NULL AND s.school_id = c.school_id
    WHERE c.deleted_at IS NULL AND c.school_id = ?
    GROUP BY c.id
    ORDER BY c.grade, c.class_name
");
$classes->execute([$school_id]);
$classes = $classes->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <?= ds_page_header('Data Kelas & Wali Kelas', 'Kelola rombongan belajar, tingkatan kelas, jurusan, dan penugasan wali kelas.', ds_button('<i class="fa-solid fa-plus"></i> <span>Tambah Kelas</span>', 'primary', 'button', ['onclick' => 'openClassModal()'])) ?>

        <?php if (!empty($error)): ?>
            <?= ds_alert(htmlspecialchars($error), 'danger') ?>
        <?php endif; ?>

        <!-- Classes Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <?php if (empty($classes)): ?>
                <div class="col-span-3 text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-500">
                    Belum ada kelas yang terdaftar.
                </div>
            <?php else: ?>
                <?php foreach ($classes as $c): ?>
                    <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between mb-3">
                                <?= ds_badge('Tingkat ' . htmlspecialchars($c['grade']), 'success') ?>
                                <span class="text-[11px] font-mono font-bold text-slate-500">
                                    <?= htmlspecialchars($c['class_code']) ?>
                                </span>
                            </div>

                            <h3 class="text-xl font-bold text-slate-800"><?= htmlspecialchars($c['class_name']) ?></h3>
                            <p class="text-xs text-slate-500 mt-0.5"><?= htmlspecialchars($c['major']) ?></p>

                            <div class="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                                <div class="flex items-center justify-between">
                                    <span class="text-slate-500">Wali Kelas:</span>
                                    <span class="font-bold text-slate-700 text-right truncate max-w-[150px]">
                                        <?= htmlspecialchars($c['homeroom_name'] ?: 'Belum Ditentukan') ?>
                                    </span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-slate-500">Jumlah Siswa:</span>
                                    <span class="font-bold text-emerald-700">
                                        <?= $c['student_count'] ?> Siswa
                                    </span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-slate-500">Tahun Ajaran:</span>
                                    <span class="font-mono text-slate-600">
                                        <?= htmlspecialchars($c['academic_year']) ?>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                            <a href="<?= $base_url ?>/admin/students.php?class_id=<?= $c['id'] ?>" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                                <span>Lihat Siswa</span>
                                <i class="fa-solid fa-arrow-right text-[10px]"></i>
                            </a>
                            <div class="flex items-center gap-1.5">
                                <?= ds_icon_button('fa-solid fa-pen-to-square', 'primary', 'button', [
                                    'onclick' => 'editClass(' . htmlspecialchars(json_encode($c), ENT_QUOTES) . ')',
                                    'title' => 'Edit',
                                    'aria-label' => 'Edit ' . htmlspecialchars($c['class_name'])
                                ]) ?>
                                <form method="POST" action="" onsubmit="return confirm('Hapus kelas ini?');" class="inline">
                                    <input type="hidden" name="action" value="delete_class">
                                    <input type="hidden" name="class_id" value="<?= $c['id'] ?>">
                                    <?= ds_icon_button('fa-solid fa-trash', 'danger', 'submit', [
                                        'title' => 'Hapus',
                                        'aria-label' => 'Hapus ' . htmlspecialchars($c['class_name'])
                                    ]) ?>
                                </form>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

    </div>
</main>

<!-- Modal Add / Edit Class -->
<?= ds_modal_start('modal-class', 'Tambah Kelas Baru') ?>

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="save_class">
            <input type="hidden" id="form-class-id" name="class_id" value="">

            <div class="grid grid-cols-2 gap-3">
                <?= ds_input('class_code', 'Kode Kelas', 'text', '', [
                    'id' => 'form-class-code',
                    'required' => true,
                    'placeholder' => 'Contoh: X-IPA-1',
                    'pattern' => '[A-Za-z0-9\-]+',
                    'help_text' => 'Huruf, angka, dan tanda hubung saja'
                ]) ?>
                <?= ds_select('grade', [
                    'X' => 'Kelas X (Sepuluh)',
                    'XI' => 'Kelas XI (Sebelas)',
                    'XII' => 'Kelas XII (Duabelas)'
                ], '', 'Tingkatan', [
                    'id' => 'form-class-grade'
                ]) ?>
            </div>

            <?= ds_input('class_name', 'Nama Kelas', 'text', '', [
                'id' => 'form-class-name',
                'required' => true,
                'placeholder' => 'Contoh: Kelas X - MIPA 1'
            ]) ?>

            <?= ds_input('major', 'Jurusan / Peminatan', 'text', '', [
                'id' => 'form-class-major',
                'required' => true,
                'placeholder' => 'Contoh: Matematika dan Ilmu Pengetahuan Alam'
            ]) ?>

            <?= ds_select('homeroom_teacher_id', array_merge(['' => '-- Pilih Guru Wali Kelas --'], array_combine(
                array_column($teachers, 'id'),
                array_map(fn($t) => $t['full_name'] . ' (' . $t['nip'] . ')', $teachers)
            )), '', 'Wali Kelas', [
                'id' => 'form-class-homeroom'
            ]) ?>

            <?= ds_input('academic_year', 'Tahun Ajaran', 'text', '2025/2026', [
                'id' => 'form-class-academic',
                'pattern' => '[0-9]{4}/[0-9]{4}',
                'help_text' => 'Format: YYYY/YYYY'
            ]) ?>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <?= ds_button('Batal', 'ghost', 'button', ['onclick' => "closeModal('modal-class')"]) ?>
                <?= ds_button('Simpan Kelas', 'primary', 'submit') ?>
            </div>
        </form>

<?= ds_modal_end() ?>

<script>
    function openClassModal() {
        document.getElementById('form-class-id').value = '';
        document.getElementById('form-class-code').value = '';
        document.getElementById('form-class-name').value = '';
        document.getElementById('form-class-major').value = '';
        document.getElementById('form-class-homeroom').value = '';
        openModal('modal-class');
    }

    function editClass(data) {
        document.getElementById('form-class-id').value = data.id;
        document.getElementById('form-class-code').value = data.class_code;
        document.getElementById('form-class-name').value = data.class_name;
        document.getElementById('form-class-grade').value = data.grade;
        document.getElementById('form-class-major').value = data.major;
        document.getElementById('form-class-homeroom').value = data.homeroom_teacher_id || '';
        document.getElementById('form-class-academic').value = data.academic_year || '2025/2026';
        openModal('modal-class');
    }
</script>

<?= ds_modal_js() ?>

<?php include __DIR__ . '/../includes/footer.php'; ?>
