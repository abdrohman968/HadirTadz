<?php
$page_title = 'Pengelolaan Kiosk Scanner';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$error = '';
$new_token = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'generate') {
        $device_name = trim($_POST['device_name'] ?? 'Kiosk Gerbang');
        $expires_at = trim($_POST['expires_at'] ?? '');
        $expires_value = ($expires_at !== '') ? date('Y-m-d H:i:s', strtotime($expires_at)) : null;

        try {
            $gen = kiosk_generate_token(auth_school_id(), $device_name, $expires_value);
            $new_token = $gen['token'];
            log_audit('KIOSK_CREATE', 'kiosk_tokens', $gen['id'], "Kiosk '$device_name' token baru dibuat", auth_school_id());
        } catch (Exception $e) {
            $error = 'Gagal membuat token kiosk: ' . $e->getMessage();
        }
    } elseif ($action === 'revoke') {
        $token_id = (int)($_POST['token_id'] ?? 0);
        if ($token_id > 0) {
            try {
                kiosk_revoke_token($token_id, auth_school_id());
                log_audit('KIOSK_REVOKE', 'kiosk_tokens', $token_id, 'Token kiosk dicabut', auth_school_id());
                set_flash('success', 'Token kiosk berhasil dicabut.');
                header("Location: kiosk.php");
                exit;
            } catch (Exception $e) {
                $error = 'Gagal mencabut token: ' . $e->getMessage();
            }
        }
    }
}

