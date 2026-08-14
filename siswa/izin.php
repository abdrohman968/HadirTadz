<?php
$page_title = 'Pengajuan Izin & Sakit';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['siswa']);
$base_url = get_base_url();
$user = auth_user();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'submit_permission') {
        $type = $_POST['type'] ?? 'izin';
        $start_date = $_POST['start_date'] ?? date('Y-m-d');
        $end_date = $_POST['end_date'] ?? date('Y-m-d');
        $reason = trim($_POST['reason'] ?? '');
        $attachment_url = null;

        // Handle file upload if present
        if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = __DIR__ . '/../assets/uploads/permissions/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            $ext = pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION);
            $filename = 'perm_' . $user['id'] . '_' . time() . '.' . $ext;
            if (move_uploaded_file($_FILES['attachment']['tmp_name'], $upload_dir . $filename)) {
                $attachment_url = $base_url . '/assets/uploads/permissions/' . $filename;
            }
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO permissions (user_id, type, start_date, end_date, reason, attachment_url, status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
            ");
            $stmt->execute([$user['id'], $type, $start_date, $end_date, $reason, $attachment_url]);
            log_audit('SUBMIT_PERMISSION', 'permissions', $pdo->lastInsertId(), "Submitted $type permission");
            set_flash('success', 'Permohonan izin berhasil diajukan! Menunggu persetujuan admin/guru.');
            header("Location: izin.php");
            exit;
        } catch (Exception $e) {
            $error = 'Gagal mengajukan izin: ' . $e->getMessage();
        }
    }
}

// Fetch Student's permissions
$stmt = $pdo->prepare("
    SELECT p.*, v.full_name AS verifier_name
    FROM permissions p
    LEFT JOIN users v ON p.verified_by_user_id = v.id
    WHERE p.user_id = ? AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
");
$stmt->execute([$user['id']]);
$my_permissions = $stmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-4xl mx-auto space-y-6">

        <!-- Page Header -->
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Pengajuan Izin & Sakit Siswa</h1>
            <p class="text-xs sm:text-sm text-slate-500">Ajukan permohonan ketidakhadiran dengan melampirkan surat dokter atau alasan resmi.</p>
        </div>

        <?php if (!empty($error)): ?>
            <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- Form Pengajuan -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 class="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <i class="fa-solid fa-file-signature text-emerald-600"></i>
                <span>Formulir Pengajuan</span>
            </h3>

            <form method="POST" action="" enctype="multipart/form-data" class="space-y-4">
                <input type="hidden" name="action" value="submit_permission">

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Jenis Permohonan</label>
                        <select name="type" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                            <option value="izin">Izin (Ada Keperluan)</option>
                            <option value="sakit">Sakit (Kondisi Kurang Sehat)</option>
                            <option value="dispensasi">Dispensasi Kegiatan Sekolah</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Mulai Tanggal</label>
                        <input type="date" name="start_date" value="<?= date('Y-m-d') ?>" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Sampai Tanggal</label>
                        <input type="date" name="end_date" value="<?= date('Y-m-d') ?>" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Alasan / Penjelasan</label>
                    <textarea name="reason" required rows="3" placeholder="Tuliskan keterangan lengkap alasan ketidakhadiran..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Unggah Surat / Bukti (Foto Surat Dokter / Surat Ortu)</label>
                    <input type="file" name="attachment" accept="image/*,.pdf" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100">
                    <p class="text-[10px] text-slate-400 mt-1">Format didukung: JPG, PNG, PDF (Maksimal 2MB)</p>
                </div>

                <div class="flex justify-end pt-2">
                    <button type="submit" class="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition flex items-center gap-2">
                        <i class="fa-solid fa-paper-plane"></i>
                        <span>Kirim Permohonan</span>
                    </button>
                </div>
            </form>
        </div>

        <!-- History of Submitted Permissions -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 class="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <i class="fa-solid fa-list-check text-slate-400"></i>
                <span>Status Riwayat Pengajuan Anda</span>
            </h3>

            <div class="space-y-3">
                <?php if (empty($my_permissions)): ?>
                    <div class="text-center py-8 text-slate-400 text-xs">
                        Belum ada permohonan izin yang pernah diajukan.
                    </div>
                <?php else: ?>
                    <?php foreach ($my_permissions as $mp): ?>
                        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="font-bold uppercase text-xs px-2.5 py-0.5 rounded-full <?= ($mp['type'] === 'sakit') ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800' ?>">
                                        <?= htmlspecialchars($mp['type']) ?>
                                    </span>
                                    <span class="font-mono text-slate-600 font-bold"><?= format_date_indo($mp['start_date'], false) ?> s/d <?= format_date_indo($mp['end_date'], false) ?></span>
                                </div>
                                <div>
                                    <?= status_badge($mp['status']) ?>
                                </div>
                            </div>
                            
                            <p class="text-slate-700 mt-1"><?= nl2br(htmlspecialchars($mp['reason'])) ?></p>

                            <?php if ($mp['rejection_reason']): ?>
                                <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                                    <strong>Catatan Penolakan:</strong> <?= htmlspecialchars($mp['rejection_reason']) ?>
                                </div>
                            <?php endif; ?>

                            <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                                <span>Diajukan pada: <?= date('d/m/Y H:i', strtotime($mp['created_at'])) ?></span>
                                <?php if ($mp['attachment_url']): ?>
                                    <a href="<?= htmlspecialchars($mp['attachment_url']) ?>" target="_blank" class="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                                        <i class="fa-solid fa-paperclip"></i> Lihat Lampiran
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

    </div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>
