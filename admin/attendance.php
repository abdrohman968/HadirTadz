<?php
$page_title = 'Presensi Harian';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$school_id = auth_school_id();

// Filter parameters
$filter_date = $_GET['date'] ?? date('Y-m-d');
$filter_class = $_GET['class_id'] ?? '';
$filter_status = $_GET['status'] ?? '';
$search = trim($_GET['search'] ?? '');

// Handle Action Add/Edit/Delete Attendance
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'save_attendance') {
        $att_id = $_POST['attendance_id'] ?? '';
        $user_id = $_POST['user_id'] ?? '';
        $date = $_POST['date'] ?? date('Y-m-d');
        $time_in = $_POST['time_in'] ?: null;
        $time_out = $_POST['time_out'] ?: null;
        $status = $_POST['status'] ?? 'HADIR';
        $notes = trim($_POST['notes'] ?? '');

        try {
            // Get class_id if student
            $clsStmt = $pdo->prepare("SELECT class_id FROM students WHERE user_id = ? AND school_id = ?");
            $clsStmt->execute([$user_id, $school_id]);
            $class_id = $clsStmt->fetchColumn() ?: null;

            if ($att_id) {
                // Update
                $stmt = $pdo->prepare("
                    UPDATE attendance 
                    SET time_in = ?, time_out = ?, status = ?, notes = ?, updated_at = NOW() 
                    WHERE id = ? AND school_id = ?
                ");
                $stmt->execute([$time_in, $time_out, $status, $notes, $att_id, $school_id]);
                log_audit('UPDATE_ATTENDANCE', 'attendance', $att_id, "Status changed to $status", $school_id);
                set_flash('success', 'Data presensi berhasil diperbarui!');
            } else {
                // Insert
                $stmt = $pdo->prepare("
                    INSERT INTO attendance (school_id, user_id, class_id, date, time_in, time_out, status, method, identifier, is_within_radius, notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', (SELECT identifier FROM users WHERE id = ?), 1, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE time_in = VALUES(time_in), time_out = VALUES(time_out), status = VALUES(status), notes = VALUES(notes), updated_at = NOW()
                ");
                $stmt->execute([$school_id, $user_id, $class_id, $date, $time_in, $time_out, $status, $user_id, $notes]);
                log_audit('CREATE_ATTENDANCE', 'attendance', $pdo->lastInsertId(), "Manual attendance added for user $user_id", $school_id);
                set_flash('success', 'Presensi berhasil disimpan!');
            }
            header("Location: attendance.php?date=$date");
            exit;
        } catch (Exception $e) {
            $error = 'Gagal menyimpan: ' . $e->getMessage();
        }
    } elseif ($action === 'delete_attendance') {
        $del_id = $_POST['attendance_id'] ?? '';
        if ($del_id) {
            $stmt = $pdo->prepare("DELETE FROM attendance WHERE id = ? AND school_id = ?");
            $stmt->execute([$del_id, $school_id]);
            log_audit('DELETE_ATTENDANCE', 'attendance', $del_id, "Attendance record deleted");
            set_flash('success', 'Data presensi berhasil dihapus.');
            header("Location: attendance.php?date=$filter_date");
            exit;
        }
    }
}

// Fetch Classes for filter
$classesStmt = $pdo->prepare("SELECT * FROM classes WHERE school_id = ? ORDER BY grade, class_name");
$classesStmt->execute([$school_id]);
$classes = $classesStmt->fetchAll();

// Fetch Users for manual entry modal dropdown
$users_list = $pdo->prepare("
    SELECT u.id, u.identifier, u.full_name, r.role_name, c.class_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE u.school_id = ? AND u.status = 'active' AND u.deleted_at IS NULL
    ORDER BY r.id, u.full_name
");
$users_list->execute([$school_id]);
$users_list = $users_list->fetchAll();

// Build Query
$sql = "
    SELECT a.*, u.full_name, u.identifier, u.avatar_url, r.role_name, r.role_code, c.class_name
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE a.date = :date AND a.school_id = :school_id
";
$params = [':date' => $filter_date, ':school_id' => $school_id];

if (!empty($filter_class)) {
    $sql .= " AND a.class_id = :class_id";
    $params[':class_id'] = $filter_class;
}

if (!empty($filter_status)) {
    $sql .= " AND a.status = :status";
    $params[':status'] = $filter_status;
}

if (!empty($search)) {
    $sql .= " AND (u.full_name LIKE :s OR u.identifier LIKE :s)";
    $params[':s'] = "%$search%";
}

$sql .= " ORDER BY a.updated_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$attendance_list = $stmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <?= ds_page_header('Presensi Harian', 'Monitor dan kelola kehadiran siswa serta guru secara realtime.', ds_button('<i class="fa-solid fa-plus"></i> <span>Tambah Presensi Manual</span>', 'primary', 'button', ['onclick' => "openModal('modal-attendance')"]) . '<a href="' . $base_url . '/admin/reports.php?date=' . urlencode($filter_date) . '" class="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition flex items-center gap-2"><i class="fa-solid fa-file-export text-slate-400"></i><span>Ekspor</span></a>') ?>

        <?php if (!empty($error)): ?>
            <?= ds_alert(htmlspecialchars($error), 'danger') ?>
        <?php endif; ?>

        <!-- Filters Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <form method="GET" action="" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <?= ds_input('Tanggal', 'date', [
                    'name' => 'date',
                    'value' => $filter_date
                ]) ?>

                <?= ds_select('Kelas', array_merge(['' => '-- Semua Kelas --'], array_combine(
                    array_column($classes, 'id'),
                    array_column($classes, 'class_name')
                )), $filter_class, '', ['name' => 'class_id']) ?>

                <?= ds_select('Status', [
                    '' => '-- Semua Status --',
                    'HADIR' => 'HADIR',
                    'TERLAMBAT' => 'TERLAMBAT',
                    'IZIN' => 'IZIN',
                    'SAKIT' => 'SAKIT',
                    'ALPHA' => 'ALPHA'
                ], $filter_status, '', ['name' => 'status']) ?>

                <?= ds_input('Cari Nama / ID', 'text', [
                    'name' => 'search',
                    'value' => $search,
                    'placeholder' => 'Ketik nama atau NISN...'
                ]) ?>

                <div class="flex gap-2">
                    <?= ds_button('Filter', 'secondary', 'submit', ['class' => 'flex-1']) ?>
                    <a href="attendance.php" class="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition" title="Reset Filter">
                        <i class="fa-solid fa-rotate-left"></i>
                    </a>
                </div>
            </form>
        </div>

        <!-- Attendance Data Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total: <strong class="text-slate-800 font-extrabold"><?= count($attendance_list) ?></strong> Rekaman Presensi (<?= format_date_indo($filter_date) ?>)
                </span>
            </div>

            <div class="table-responsive-card">
                <table class="w-full text-left text-xs text-slate-600">
                    <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                        <tr>
                            <th class="py-3 px-4">Nama Pengguna</th>
                            <th class="py-3 px-4">Role & Kelas</th>
                            <th class="py-3 px-4">Masuk</th>
                            <th class="py-3 px-4">Pulang</th>
                            <th class="py-3 px-4">Status</th>
                            <th class="py-3 px-4">Metode</th>
                            <th class="py-3 px-4">Keterangan</th>
                            <th class="py-3 px-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php if (empty($attendance_list)): ?>
                            <tr>
                                <td colspan="8" class="text-center py-10 text-slate-500" data-label="">
                                    Tidak ada data presensi yang sesuai dengan filter.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($attendance_list as $item): ?>
                                <tr class="hover:bg-slate-50/80 transition">
                                    <td class="py-3 px-4" data-label="Nama Pengguna">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                                                <?= strtoupper(substr($item['full_name'], 0, 1)) ?>
                                            </div>
                                            <div>
                                                <div class="font-bold text-slate-800"><?= htmlspecialchars($item['full_name']) ?></div>
                                                <div class="font-mono text-[10px] text-slate-500"><?= htmlspecialchars($item['identifier']) ?></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4" data-label="Role & Kelas">
                                        <span class="font-medium text-slate-700"><?= htmlspecialchars($item['class_name'] ?? '-') ?></span>
                                        <span class="block text-[10px] text-slate-500 capitalize"><?= htmlspecialchars($item['role_name']) ?></span>
                                    </td>
                                    <td class="py-3 px-4 font-mono font-semibold text-emerald-700" data-label="Masuk">
                                        <?= format_time($item['time_in']) ?>
                                    </td>
                                    <td class="py-3 px-4 font-mono font-semibold text-slate-700" data-label="Pulang">
                                        <?= format_time($item['time_out']) ?>
                                    </td>
                                    <td class="py-3 px-4" data-label="Status">
                                        <?= status_badge($item['status']) ?>
                                    </td>
                                    <td class="py-3 px-4" data-label="Metode">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                            <?= htmlspecialchars($item['method']) ?>
                                        </span>
                                    </td>
                                    <td class="py-3 px-4 text-slate-500 max-w-xs truncate" data-label="Keterangan">
                                        <?= htmlspecialchars($item['notes'] ?: '-') ?>
                                    </td>
                                    <td class="py-3 px-4 text-center" data-label="Aksi">
                                        <div class="flex items-center justify-center gap-1.5">
                                            <?= ds_icon_button('fa-solid fa-pen-to-square', 'primary', 'button', [
                                                'onclick' => 'editAttendance(' . htmlspecialchars(json_encode($item), ENT_QUOTES) . ')',
                                                'title' => 'Edit Presensi',
                                                'aria-label' => 'Edit presensi ' . htmlspecialchars($item['full_name'])
                                            ]) ?>
                                            <form method="POST" action="" onsubmit="return confirm('Hapus rekaman presensi ini?');" class="inline">
                                                <input type="hidden" name="action" value="delete_attendance">
                                                <input type="hidden" name="attendance_id" value="<?= $item['id'] ?>">
                                                <?= ds_icon_button('fa-solid fa-trash', 'danger', 'submit', [
                                                    'title' => 'Hapus',
                                                    'aria-label' => 'Hapus presensi ' . htmlspecialchars($item['full_name'])
                                                ]) ?>
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

<!-- Modal Add / Edit Attendance -->
<?= ds_modal_start('modal-attendance', 'Tambah Presensi Manual') ?>

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="save_attendance">
            <input type="hidden" id="form-attendance-id" name="attendance_id" value="">

            <div id="user-select-container">
                <?= ds_select('Siswa / Guru', array_merge(['' => '-- Pilih Pengguna --'], array_combine(
                    array_column($users_list, 'id'),
                    array_map(fn($u) => $u['full_name'] . ' (' . $u['identifier'] . ' - ' . ($u['class_name'] ?? $u['role_name']) . ')', $users_list)
                )), '', 'Pilih Siswa / Guru', [
                    'name' => 'user_id',
                    'id' => 'form-user-id',
                    'required' => true
                ]) ?>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <?= ds_input('Tanggal', 'date', [
                    'name' => 'date',
                    'id' => 'form-date',
                    'value' => $filter_date,
                    'required' => true
                ]) ?>
                <?= ds_select('Status Kehadiran', [
                    'HADIR' => 'HADIR',
                    'TERLAMBAT' => 'TERLAMBAT',
                    'IZIN' => 'IZIN',
                    'SAKIT' => 'SAKIT',
                    'ALPHA' => 'ALPHA'
                ], 'HADIR', '', [
                    'name' => 'status',
                    'id' => 'form-status',
                    'required' => true
                ]) ?>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <?= ds_input('Jam Masuk (HH:mm)', 'time', [
                    'name' => 'time_in',
                    'id' => 'form-time-in',
                    'value' => '07:00'
                ]) ?>
                <?= ds_input('Jam Pulang (HH:mm)', 'time', [
                    'name' => 'time_out',
                    'id' => 'form-time-out'
                ]) ?>
            </div>

            <?= ds_textarea('Catatan / Keterangan', [
                'name' => 'notes',
                'id' => 'form-notes',
                'rows' => 2,
                'placeholder' => 'Contoh: Lupa bawa kartu / presensi manual'
            ]) ?>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <?= ds_button('Batal', 'ghost', 'button', ['onclick' => "closeModal('modal-attendance')"]) ?>
                <?= ds_button('Simpan Presensi', 'primary', 'submit') ?>
            </div>
        </form>

<?= ds_modal_end() ?>

<script>
    function editAttendance(data) {
        document.getElementById('form-attendance-id').value = data.id;
        document.getElementById('form-user-id').value = data.user_id;
        document.getElementById('form-date').value = data.date;
        document.getElementById('form-status').value = data.status;
        document.getElementById('form-time-in').value = data.time_in ? data.time_in.substring(0, 5) : '';
        document.getElementById('form-time-out').value = data.time_out ? data.time_out.substring(0, 5) : '';
        document.getElementById('form-notes').value = data.notes || '';
        document.getElementById('user-select-container').style.display = 'block';
        openModal('modal-attendance');
    }

    const _origCloseModal = window.closeModal;
    window.closeModal = function(id) {
        _origCloseModal(id);
        if (id === 'modal-attendance') {
            document.getElementById('form-attendance-id').value = '';
            document.getElementById('form-user-id').value = '';
            document.getElementById('form-date').value = '<?= htmlspecialchars($filter_date) ?>';
            document.getElementById('form-status').value = 'HADIR';
            document.getElementById('form-time-in').value = '07:00';
            document.getElementById('form-time-out').value = '';
            document.getElementById('form-notes').value = '';
            document.getElementById('user-select-container').style.display = 'block';
        }
    };
</script>

<?= ds_modal_js() ?>

<?php include __DIR__ . '/../includes/footer.php'; ?>
