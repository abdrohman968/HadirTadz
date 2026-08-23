<?php
$page_title = 'Presensi Siswa di Kelas';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['guru', 'admin']);
$school_id = auth_school_id();

$filter_class = $_GET['class_id'] ?? '';
$filter_date = $_GET['date'] ?? date('Y-m-d');
$error = '';

// Handle Batch Save Attendance
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_class_attendance'])) {
    $class_id = $_POST['class_id'] ?? '';
    $date = $_POST['date'] ?? date('Y-m-d');
    $statuses = $_POST['status'] ?? []; // student_user_id => status

    if (!empty($class_id) && !empty($statuses)) {
        try {
            $pdo->beginTransaction();

            foreach ($statuses as $student_user_id => $st) {
                $userIdentifierStmt = $pdo->prepare("SELECT identifier FROM users WHERE id = ?");
                $userIdentifierStmt->execute([$student_user_id]);
                $identifier = $userIdentifierStmt->fetchColumn();

                $recorded_time = date('H:i:s');
                $ins = $pdo->prepare("
                    INSERT INTO attendance (school_id, user_id, class_id, date, time_in, status, method, identifier, is_within_radius, notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'manual', ?, 1, 'Presensi oleh Guru di Kelas', NOW(), NOW())
                    ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()
                ");
                $ins->execute([$school_id, $student_user_id, $class_id, $date, $recorded_time, $st, $identifier]);
            }

            $pdo->commit();
            log_audit('CLASS_ATTENDANCE', 'classes', $class_id, "Recorded class attendance for $date", $school_id);
            set_flash('success', 'Presensi seluruh siswa kelas berhasil disimpan!');
            header("Location: kelas.php?class_id=$class_id&date=$date");
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            $error = 'Gagal menyimpan presensi kelas: ' . $e->getMessage();
        }
    }
}

// Fetch all classes for this school
$classes = $pdo->prepare("SELECT * FROM classes WHERE school_id = ? ORDER BY grade, class_name");
$classes->execute([$school_id]);
$classes = $classes->fetchAll();
if (empty($filter_class) && !empty($classes)) {
    $filter_class = $classes[0]['id'];
}

