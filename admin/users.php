<?php
$page_title = 'Kelola Akun Pengguna';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$base_url = get_base_url();
$school_id = auth_school_id();

$error = '';
$search = trim($_GET['search'] ?? '');
$role_filter = $_GET['role_id'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'reset_password') {
        $user_id = $_POST['user_id'] ?? '';
        $new_pass = $_POST['new_password'] ?? 'hadir123';
        if ($user_id) {
            $hash = password_hash($new_pass, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ? AND school_id = ?");
            $stmt->execute([$hash, $user_id, $school_id]);
            log_audit('RESET_PASSWORD', 'users', $user_id, "Password reset by admin", $school_id);
            set_flash('success', "Password pengguna berhasil direset menjadi: $new_pass");
            header("Location: users.php");
            exit;
        }
    } elseif ($action === 'toggle_status') {
        $user_id = $_POST['user_id'] ?? '';
        $new_status = $_POST['status'] ?? 'active';
        if ($user_id) {
            $stmt = $pdo->prepare("UPDATE users SET status = ?, updated_at = NOW() WHERE id = ? AND school_id = ?");
            $stmt->execute([$new_status, $user_id, $school_id]);
            log_audit('UPDATE_USER_STATUS', 'users', $user_id, "Status changed to $new_status", $school_id);
            set_flash('success', "Status akun berhasil diubah menjadi: $new_status");
            header("Location: users.php");
            exit;
        }
    }
}

// Fetch roles
$roles = $pdo->query("SELECT * FROM roles ORDER BY id")->fetchAll();

// Build Query
$sql = "
    SELECT u.*, r.role_name, r.role_code
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.deleted_at IS NULL AND u.school_id = :school_id
";
$params = [':school_id' => $school_id];

if (!empty($role_filter)) {
    $sql .= " AND u.role_id = :role_id";
    $params[':role_id'] = $role_filter;
}

if (!empty($search)) {
    $sql .= " AND (u.full_name LIKE :s OR u.identifier LIKE :s OR u.email LIKE :s)";
    $params[':s'] = "%$search%";
}

$sql .= " ORDER BY u.role_id, u.full_name";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$users = $stmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Kelola Akun Pengguna</h1>
                <p class="text-xs sm:text-sm text-slate-500">Manajemen akun masuk sistem, hak akses, dan reset kata sandi.</p>
            </div>
        </div>

        <!-- Filter Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <form method="GET" action="" class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Peran (Role)</label>
                    <select name="role_id" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="">-- Semua Role --</option>
                        <?php foreach ($roles as $r): ?>
                            <option value="<?= $r['id'] ?>" <?= ($role_filter == $r['id']) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($r['role_name']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cari Pengguna</label>
                    <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Nama, ID, atau Email..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>

                <div class="flex gap-2">
                    <button type="submit" class="flex-1 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition">
                        Filter
                    </button>
                    <a href="users.php" class="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition" title="Reset">
                        <i class="fa-solid fa-rotate-left"></i>
                    </a>
                </div>
            </form>
        </div>

        <!-- Users Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Pengguna: <strong class="text-slate-800 font-extrabold"><?= count($users) ?></strong> Akun
                </span>
            </div>

            <div class="table-responsive-card">
                <table class="w-full text-left text-xs text-slate-600">
                    <thead class="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                        <tr>
                            <th class="py-3 px-4">Nama & ID Pengguna</th>
                            <th class="py-3 px-4">Peran (Role)</th>
                            <th class="py-3 px-4">Kontak (Email / HP)</th>
                            <th class="py-3 px-4">Status Akun</th>
                            <th class="py-3 px-4">Terakhir Masuk</th>
                            <th class="py-3 px-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php foreach ($users as $u): ?>
                            <tr class="hover:bg-slate-50/80 transition">
<td class="py-3 px-4" data-label="Nama & ID Pengguna">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                                                <?= strtoupper(substr($u['full_name'], 0, 1)) ?>
                                        </div>
                                        <div>
                                            <div class="font-bold text-slate-800"><?= htmlspecialchars($u['full_name']) ?></div>
                                            <div class="font-mono text-[10px] text-slate-400"><?= htmlspecialchars($u['identifier']) ?></div>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-3 px-4" data-label="Peran (Role)">
                                    <span class="px-2.5 py-1 rounded-full text-xs font-bold capitalize 
                                        <?= ($u['role_code'] === 'admin') ? 'bg-purple-100 text-purple-800' : (($u['role_code'] === 'guru') ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800') ?>">
                                        <?= htmlspecialchars($u['role_name']) ?>
                                    </span>
                                </td>
                                <td class="py-3 px-4 text-slate-600" data-label="Kontak (Email / HP)">
                                    <div><?= htmlspecialchars($u['email'] ?: '-') ?></div>
                                    <div class="font-mono text-[10px] text-slate-400"><?= htmlspecialchars($u['phone'] ?: '-') ?></div>
                                </td>
                                <td class="py-3 px-4" data-label="Status Akun">
                                    <?php if ($u['status'] === 'active'): ?>
                                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Aktif
                                        </span>
                                    <?php else: ?>
                                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                            <span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Nonaktif
                                        </span>
                                    <?php endif; ?>
                                </td>
                                <td class="py-3 px-4 text-slate-400 text-[11px]" data-label="Terakhir Masuk">
                                    <?= $u['last_login_at'] ? format_date_indo($u['last_login_at'], false, true) : 'Belum pernah' ?>
                                </td>
                                <td class="py-3 px-4 text-center" data-label="Aksi">
                                    <div class="flex items-center justify-center gap-2">
                                        <!-- Reset Password -->
                                        <form method="POST" action="" onsubmit="return confirm('Reset kata sandi pengguna ini menjadi: hadir123 ?');">
                                            <input type="hidden" name="action" value="reset_password">
                                            <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                                            <input type="hidden" name="new_password" value="hadir123">
                                            <button type="submit" class="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-[11px] transition" title="Reset Password ke default">
                                                <i class="fa-solid fa-key mr-1"></i> Reset Sandi
                                            </button>
                                        </form>

                                        <!-- Toggle Status -->
                                        <form method="POST" action="">
                                            <input type="hidden" name="action" value="toggle_status">
                                            <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                                            <input type="hidden" name="status" value="<?= ($u['status'] === 'active') ? 'inactive' : 'active' ?>">
                                            <button type="submit" class="p-1.5 rounded-lg <?= ($u['status'] === 'active') ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-emerald-50 text-emerald-700' ?> transition" title="<?= ($u['status'] === 'active') ? 'Nonaktifkan' : 'Aktifkan' ?>">
                                                <i class="fa-solid <?= ($u['status'] === 'active') ? 'fa-ban' : 'fa-check' ?> text-xs"></i>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>
