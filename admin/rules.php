<?php
$page_title = 'Aturan Absensi & Jam Kerja';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
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

        <?= ds_page_header('Aturan Absensi & Jam Kerja', 'Konfigurasi batas jam masuk, toleransi keterlambatan, jam pulang, dan radius geofencing GPS.', ds_button('<i class="fa-solid fa-plus"></i> <span>Tambah Aturan</span>', 'primary', 'button', ['onclick' => 'openRuleModal()'])) ?>

        <?php if (!empty($error)): ?>
            <?= ds_alert(htmlspecialchars($error), 'danger') ?>
        <?php endif; ?>

        <!-- Rules Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <?php foreach ($rules as $r): ?>
                <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <?= ds_badge('Target: ' . htmlspecialchars($r['role_code']), 'success') ?>
                            <h3 class="text-lg font-bold text-slate-800 mt-1"><?= htmlspecialchars($r['rule_name']) ?></h3>
                        </div>
                        <?= ds_icon_button('fa-solid fa-pen-to-square', 'primary', 'button', [
                            'onclick' => 'editRule(' . htmlspecialchars(json_encode($r), ENT_QUOTES) . ')',
                            'title' => 'Edit',
                            'aria-label' => 'Edit ' . htmlspecialchars($r['rule_name'])
                        ]) ?>
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-xs">
                        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <span class="text-slate-500 block font-medium">Buka Presensi Masuk</span>
                            <span class="font-mono font-bold text-slate-700 text-sm"><?= format_time($r['check_in_start']) ?> WIB</span>
                        </div>
                        <div class="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                            <span class="text-amber-600 block font-medium">Batas Terlambat</span>
                            <span class="font-mono font-bold text-amber-700 text-sm"><?= format_time($r['late_threshold_time']) ?> WIB</span>
                        </div>
                        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <span class="text-slate-500 block font-medium">Buka Presensi Pulang</span>
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
<?= ds_modal_start('modal-rule', 'Tambah Aturan Absensi', 'lg') ?>

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="save_rule">
            <input type="hidden" id="form-rule-id" name="rule_id" value="">

            <?= ds_input('rule_name', 'Nama Aturan', 'text', '', [
                'id' => 'form-rule-name',
                'required' => true,
                'placeholder' => 'Contoh: Aturan Jam Masuk Siswa'
            ]) ?>

            <div class="grid grid-cols-2 gap-3">
                <?= ds_select('role_code', [
                    'siswa' => 'Khusus Siswa',
                    'guru' => 'Khusus Guru',
                    'all' => 'Semua Pengguna'
                ], '', 'Berlaku Untuk', [
                    'id' => 'form-rule-role'
                ]) ?>
                <?= ds_input('radius_limit', 'Radius GPS (Meter)', 'number', '150', [
                    'id' => 'form-rule-radius',
                    'required' => true
                ]) ?>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <?= ds_input('check_in_start', 'Mulai Buka', 'time', '06:00', [
                    'id' => 'form-rule-in-start'
                ]) ?>
                <?= ds_input('work_start_time', 'Jam Masuk', 'time', '07:00', [
                    'id' => 'form-rule-work-start'
                ]) ?>
                <?= ds_input('late_threshold_time', 'Toleransi / Batas', 'time', '07:15', [
                    'id' => 'form-rule-late'
                ]) ?>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <?= ds_input('check_out_start', 'Mulai Pulang', 'time', '14:00', [
                    'id' => 'form-rule-out-start'
                ]) ?>
                <?= ds_input('early_leave_threshold', 'Pulang Cepat', 'time', '13:30', [
                    'id' => 'form-rule-early'
                ]) ?>
                <?= ds_input('work_end_time', 'Selesai Jam Kerja', 'time', '15:30', [
                    'id' => 'form-rule-work-end'
                ]) ?>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <?= ds_button('Batal', 'ghost', 'button', ['onclick' => "closeModal('modal-rule')"]) ?>
                <?= ds_button('Simpan Aturan', 'primary', 'submit') ?>
            </div>
        </form>

<?= ds_modal_end() ?>

<script>
    function openRuleModal() {
        document.getElementById('form-rule-id').value = '';
        document.getElementById('form-rule-name').value = '';
        openModal('modal-rule');
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
        openModal('modal-rule');
    }
</script>

<?= ds_modal_js() ?>

<?php include __DIR__ . '/../includes/footer.php'; ?>