// Daftar token kiosk sekolah aktif (tenant-scoped)
$tokens = [];
try {
    $stmt = $pdo->prepare("
        SELECT * FROM kiosk_tokens
        WHERE school_id = ?
        ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, created_at DESC
    ");
    $stmt->execute([auth_school_id()]);
    $tokens = $stmt->fetchAll();
} catch (Exception $e) {
    $error = $error ?: 'Gagal membaca data kiosk: ' . $e->getMessage();
}

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-4xl mx-auto space-y-6">

        <?= ds_page_header('Pengelolaan Kiosk Scanner', 'Buat dan kelola token kiosk untuk perangkat presensi di gerbang ' . htmlspecialchars(current_school()['name'] ?? '') . '.', '<a href="' . $base_url . '/admin/index.php" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl self-start"><i class="fa-solid fa-arrow-left"></i> Kembali</a>') ?>

        <?php if (!empty($error)): ?>
            <?= ds_alert(htmlspecialchars($error), 'danger') ?>
        <?php endif; ?>

        <?php $flash = get_flash(); ?>
        <?php if ($flash): ?>
            <?= ds_alert(htmlspecialchars($flash['message']), $flash['type'] === 'success' ? 'success' : 'danger') ?>
        <?php endif; ?>

        <!-- Token Baru (Ditampilkan Sekali Setelah Generate) -->
        <?php if ($new_token !== null): ?>
            <div class="bg-emerald-900 rounded-3xl border border-emerald-700 p-6 shadow-lg">
                <h3 class="text-sm font-bold text-emerald-200 mb-2 flex items-center gap-2">
                    <i class="fa-solid fa-key text-emerald-400"></i> Token Kiosk Berhasil Dibuat
                </h3>
                <p class="text-xs text-emerald-300/80 mb-3">Gunakan URL berikut untuk memuat kiosk di perangkat gerbang. Token hanya ditampilkan sekali:</p>
                <div class="flex flex-col sm:flex-row gap-2 items-stretch">
                    <input type="text" id="new-token-value" readonly value="<?= htmlspecialchars($new_token) ?>"
                        class="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-emerald-600/50 text-emerald-200 text-sm font-mono focus:outline-none">
                    <button type="button" onclick="copyToken()" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition">
                        <i class="fa-solid fa-copy mr-1"></i> Salin
                    </button>
                </div>
                <div class="mt-3 p-3 rounded-xl bg-black/30 border border-emerald-800/40 text-xs text-emerald-200 font-mono break-all flex items-center gap-2">
                    <i class="fa-solid fa-link text-emerald-400"></i>
                    <span><?= htmlspecialchars($base_url) ?>/scan.php?k=<?= htmlspecialchars($new_token) ?></span>
                    <button type="button" onclick="copyKioskUrl()" class="ml-auto px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold transition">Salin URL</button>
                </div>
            </div>
        <?php endif; ?>

        <!-- Generate Token Form -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 class="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-plus-circle text-emerald-600"></i>
                <span>Buat Token Kiosk Baru</span>
            </h3>
            <form method="POST" action="" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div class="sm:col-span-2">
                    <?= ds_input('device_name', 'Nama Perangkat / Lokasi Kiosk', 'text', 'Kiosk Gerbang', [
                        'placeholder' => 'Contoh: Kiosk Gerbang Utama'
                    ]) ?>
                </div>
                <div>
                    <?= ds_input('expires_at', 'Kedaluwarsa (Opsional)', 'datetime-local') ?>
                </div>
                <div class="sm:col-span-3">
                    <?= ds_button('<i class="fa-solid fa-key"></i> <span>Generate Token Kiosk</span>', 'primary', 'submit', ['name' => 'action', 'value' => 'generate']) ?>
                </div>
            </form>
        </div>

        <!-- Daftar Token -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 class="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-list-check text-emerald-600"></i>
                <span>Daftar Token Kiosk</span>
                <span class="ml-auto"><?= ds_badge(count($tokens) . ' token', 'neutral') ?></span>
            </h3>

            <?php if (empty($tokens)): ?>
                <div class="text-center py-8 text-xs text-slate-500">
                    <i class="fa-solid fa-qrcode text-3xl text-slate-300 mb-2"></i>
                    <p>Belum ada token kiosk. Buat token pertama di form di atas.</p>
                </div>
            <?php else: ?>
                <div class="space-y-3">
                    <?php foreach ($tokens as $t): ?>
                        <?php
                        $is_active = ($t['status'] === 'active');
                        $is_expired = $is_active && !empty($t['expires_at']) && $t['expires_at'] !== '0000-00-00 00:00:00' && strtotime($t['expires_at']) < time();
                        ?>
                        <div class="p-4 rounded-2xl border <?= $is_active ? 'border-slate-200 bg-slate-50' : 'border-rose-200 bg-rose-50/50 opacity-70' ?> flex flex-col sm:flex-row sm:items-center gap-4">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-bold text-sm text-slate-800 truncate"><?= htmlspecialchars($t['device_name']) ?></span>
                                    <?= ds_badge($is_active ? ($is_expired ? 'Kedaluwarsa' : 'Aktif') : 'Dicabut', $is_active ? ($is_expired ? 'warning' : 'success') : 'danger') ?>
                                    <span class="text-[10px] font-mono text-slate-500">#<?= (int)$t['id'] ?></span>
                                </div>
                                <div class="text-[11px] text-slate-500 mt-1">
                                    Terakhir dipakai: <?= !empty($t['last_used_at']) ? format_date_indo($t['last_used_at'], true, true) : 'Belum pernah' ?>
                                    <?php if (!empty($t['expires_at'])): ?>
                                        &bull; Kedaluwarsa: <?= format_date_indo($t['expires_at'], false, true) ?>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <?php if ($is_active): ?>
                                <form method="POST" action="" onsubmit="return confirm('Cabut token ini? Perangkat kiosk tidak akan bisa digunakan lagi.');" class="flex items-center gap-2">
                                    <input type="hidden" name="token_id" value="<?= (int)$t['id'] ?>">
                                    <?= ds_button('<i class="fa-solid fa-ban"></i> Cabut', 'danger', 'submit', ['name' => 'action', 'value' => 'revoke']) ?>
                                </form>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>

    </div>
</main>

<script>
    function copyToken() {
        const el = document.getElementById('new-token-value');
        if (el) { el.select(); document.execCommand('copy'); }
        showToast('Token berhasil disalin.', 'success');
    }
    function copyKioskUrl() {
        const url = '<?= htmlspecialchars($base_url) ?>/scan.php?k=' + (document.getElementById('new-token-value').value || '');
        navigator.clipboard.writeText(url).then(() => showToast('URL Kiosk disalin.', 'success')).catch(() => showToast('Salin manual: ' + url, 'info'));
    }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>