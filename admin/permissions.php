<?php
$page_title = 'Persetujuan Izin & Sakit';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$current_user = auth_user();
$school_id = auth_school_id();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $perm_id = $_POST['permission_id'] ?? '';

    if ($action === 'approve' && $perm_id) {
        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("SELECT * FROM permissions WHERE id = ? AND school_id = ?");
            $stmt->execute([$perm_id, $school_id]);
            $perm = $stmt->fetch();

            if ($perm) {
                // Update permission status
                $upd = $pdo->prepare("
                    UPDATE permissions 
                    SET status = 'approved', verified_by_user_id = ?, verified_at = NOW(), updated_at = NOW() 
                    WHERE id = ? AND school_id = ?
                ");
                $upd->execute([$current_user['id'], $perm_id, $school_id]);

                // Auto-sync into attendance table for the date range
                $att_status = (strtoupper($perm['type']) === 'SAKIT') ? 'SAKIT' : 'IZIN';
                $cur = strtotime($perm['start_date']);
                $end = strtotime($perm['end_date']);

                // Find class_id if student
                $clsStmt = $pdo->prepare("SELECT class_id FROM students WHERE user_id = ? AND school_id = ?");
                $clsStmt->execute([$perm['user_id'], $school_id]);
                $class_id = $clsStmt->fetchColumn() ?: null;

                $userIdentifierStmt = $pdo->prepare("SELECT identifier FROM users WHERE id = ?");
                $userIdentifierStmt->execute([$perm['user_id']]);
                $identifier = $userIdentifierStmt->fetchColumn();

                while ($cur <= $end) {
                    $d = date('Y-m-d', $cur);
                    $insAtt = $pdo->prepare("
                        INSERT INTO attendance (school_id, user_id, class_id, date, status, method, identifier, notes, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, 'manual', ?, ?, NOW(), NOW())
                        ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), updated_at = NOW()
                    ");
                    $insAtt->execute([$school_id, $perm['user_id'], $class_id, $d, $att_status, $identifier, "Izin disetujui: " . $perm['reason']]);
                    $cur = strtotime('+1 day', $cur);
                }

                $pdo->commit();
                log_audit('APPROVE_PERMISSION', 'permissions', $perm_id, "Permission approved as $att_status", $school_id);
                set_flash('success', 'Pengajuan izin berhasil disetujui dan disinkronkan ke rekaman presensi!');
            }
            header("Location: permissions.php");
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            $error = 'Gagal memproses persetujuan: ' . $e->getMessage();
        }
    } elseif ($action === 'reject' && $perm_id) {
        $reason = trim($_POST['rejection_reason'] ?? 'Pengajuan tidak memenuhi syarat');
        $stmt = $pdo->prepare("
            UPDATE permissions 
            SET status = 'rejected', verified_by_user_id = ?, verified_at = NOW(), rejection_reason = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$current_user['id'], $reason, $perm_id]);
        log_audit('REJECT_PERMISSION', 'permissions', $perm_id, "Permission rejected: $reason");
        set_flash('warning', 'Pengajuan izin telah ditolak.');
        header("Location: permissions.php");
        exit;
    }
}