// Fetch Students in selected class along with their attendance today
$students = [];
if (!empty($filter_class)) {
    $stmt = $pdo->prepare("
        SELECT s.*, u.identifier,
               a.id AS attendance_id, a.status AS attendance_status, a.time_in, a.time_out
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN attendance a ON s.user_id = a.user_id AND a.date = ?
        WHERE s.class_id = ? AND s.school_id = ? AND s.deleted_at IS NULL
        ORDER BY s.full_name
    ");
    $stmt->execute([$filter_date, $filter_class, $school_id]);
    $students = $stmt->fetchAll();
}

// Build class options for ds_select
$class_options = ['' => '-- Pilih Kelas --'];
foreach ($classes as $c) {
    $class_options[$c['id']] = $c['class_name'] . ' (' . $c['major'] . ')';
}

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-6xl mx-auto space-y-6">

        <?= ds_page_header('Presensi Siswa di Kelas', 'Catat dan perbarui absensi kehadiran seluruh siswa dalam satu kelas per pertemuan.', '<a href="' . $base_url . '/guru/jurnal.php" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2"><i class="fa-solid fa-book-bookmark"></i><span>Tulis Jurnal Pembelajaran</span></a>') ?>

        <?php if (!empty($error)): ?>
            <?= ds_alert(htmlspecialchars($error), 'danger') ?>
        <?php endif; ?>

        <!-- Class Selector & Date -->
        <?= ds_card_start('', '') ?>
            <form method="GET" action="" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <?= ds_select('class_id', $class_options, $filter_class, 'Pilih Kelas', ['required' => true, 'id' => 'field-kelas-class']) ?>

                <?= ds_input('date', 'Tanggal Absensi', 'date', $filter_date, ['required' => true, 'id' => 'field-kelas-date']) ?>

                <div>
                    <?= ds_button('Buka Daftar Siswa', 'primary', 'submit') ?>
                </div>
            </form>
        <?= ds_card_end() ?>

        <!-- Student Attendance Form -->
        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="save_class_attendance" value="1">
            <input type="hidden" name="class_id" value="<?= htmlspecialchars($filter_class) ?>">
            <input type="hidden" name="date" value="<?= htmlspecialchars($filter_date) ?>">

            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
                    <div>
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Total Siswa: <strong class="text-slate-800 font-extrabold"><?= count($students) ?></strong> Orang
                        </span>
                        <p class="text-[11px] text-slate-500">Pilih status kehadiran untuk setiap siswa di bawah</p>
                    </div>

                    <!-- Quick Batch Action -->
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="setAllStatus('HADIR')" class="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition">
                            <i class="fa-solid fa-check-double mr-1"></i> Semua Hadir
                        </button>
                    </div>
                </div>

                <div class="table-responsive-card">
                    <table class="w-full text-left text-xs text-slate-600">
                        <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                            <tr>
                                <th class="py-3 px-4 w-12 text-center">No</th>
                                <th class="py-3 px-4">Nama Lengkap Siswa</th>
                                <th class="py-3 px-4">NISN</th>
                                <th class="py-3 px-4 text-center">Pilihan Status Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <?php if (empty($students)): ?>
                                <tr>
                                    <td colspan="4" class="text-center py-10 text-slate-500">
                                        Tidak ada data siswa dalam kelas ini.
                                    </td>
                                </tr>
                            <?php else: ?>
                                <?php $no = 1; foreach ($students as $s): 
                                    $current_st = $s['attendance_status'] ?? '';
                                ?>
                                    <tr class="hover:bg-slate-50/80 transition">
                                        <td class="py-3.5 px-4 text-center font-mono text-slate-500" data-label="No"><?= $no++ ?></td>
                                        <td class="py-3.5 px-4" data-label="Nama">
                                            <div class="font-bold text-slate-800 text-sm"><?= htmlspecialchars($s['full_name']) ?></div>
                                            <div class="text-[10px] text-slate-500"><?= ($s['gender'] === 'L') ? 'Laki-laki' : 'Perempuan' ?></div>
                                        </td>
                                        <td class="py-3.5 px-4 font-mono font-bold text-slate-700" data-label="NISN">
                                            <?= htmlspecialchars($s['nisn']) ?>
                                        </td>
                                        <td class="py-3.5 px-4" data-label="Status">
                                            <!-- Radio Status Buttons Grid (wrap di layar kecil) -->
                                            <div class="flex flex-wrap items-center justify-start gap-1.5 sm:justify-center sm:gap-2 <?= empty($current_st) ? 'ring-1 ring-amber-300 rounded-xl p-1 bg-amber-50/50' : '' ?>">
                                                <label class="cursor-pointer">
                                                    <input type="radio" name="status[<?= $s['user_id'] ?>]" value="HADIR" <?= ($current_st === 'HADIR') ? 'checked' : '' ?> class="peer sr-only status-radio" data-status="HADIR">
                                                    <span class="px-3 py-1.5 rounded-xl border text-xs font-bold transition peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 bg-slate-50 text-slate-600 border-slate-200">
                                                        Hadir
                                                    </span>
                                                </label>
                                                <label class="cursor-pointer">
                                                    <input type="radio" name="status[<?= $s['user_id'] ?>]" value="TERLAMBAT" <?= ($current_st === 'TERLAMBAT') ? 'checked' : '' ?> class="peer sr-only status-radio" data-status="TERLAMBAT">
                                                    <span class="px-3 py-1.5 rounded-xl border text-xs font-bold transition peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-500 bg-slate-50 text-slate-600 border-slate-200">
                                                        Terlambat
                                                    </span>
                                                </label>
                                                <label class="cursor-pointer">
                                                    <input type="radio" name="status[<?= $s['user_id'] ?>]" value="IZIN" <?= ($current_st === 'IZIN') ? 'checked' : '' ?> class="peer sr-only status-radio" data-status="IZIN">
                                                    <span class="px-3 py-1.5 rounded-xl border text-xs font-bold transition peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 bg-slate-50 text-slate-600 border-slate-200">
                                                        Izin
                                                    </span>
                                                </label>
                                                <label class="cursor-pointer">
                                                    <input type="radio" name="status[<?= $s['user_id'] ?>]" value="SAKIT" <?= ($current_st === 'SAKIT') ? 'checked' : '' ?> class="peer sr-only status-radio" data-status="SAKIT">
                                                    <span class="px-3 py-1.5 rounded-xl border text-xs font-bold transition peer-checked:bg-purple-600 peer-checked:text-white peer-checked:border-purple-600 bg-slate-50 text-slate-600 border-slate-200">
                                                        Sakit
                                                    </span>
                                                </label>
                                                <label class="cursor-pointer">
                                                    <input type="radio" name="status[<?= $s['user_id'] ?>]" value="ALPHA" <?= ($current_st === 'ALPHA') ? 'checked' : '' ?> class="peer sr-only status-radio" data-status="ALPHA">
                                                    <span class="px-3 py-1.5 rounded-xl border text-xs font-bold transition peer-checked:bg-rose-600 peer-checked:text-white peer-checked:border-rose-600 bg-slate-50 text-slate-600 border-slate-200">
                                                        Alpha
                                                    </span>
                                                </label>
                                            </div>
                                            <?php if (empty($current_st)): ?>
                                                <p class="text-[10px] text-amber-600 mt-1 font-semibold">Belum diisi</p>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <?php if (!empty($students)): ?>
                    <div class="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <?= ds_button('<i class="fa-solid fa-floppy-disk"></i> Simpan Presensi Kelas', 'primary', 'submit') ?>
                    </div>
                <?php endif; ?>
            </div>
        </form>

    </div>
</main>

<script>
    function setAllStatus(status) {
        const radios = document.querySelectorAll(`.status-radio[data-status="${status}"]`);
        radios.forEach(r => r.checked = true);
        showToast("Seluruh siswa telah diatur ke status: " + status, "info");
    }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
