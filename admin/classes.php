<?php
$page_title = 'Data Kelas';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$base_url = get_base_url();

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
                    WHERE id = ?
                ");
                $stmt->execute([$class_code, $class_name, $grade, $major, $teacher_id, $academic_year, $class_id]);
                log_audit('UPDATE_CLASS', 'classes', $class_id, "Updated class $class_name");
                set_flash('success', 'Data kelas berhasil diperbarui!');
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO classes (class_code, class_name, grade, major, homeroom_teacher_id, academic_year, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([$class_code, $class_name, $grade, $major, $teacher_id, $academic_year]);
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
            $stmt = $pdo->prepare("DELETE FROM classes WHERE id = ?");
            $stmt->execute([$del_id]);
            log_audit('DELETE_CLASS', 'classes', $del_id, "Deleted class");
            set_flash('success', 'Data kelas berhasil dihapus.');
            header("Location: classes.php");
            exit;
        }
    }
}

// Fetch Teachers for Homeroom assignment
$teachers = $pdo->query("SELECT * FROM teachers WHERE deleted_at IS NULL ORDER BY full_name")->fetchAll();

// Fetch Classes with Homeroom & Student count
$classes = $pdo->query("
    SELECT c.*, t.full_name AS homeroom_name, t.nip AS homeroom_nip,
           COUNT(s.id) AS student_count
    FROM classes c
    LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
    LEFT JOIN students s ON c.id = s.class_id AND s.deleted_at IS NULL
    WHERE c.deleted_at IS NULL
    GROUP BY c.id
    ORDER BY c.grade, c.class_name
")->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Data Kelas & Wali Kelas</h1>
                <p class="text-xs sm:text-sm text-slate-500">Kelola rombongan belajar, tingkatan kelas, jurusan, dan penugasan wali kelas.</p>
            </div>
            <button onclick="openClassModal()" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2">
                <i class="fa-solid fa-plus"></i>
                <span>Tambah Kelas</span>
            </button>
        </div>

        <?php if (!empty($error)): ?>
            <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- Classes Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <?php if (empty($classes)): ?>
                <div class="col-span-3 text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-400">
                    Belum ada kelas yang terdaftar.
                </div>
            <?php else: ?>
                <?php foreach ($classes as $c): ?>
                    <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between mb-3">
                                <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                    Tingkat <?= htmlspecialchars($c['grade']) ?>
                                </span>
                                <span class="text-[11px] font-mono font-bold text-slate-400">
                                    <?= htmlspecialchars($c['class_code']) ?>
                                </span>
                            </div>

                            <h3 class="text-xl font-bold text-slate-800"><?= htmlspecialchars($c['class_name']) ?></h3>
                            <p class="text-xs text-slate-500 mt-0.5"><?= htmlspecialchars($c['major']) ?></p>

                            <div class="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                                <div class="flex items-center justify-between">
                                    <span class="text-slate-400">Wali Kelas:</span>
                                    <span class="font-bold text-slate-700 text-right truncate max-w-[150px]">
                                        <?= htmlspecialchars($c['homeroom_name'] ?: 'Belum Ditentukan') ?>
                                    </span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-slate-400">Jumlah Siswa:</span>
                                    <span class="font-bold text-emerald-700">
                                        <?= $c['student_count'] ?> Siswa
                                    </span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-slate-400">Tahun Ajaran:</span>
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
                                <button onclick="editClass(<?= htmlspecialchars(json_encode($c)) ?>)" class="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition" title="Edit">
                                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                                </button>
                                <form method="POST" action="" onsubmit="return confirm('Hapus kelas ini?');" class="inline">
                                    <input type="hidden" name="action" value="delete_class">
                                    <input type="hidden" name="class_id" value="<?= $c['id'] ?>">
                                    <button type="submit" class="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition" title="Hapus">
                                        <i class="fa-solid fa-trash text-xs"></i>
                                    </button>
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
<div id="modal-class" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 id="modal-class-title" class="text-base font-bold text-slate-800">Tambah Kelas Baru</h3>
            <button onclick="closeModal('modal-class')" class="text-slate-400 hover:text-slate-600 text-sm">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="save_class">
            <input type="hidden" id="form-class-id" name="class_id" value="">

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Kode Kelas</label>
                    <input type="text" name="class_code" id="form-class-code" required placeholder="Contoh: X-IPA-1" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Tingkatan</label>
                    <select name="grade" id="form-class-grade" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="X">Kelas X (Sepuluh)</option>
                        <option value="XI">Kelas XI (Sebelas)</option>
                        <option value="XII">Kelas XII (Duabelas)</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Kelas</label>
                <input type="text" name="class_name" id="form-class-name" required placeholder="Contoh: Kelas X - MIPA 1" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Jurusan / Peminatan</label>
                <input type="text" name="major" id="form-class-major" required placeholder="Contoh: Matematika dan Ilmu Pengetahuan Alam" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Wali Kelas</label>
                <select name="homeroom_teacher_id" id="form-class-homeroom" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    <option value="">-- Pilih Guru Wali Kelas --</option>
                    <?php foreach ($teachers as $t): ?>
                        <option value="<?= $t['id'] ?>">
                            <?= htmlspecialchars($t['full_name']) ?> (<?= htmlspecialchars($t['nip']) ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Tahun Ajaran</label>
                <input type="text" name="academic_year" id="form-class-academic" value="2025/2026" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onclick="closeModal('modal-class')" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">
                    Batal
                </button>
                <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm">
                    Simpan Kelas
                </button>
            </div>
        </form>
    </div>
</div>

<script>
    function openClassModal() {
        document.getElementById('form-class-id').value = '';
        document.getElementById('form-class-code').value = '';
        document.getElementById('form-class-name').value = '';
        document.getElementById('form-class-major').value = '';
        document.getElementById('form-class-homeroom').value = '';
        document.getElementById('modal-class-title').textContent = 'Tambah Kelas Baru';
        document.getElementById('modal-class').classList.remove('hidden');
    }

    function editClass(data) {
        document.getElementById('form-class-id').value = data.id;
        document.getElementById('form-class-code').value = data.class_code;
        document.getElementById('form-class-name').value = data.class_name;
        document.getElementById('form-class-grade').value = data.grade;
        document.getElementById('form-class-major').value = data.major;
        document.getElementById('form-class-homeroom').value = data.homeroom_teacher_id || '';
        document.getElementById('form-class-academic').value = data.academic_year || '2025/2026';
        document.getElementById('modal-class-title').textContent = `Edit Kelas: ${data.class_name}`;
        document.getElementById('modal-class').classList.remove('hidden');
    }

    function closeModal(id) {
        document.getElementById(id).classList.add('hidden');
    }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
