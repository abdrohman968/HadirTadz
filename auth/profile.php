<?php
$page_title = 'Profil Pengguna';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth();
$user = auth_user();
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'update_profile') {
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');

        try {
            $stmt = $pdo->prepare("UPDATE users SET email = ?, phone = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$email, $phone, $user['id']]);
            
            // Refresh session data
            $_SESSION['user_data'] = null;
            $user = auth_user();
            
            set_flash('success', 'Profil berhasil diperbarui!');
            header("Location: profile.php");
            exit;
        } catch (Exception $e) {
            $error = 'Gagal menyimpan profil: ' . $e->getMessage();
        }
    } elseif ($action === 'change_password') {
        $current_pass = $_POST['current_password'] ?? '';
        $new_pass = $_POST['new_password'] ?? '';
        $confirm_pass = $_POST['confirm_password'] ?? '';

        // Query password_hash dari DB (tidak disimpan di session)
        $hashStmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
        $hashStmt->execute([$user['id']]);
        $current_hash = $hashStmt->fetchColumn();

        if (!$current_hash || !password_verify($current_pass, $current_hash)) {
            $error = 'Kata sandi saat ini tidak sesuai!';
        } elseif (strlen($new_pass) < 6) {
            $error = 'Kata sandi baru minimal 6 karakter!';
        } elseif ($new_pass !== $confirm_pass) {
            $error = 'Konfirmasi kata sandi tidak cocok!';
        } else {
            $new_hash = password_hash($new_pass, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$new_hash, $user['id']]);

            log_audit('CHANGE_PASSWORD', 'users', $user['id'], 'User changed their password');
            set_flash('success', 'Kata sandi berhasil diubah!');
            header("Location: profile.php");
            exit;
        }
    }
}

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-4xl mx-auto space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Pengaturan Profil & Keamanan</h1>
                <p class="text-xs sm:text-sm text-slate-500">Kelola informasi akun dan perbarui kata sandi Anda.</p>
            </div>
        </div>

        <?php if (!empty($error)): ?>
            <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
                <i class="fa-solid fa-circle-exclamation text-lg text-rose-500"></i>
                <span><?= htmlspecialchars($error) ?></span>
            </div>
        <?php endif; ?>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Left Info Card -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
                <div class="w-24 h-24 rounded-full bg-emerald-700 text-white flex items-center justify-center text-3xl font-extrabold shadow-md mb-4 ring-4 ring-emerald-100">
                    <?= strtoupper(substr($user['full_name'], 0, 1)) ?>
                </div>
                <h2 class="text-lg font-bold text-slate-800"><?= htmlspecialchars($user['full_name']) ?></h2>
                <span class="mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize">
                    <?= htmlspecialchars($user['role_name'] ?? $user['role_code']) ?>
                </span>
                
                <div class="w-full mt-6 pt-6 border-t border-slate-100 space-y-3 text-left text-xs">
                    <div>
                        <span class="text-slate-500 block font-medium">ID Pengguna</span>
                        <span class="font-mono font-bold text-slate-700"><?= htmlspecialchars($user['identifier']) ?></span>
                    </div>
                    <div>
                        <span class="text-slate-500 block font-medium">Status Akun</span>
                        <span class="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Aktif
                        </span>
                    </div>
                    <div>
                        <span class="text-slate-500 block font-medium">Terakhir Masuk</span>
                        <span class="text-slate-600"><?= format_date_indo($user['last_login_at'], true, true) ?></span>
                    </div>
                </div>
            </div>

            <!-- Right Forms -->
            <div class="md:col-span-2 space-y-6">
                <!-- Update Profile Form -->
                <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-address-card text-emerald-600"></i>
                        <span>Informasi Kontak</span>
                    </h3>
                    <form method="POST" action="" class="space-y-4">
                        <input type="hidden" name="action" value="update_profile">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label for="field-profile-email" class="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
                                <input id="field-profile-email" type="email" name="email" value="<?= htmlspecialchars($user['email'] ?? '') ?>" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                            </div>
                            <div>
                                <label for="field-profile-phone" class="block text-xs font-bold text-slate-600 uppercase mb-1">Nomor WhatsApp / HP</label>
                                <input id="field-profile-phone" type="text" name="phone" value="<?= htmlspecialchars($user['phone'] ?? '') ?>" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                            </div>
                        </div>
                        <div class="flex justify-end pt-2">
                            <button type="submit" class="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition">
                                Simpan Kontak
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Change Password Form -->
                <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-key text-emerald-600"></i>
                        <span>Ubah Kata Sandi</span>
                    </h3>
                    <form method="POST" action="" class="space-y-4">
                        <input type="hidden" name="action" value="change_password">
                        <div>
                            <label for="field-profile-current-password" class="block text-xs font-bold text-slate-600 uppercase mb-1">Kata Sandi Saat Ini</label>
                            <input id="field-profile-current-password" type="password" name="current_password" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label for="field-profile-new-password" class="block text-xs font-bold text-slate-600 uppercase mb-1">Kata Sandi Baru</label>
                                <input id="field-profile-new-password" type="password" name="new_password" required minlength="6" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                            </div>
                            <div>
                                <label for="field-profile-confirm-password" class="block text-xs font-bold text-slate-600 uppercase mb-1">Konfirmasi Kata Sandi Baru</label>
                                <input id="field-profile-confirm-password" type="password" name="confirm_password" required minlength="6" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                            </div>
                        </div>
                        <div class="flex justify-end pt-2">
                            <button type="submit" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition">
                                Perbarui Kata Sandi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>
