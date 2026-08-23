<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$school_id = auth_school_id();

$page = max(1, (int)($_GET['page'] ?? 1));
$per_page = 20;
$offset = ($page - 1) * $per_page;

$total_stmt = $pdo->prepare("SELECT COUNT(*) FROM legal_consents WHERE school_id = ?");
$total_stmt->execute([$school_id]);
$total_rows = (int)$total_stmt->fetchColumn();
$total_pages = max(1, (int)ceil($total_rows / $per_page));

$stmt = $pdo->prepare("
    SELECT lc.*, u.full_name, u.identifier
    FROM legal_consents lc
    LEFT JOIN users u ON u.id = lc.user_id AND u.school_id = lc.school_id
    WHERE lc.school_id = ?
    ORDER BY lc.created_at DESC
    LIMIT $per_page OFFSET $offset
");
$stmt->execute([$school_id]);
$consents = $stmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-4xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Legal &amp; Persetujuan</h1>
                <p class="text-xs sm:text-sm text-slate-500">Riwayat persetujuan Syarat &amp; Ketentuan dan Kebijakan Privasi dari pengguna sekolah ini.</p>
            </div>
        </div>

        <?php if (empty($consents)): ?>
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-inbox text-2xl text-slate-300"></i>
                </div>
                <p class="text-slate-500 font-medium">Belum ada catatan persetujuan</p>
                <p class="text-slate-500 text-sm mt-1">Persetujuan akan tercatat saat ada pengguna baru yang mendaftar.</p>
            </div>
        <?php else: ?>
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100">
                    <p class="text-sm font-bold text-slate-800">Total: <?= $total_rows ?> catatan</p>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-200">
                                <th class="text-left px-4 py-3 font-bold text-slate-600">Pengguna</th>
                                <th class="text-left px-4 py-3 font-bold text-slate-600">Jenis</th>
                                <th class="text-left px-4 py-3 font-bold text-slate-600">Versi</th>
                                <th class="text-left px-4 py-3 font-bold text-slate-600">IP</th>
                                <th class="text-left px-4 py-3 font-bold text-slate-600">Tanggal &amp; Waktu</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <?php foreach ($consents as $c): ?>
                            <tr class="hover:bg-slate-50 transition">
                                <td class="px-4 py-3">
                                    <p class="font-semibold text-slate-800"><?= htmlspecialchars($c['full_name'] ?? '-') ?></p>
                                    <p class="text-xs text-slate-500"><?= htmlspecialchars($c['identifier'] ?? '') ?></p>
                                </td>
                                <td class="px-4 py-3">
                                    <?php if ($c['consent_type'] === 'terms'): ?>
                                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                            <i class="fa-solid fa-file-contract"></i> Syarat &amp; Ketentuan
                                        </span>
                                    <?php else: ?>
                                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
                                            <i class="fa-solid fa-shield-halved"></i> Kebijakan Privasi
                                        </span>
                                    <?php endif; ?>
                                </td>
                                <td class="px-4 py-3 font-mono text-xs text-slate-600"><?= htmlspecialchars($c['consent_version']) ?></td>
                                <td class="px-4 py-3 font-mono text-xs text-slate-500"><?= htmlspecialchars($c['ip_address'] ?? '-') ?></td>
                                <td class="px-4 py-3 text-xs text-slate-600"><?= date('d M Y H:i', strtotime($c['created_at'])) ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <?php if ($total_pages > 1): ?>
                <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <p class="text-xs text-slate-500">Halaman <?= $page ?> dari <?= $total_pages ?></p>
                    <div class="flex gap-2">
                        <?php if ($page > 1): ?>
                            <a href="?page=<?= $page - 1 ?>" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                                <i class="fa-solid fa-chevron-left mr-1"></i> Sebelumnya
                            </a>
                        <?php endif; ?>
                        <?php if ($page < $total_pages): ?>
                            <a href="?page=<?= $page + 1 ?>" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                                Selanjutnya <i class="fa-solid fa-chevron-right ml-1"></i>
                            </a>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>

    </div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>
