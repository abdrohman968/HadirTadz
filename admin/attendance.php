<?php
$page_title = 'Presensi Harian';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$base_url = get_base_url();

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
            $clsStmt = $pdo->prepare("SELECT class_id FROM students WHERE user_id = ?");
            $clsStmt->execute([$user_id]);
            $class_id = $clsStmt->fetchColumn() ?: null;

            if ($att_id) {
                // Update
                $stmt = $pdo->prepare("
                    UPDATE attendance 
                    SET time_in = ?, time_out = ?, status = ?, notes = ?, updated_at = NOW() 
                    WHERE id = ?
                ");
                $stmt->execute([$time_in, $time_out, $status, $notes, $att_id]);
                log_audit('UPDATE_ATTENDANCE', 'attendance', $att_id, "Status changed to $status");
                set_flash('success', 'Data presensi berhasil diperbarui!');
            } else {
                // Insert
                $stmt = $pdo->prepare("
                    INSERT INTO attendance (user_id, class_id, date, time_in, time_out, status, method, identifier, is_within_radius, notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'manual', (SELECT identifier FROM users WHERE id = ?), 1, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE time_in = VALUES(time_in), time_out = VALUES(time_out), status = VALUES(status), notes = VALUES(notes), updated_at = NOW()
                ");
                $stmt->execute([$user_id, $class_id, $date, $time_in, $time_out, $status, $user_id, $notes]);
                log_audit('CREATE_ATTENDANCE', 'attendance', $pdo->lastInsertId(), "Manual attendance added for user $user_id");
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
            $stmt = $pdo->prepare("DELETE FROM attendance WHERE id = ?");
            $stmt->execute([$del_id]);
            log_audit('DELETE_ATTENDANCE', 'attendance', $del_id, "Attendance record deleted");
            set_flash('success', 'Data presensi berhasil dihapus.');
            header("Location: attendance.php?date=$filter_date");
            exit;
        }
    }
}

// Fetch Classes for filter
$classes = $pdo->query("SELECT * FROM classes ORDER BY grade, class_name")->fetchAll();

// Fetch Users for manual entry modal dropdown
$users_list = $pdo->query("
    SELECT u.id, u.identifier, u.full_name, r.role_name, c.class_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE u.status = 'active' AND u.deleted_at IS NULL
    ORDER BY r.id, u.full_name
")->fetchAll();

// Build Query
$sql = "
    SELECT a.*, u.full_name, u.identifier, u.avatar_url, r.role_name, r.role_code, c.class_name
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE a.date = :date
";
$params = [':date' => $filter_date];

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

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Presensi Harian</h1>
                <p class="text-xs sm:text-sm text-slate-500">Monitor dan kelola kehadiran siswa serta guru secara realtime.</p>
            </div>
            <div class="flex items-center gap-2.5">
                <button onclick="openModal('modal-attendance')" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i>
                    <span>Tambah Presensi Manual</span>
                </button>
                <a href="<?= $base_url ?>/admin/reports.php?date=<?= urlencode($filter_date) ?>" class="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition flex items-center gap-2">
                    <i class="fa-solid fa-file-export text-slate-400"></i>
                    <span>Ekspor</span>
                </a>
            </div>
        </div>

        <?php if (!empty($error)): ?>
            <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- Filters Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <form method="GET" action="" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tanggal</label>
                    <input type="date" name="date" value="<?= htmlspecialchars($filter_date) ?>" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>

                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kelas</label>
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
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select name="status" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="">-- Semua Status --</option>
                        <option value="HADIR" <?= ($filter_status === 'HADIR') ? 'selected' : '' ?>>HADIR</option>
                        <option value="TERLAMBAT" <?= ($filter_status === 'TERLAMBAT') ? 'selected' : '' ?>>TERLAMBAT</option>
                        <option value="IZIN" <?= ($filter_status === 'IZIN') ? 'selected' : '' ?>>IZIN</option>
                        <option value="SAKIT" <?= ($filter_status === 'SAKIT') ? 'selected' : '' ?>>SAKIT</option>
                        <option value="ALPHA" <?= ($filter_status === 'ALPHA') ? 'selected' : '' ?>>ALPHA</option>
                    </select>
                </div>

                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cari Nama / ID</label>
                    <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Ketik nama atau NISN..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>

                <div class="flex gap-2">
                    <button type="submit" class="flex-1 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition">
                        Filter
                    </button>
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

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-600">
                    <thead class="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
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
                                <td colspan="8" class="text-center py-10 text-slate-400">
                                    Tidak ada data presensi yang sesuai dengan filter.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($attendance_list as $item): ?>
                                <tr class="hover:bg-slate-50/80 transition">
                                    <td class="py-3 px-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                                                <?= strtoupper(substr($item['full_name'], 0, 1)) ?>
                                            </div>
                                            <div>
                                                <div class="font-bold text-slate-800"><?= htmlspecialchars($item['full_name']) ?></div>
                                                <div class="font-mono text-[10px] text-slate-400"><?= htmlspecialchars($item['identifier']) ?></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4">
                                        <span class="font-medium text-slate-700"><?= htmlspecialchars($item['class_name'] ?? '-') ?></span>
                                        <span class="block text-[10px] text-slate-400 capitalize"><?= htmlspecialchars($item['role_name']) ?></span>
                                    </td>
                                    <td class="py-3 px-4 font-mono font-semibold text-emerald-700">
                                        <?= format_time($item['time_in']) ?>
                                    </td>
                                    <td class="py-3 px-4 font-mono font-semibold text-slate-700">
                                        <?= format_time($item['time_out']) ?>
                                    </td>
                                    <td class="py-3 px-4">
                                        <?= status_badge($item['status']) ?>
                                    </td>
                                    <td class="py-3 px-4">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                            <?= htmlspecialchars($item['method']) ?>
                                        </span>
                                    </td>
                                    <td class="py-3 px-4 text-slate-500 max-w-xs truncate">
                                        <?= htmlspecialchars($item['notes'] ?: '-') ?>
                                    </td>
                                    <td class="py-3 px-4 text-center">
                                        <div class="flex items-center justify-center gap-1.5">
                                            <button type="button" onclick="editAttendance(<?= htmlspecialchars(json_encode($item)) ?>)" class="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition" title="Edit Presensi">
                                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                                            </button>
                                            <form method="POST" action="" onsubmit="return confirm('Hapus rekaman presensi ini?');" class="inline">
                                                <input type="hidden" name="action" value="delete_attendance">
                                                <input type="hidden" name="attendance_id" value="<?= $item['id'] ?>">
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

<!-- Modal Add / Edit Attendance -->
<div id="modal-attendance" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 id="modal-title" class="text-base font-bold text-slate-800">Tambah Presensi Manual</h3>
            <button onclick="closeModal('modal-attendance')" class="text-slate-400 hover:text-slate-600 text-sm">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="save_attendance">
            <input type="hidden" id="form-attendance-id" name="attendance_id" value="">

            <div id="user-select-container">
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Pilih Siswa / Guru</label>
                <select name="user_id" id="form-user-id" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    <option value="">-- Pilih Pengguna --</option>
                    <?php foreach ($users_list as $u): ?>
                        <option value="<?= $u['id'] ?>">
                            <?= htmlspecialchars($u['full_name']) ?> (<?= htmlspecialchars($u['identifier']) ?> - <?= htmlspecialchars($u['class_name'] ?? $u['role_name']) ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Tanggal</label>
                    <input type="date" name="date" id="form-date" value="<?= htmlspecialchars($filter_date) ?>" required class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Status Kehadiran</label>
                    <select name="status" id="form-status" required class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="HADIR">HADIR</option>
                        <option value="TERLAMBAT">TERLAMBAT</option>
                        <option value="IZIN">IZIN</option>
                        <option value="SAKIT">SAKIT</option>
                        <option value="ALPHA">ALPHA</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Jam Masuk (HH:mm)</label>
                    <input type="time" name="time_in" id="form-time-in" value="07:00" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Jam Pulang (HH:mm)</label>
                    <input type="time" name="time_out" id="form-time-out" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Catatan / Keterangan</label>
                <textarea name="notes" id="form-notes" rows="2" placeholder="Contoh: Lupa bawa kartu / presensi manual" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onclick="closeModal('modal-attendance')" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">
                    Batal
                </button>
                <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm">
                    Simpan Presensi
                </button>
            </div>
        </form>
    </div>
</div>

<script>
    function openModal(id) {
        document.getElementById(id).classList.remove('hidden');
    }

    function closeModal(id) {
        document.getElementById(id).classList.add('hidden');
        // Reset form
        document.getElementById('form-attendance-id').value = '';
        document.getElementById('modal-title').textContent = 'Tambah Presensi Manual';
        document.getElementById('user-select-container').style.display = 'block';
    }

    function editAttendance(data) {
        document.getElementById('form-attendance-id').value = data.id;
        document.getElementById('form-user-id').value = data.user_id;
        document.getElementById('form-date').value = data.date;
        document.getElementById('form-status').value = data.status;
        document.getElementById('form-time-in').value = data.time_in ? data.time_in.substring(0, 5) : '';
        document.getElementById('form-time-out').value = data.time_out ? data.time_out.substring(0, 5) : '';
        document.getElementById('form-notes').value = data.notes || '';
        document.getElementById('modal-title').textContent = `Edit Presensi: ${data.full_name}`;
        openModal('modal-attendance');
    }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