// Fetch all permissions with user & class details (scoped to current school)
$permissions = $pdo->prepare("
    SELECT p.*, u.full_name, u.identifier, r.role_name, c.class_name,
           v.full_name AS verifier_name
    FROM permissions p
    JOIN users u ON p.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN users v ON p.verified_by_user_id = v.id
    WHERE p.deleted_at IS NULL AND p.school_id = ?
    ORDER BY (p.status = 'pending') DESC, p.created_at DESC
");
$permissions->execute([$school_id]);
$permissions = $permissions->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Verifikasi Izin & Sakit</h1>
                <p class="text-xs sm:text-sm text-slate-500">Kelola dan setujui surat keterangan sakit atau permohonan izin siswa dan guru.</p>
            </div>
        </div>

        <?php if (!empty($error)): ?>
            <?= ds_alert(htmlspecialchars($error), 'danger') ?>
        <?php endif; ?>

        <!-- Permissions Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Pengajuan: <strong class="text-slate-800 font-extrabold"><?= count($permissions) ?></strong> Berkas
                </span>
            </div>

            <div class="table-responsive-card">
                <table class="w-full text-left text-xs text-slate-600">
                    <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                        <tr>
                            <th class="py-3 px-4">Pemohon</th>
                            <th class="py-3 px-4">Tipe</th>
                            <th class="py-3 px-4">Rentang Waktu</th>
                            <th class="py-3 px-4">Alasan / Catatan</th>
                            <th class="py-3 px-4">Bukti / Lampiran</th>
                            <th class="py-3 px-4">Status</th>
                            <th class="py-3 px-4 text-center">Aksi / Verifikasi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php if (empty($permissions)): ?>
                            <tr>
                                <td colspan="7" class="text-center py-10 text-slate-500" data-label="">
                                    Belum ada berkas pengajuan izin atau sakit.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($permissions as $p): ?>
                                <tr class="hover:bg-slate-50/80 transition">
                                    <td class="py-3 px-4" data-label="Pemohon">
                                        <div class="font-bold text-slate-800"><?= htmlspecialchars($p['full_name']) ?></div>
                                        <div class="text-[10px] text-slate-500"><?= htmlspecialchars($p['class_name'] ?? $p['role_name']) ?> &bull; <span class="font-mono"><?= htmlspecialchars($p['identifier']) ?></span></div>
                                    </td>
                                    <td class="py-3 px-4" data-label="Tipe">
                                        <?= ds_badge(htmlspecialchars($p['type']), $p['type'] === 'sakit' ? 'info' : 'success') ?>
                                    </td>
                                    <td class="py-3 px-4 font-mono text-[11px] text-slate-700" data-label="Rentang Waktu">
                                        <div><?= format_date_indo($p['start_date'], false) ?></div>
                                        <div class="text-slate-500 text-[10px]">s/d <?= format_date_indo($p['end_date'], false) ?></div>
                                    </td>
                                    <td class="py-3 px-4 text-slate-700 max-w-xs" data-label="Alasan / Catatan">
                                        <?= htmlspecialchars($p['reason']) ?>
                                        <?php if ($p['rejection_reason']): ?>
                                            <div class="text-[10px] text-rose-600 mt-1">Alasan ditolak: <?= htmlspecialchars($p['rejection_reason']) ?></div>
                                        <?php endif; ?>
                                    </td>
                                    <td class="py-3 px-4" data-label="Bukti / Lampiran">
                                        <?php if (!empty($p['attachment_url'])): ?>
                                            <a href="<?= htmlspecialchars($p['attachment_url']) ?>" target="_blank" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 font-semibold text-[11px] transition">
                                                <i class="fa-solid fa-paperclip"></i> Lihat Berkas
                                            </a>
                                        <?php else: ?>
                                            <span class="text-slate-500">-</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="py-3 px-4" data-label="Status">
                                        <?= status_badge($p['status']) ?>
                                    </td>
                                    <td class="py-3 px-4 text-center" data-label="Aksi / Verifikasi">
                                        <?php if ($p['status'] === 'pending'): ?>
                                            <div class="flex items-center justify-center gap-2">
                                                <!-- Approve -->
                                                <form method="POST" action="" onsubmit="return confirm('Setujui pengajuan izin ini?');">
                                                    <input type="hidden" name="action" value="approve">
                                                    <input type="hidden" name="permission_id" value="<?= $p['id'] ?>">
                                                    <?= ds_button('Setujui', 'primary', 'submit') ?>
                                                </form>

                                                <!-- Reject Modal Trigger -->
                                                <?= ds_button('Tolak', 'danger', 'button', [
                                                    'onclick' => 'openRejectModal(' . (int)$p['id'] . ')'
                                                ]) ?>
                                            </div>
                                        <?php else: ?>
                                            <span class="text-[11px] text-slate-500">
                                                Oleh <?= htmlspecialchars($p['verifier_name'] ?? 'Admin') ?>
                                            </span>
                                        <?php endif; ?>
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

<!-- Reject Reason Modal -->
<?= ds_modal_start('modal-reject', 'Alasan Penolakan Izin', 'sm') ?>

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="reject">
            <input type="hidden" id="reject-perm-id" name="permission_id" value="">

            <?= ds_textarea('Alasan Penolakan', [
                'name' => 'rejection_reason',
                'required' => true,
                'rows' => 3,
                'placeholder' => 'Masukkan alasan penolakan...'
            ]) ?>

            <div class="flex justify-end gap-2">
                <?= ds_button('Batal', 'ghost', 'button', ['onclick' => "closeModal('modal-reject')"]) ?>
                <?= ds_button('Tolak Izin', 'danger', 'submit') ?>
            </div>
        </form>

<?= ds_modal_end() ?>

<script>
    function openRejectModal(id) {
        document.getElementById('reject-perm-id').value = id;
        openModal('modal-reject');
    }
</script>

<?= ds_modal_js() ?>

<?php include __DIR__ . '/../includes/footer.php'; ?>
