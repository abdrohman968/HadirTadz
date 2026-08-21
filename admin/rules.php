<?php
$page_title = 'Aturan Absensi & Jam Kerja';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$base_url = get_base_url();
$school_id = auth_school_id();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'save_rule') {
        $rule_id = $_POST['rule_id'] ?? '';
        $rule_name = trim($_POST['rule_name'] ?? '');
        $role_code = $_POST['role_code'] ?? 'all';
        $check_in_start = $_POST['check_in_start'] ?? '06:00';
        $work_start_time = $_POST['work_start_time'] ?? '07:00';
        $late_threshold_time = $_POST['late_threshold_time'] ?? '07:15';
        $early_leave_threshold = $_POST['early_leave_threshold'] ?? '13:30';
        $check_out_start = $_POST['check_out_start'] ?? '14:00';
        $work_end_time = $_POST['work_end_time'] ?? '15:30';
        $radius_limit = (int)($_POST['radius_limit'] ?? 150);

        try {
            if ($rule_id) {
                $stmt = $pdo->prepare("
                    UPDATE attendance_rules 
                    SET rule_name = ?, role_code = ?, check_in_start = ?, work_start_time = ?, late_threshold_time = ?, early_leave_threshold = ?, check_out_start = ?, work_end_time = ?, radius_limit = ?, updated_at = NOW() 
                    WHERE id = ? AND school_id = ?
                ");
                $stmt->execute([$rule_name, $role_code, $check_in_start, $work_start_time, $late_threshold_time, $early_leave_threshold, $check_out_start, $work_end_time, $radius_limit, $rule_id, $school_id]);
                log_audit('UPDATE_RULE', 'attendance_rules', $rule_id, "Updated attendance rule $rule_name", $school_id);
                set_flash('success', 'Aturan absensi berhasil diperbarui!');
            } else {
                $rule_code = 'rule-' . time();
                $stmt = $pdo->prepare("
                    INSERT INTO attendance_rules (school_id, rule_code, rule_name, role_code, check_in_start, work_start_time, late_threshold_time, early_leave_threshold, check_out_start, work_end_time, radius_limit, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([$school_id, $rule_code, $rule_name, $role_code, $check_in_start, $work_start_time, $late_threshold_time, $early_leave_threshold, $check_out_start, $work_end_time, $radius_limit]);
                log_audit('CREATE_RULE', 'attendance_rules', $pdo->lastInsertId(), "Created attendance rule $rule_name", $school_id);
                set_flash('success', 'Aturan absensi baru berhasil ditambahkan!');
            }
            header("Location: rules.php");
            exit;
        } catch (Exception $e) {
            $error = 'Gagal menyimpan: ' . $e->getMessage();
        }
    }
}

$ruleListStmt = $pdo->prepare("SELECT * FROM attendance_rules WHERE school_id = ? ORDER BY id");
$ruleListStmt->execute([$school_id]);
$rules = $ruleListStmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-6xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Aturan Absensi & Jam Kerja</h1>
                <p class="text-xs sm:text-sm text-slate-500">Konfigurasi batas jam masuk, toleransi keterlambatan, jam pulang, dan radius geofencing GPS.</p>
            </div>
            <button onclick="openRuleModal()" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2">
                <i class="fa-solid fa-plus"></i>
                <span>Tambah Aturan</span>
            </button>
        </div>

        <?php if (!empty($error)): ?>
            <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- Rules Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <?php foreach ($rules as $r): ?>
                <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                Target: <?= htmlspecialchars($r['role_code']) ?>
                            </span>
                            <h3 class="text-lg font-bold text-slate-800 mt-1"><?= htmlspecialchars($r['rule_name']) ?></h3>
                        </div>
                        <button onclick="editRule(<?= htmlspecialchars(json_encode($r)) ?>)" class="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition" title="Edit">
                            <i class="fa-solid fa-pen-to-square text-sm"></i>
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-xs">
                        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <span class="text-slate-400 block font-medium">Buka Presensi Masuk</span>
                            <span class="font-mono font-bold text-slate-700 text-sm"><?= format_time($r['check_in_start']) ?> WIB</span>
                        </div>
                        <div class="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                            <span class="text-amber-600 block font-medium">Batas Terlambat</span>
                            <span class="font-mono font-bold text-amber-700 text-sm"><?= format_time($r['late_threshold_time']) ?> WIB</span>
                        </div>
                        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <span class="text-slate-400 block font-medium">Buka Presensi Pulang</span>
                            <span class="font-mono font-bold text-slate-700 text-sm"><?= format_time($r['check_out_start']) ?> WIB</span>
                        </div>
                        <div class="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                            <span class="text-emerald-600 block font-medium">Batas Radius GPS</span>
                            <span class="font-mono font-bold text-emerald-700 text-sm"><?= $r['radius_limit'] ?> Meter</span>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

    </div>
</main>

<!-- Modal Add/Edit Rule -->
<div id="modal-rule" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 id="modal-rule-title" class="text-base font-bold text-slate-800">Tambah Aturan Absensi</h3>
            <button onclick="closeModal('modal-rule')" class="text-slate-400 hover:text-slate-600 text-sm">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="save_rule">
            <input type="hidden" id="form-rule-id" name="rule_id" value="">

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Aturan</label>
                <input type="text" name="rule_name" id="form-rule-name" required placeholder="Contoh: Aturan Jam Masuk Siswa" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Berlaku Untuk</label>
                    <select name="role_code" id="form-rule-role" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="siswa">Khusus Siswa</option>
                        <option value="guru">Khusus Guru</option>
                        <option value="all">Semua Pengguna</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Radius GPS (Meter)</label>
                    <input type="number" name="radius_limit" id="form-rule-radius" required value="150" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Mulai Buka</label>
                    <input type="time" name="check_in_start" id="form-rule-in-start" value="06:00" class="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Jam Masuk</label>
                    <input type="time" name="work_start_time" id="form-rule-work-start" value="07:00" class="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Toleransi / Batas</label>
                    <input type="time" name="late_threshold_time" id="form-rule-late" value="07:15" class="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Mulai Pulang</label>
                    <input type="time" name="check_out_start" id="form-rule-out-start" value="14:00" class="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pulang Cepat</label>
                    <input type="time" name="early_leave_threshold" id="form-rule-early" value="13:30" class="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Selesai Jam Kerja</label>
                    <input type="time" name="work_end_time" id="form-rule-work-end" value="15:30" class="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onclick="closeModal('modal-rule')" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">
                    Batal
                </button>
                <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm">
                    Simpan Aturan
                </button>
            </div>
        </form>
    </div>
</div>

<script>
    function openRuleModal() {
        document.getElementById('form-rule-id').value = '';
        document.getElementById('form-rule-name').value = '';
        document.getElementById('modal-rule-title').textContent = 'Tambah Aturan Absensi';
        document.getElementById('modal-rule').classList.remove('hidden');
    }

    function editRule(data) {
        document.getElementById('form-rule-id').value = data.id;
        document.getElementById('form-rule-name').value = data.rule_name;
        document.getElementById('form-rule-role').value = data.role_code;
        document.getElementById('form-rule-radius').value = data.radius_limit;
        document.getElementById('form-rule-in-start').value = data.check_in_start.substring(0, 5);
        document.getElementById('form-rule-work-start').value = data.work_start_time.substring(0, 5);
        document.getElementById('form-rule-late').value = data.late_threshold_time.substring(0, 5);
        document.getElementById('form-rule-out-start').value = data.check_out_start.substring(0, 5);
        document.getElementById('form-rule-early').value = data.early_leave_threshold.substring(0, 5);
        document.getElementById('form-rule-work-end').value = data.work_end_time.substring(0, 5);
        document.getElementById('modal-rule-title').textContent = `Edit: ${data.rule_name}`;
        document.getElementById('modal-rule').classList.remove('hidden');
    }

    function closeModal(id) {
        document.getElementById(id).classList.add('hidden');
    }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
