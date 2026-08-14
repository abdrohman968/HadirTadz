<?php
$page_title = 'Riwayat Kehadiran Siswa';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['siswa']);
$base_url = get_base_url();
$user = auth_user();

$month = $_GET['month'] ?? date('Y-m');

$stmt = $pdo->prepare("
    SELECT * FROM attendance 
    WHERE user_id = ? AND date LIKE ? 
    ORDER BY date DESC
");
$stmt->execute([$user['id'], "$month%"]);
$history = $stmt->fetchAll();

// Calculate Monthly Summary
$summary = ['HADIR' => 0, 'TERLAMBAT' => 0, 'IZIN' => 0, 'SAKIT' => 0, 'ALPHA' => 0];
foreach ($history as $h) {
    if (isset($summary[$h['status']])) {
        $summary[$h['status']]++;
    }
}

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-5xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Riwayat Kehadiran Siswa</h1>
                <p class="text-xs sm:text-sm text-slate-500">Rekap kehadiran, waktu masuk dan pulang, serta catatan izin.</p>
            </div>
            <form method="GET" action="" class="flex items-center gap-2">
                <input type="month" name="month" value="<?= htmlspecialchars($month) ?>" onchange="this.form.submit()" class="px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
            </form>
        </div>

        <!-- Summary Counters -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <span class="text-[10px] font-bold uppercase text-emerald-600">Tepat Waktu</span>
                <p class="text-2xl font-extrabold text-emerald-800 mt-1"><?= $summary['HADIR'] ?></p>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <span class="text-[10px] font-bold uppercase text-amber-600">Terlambat</span>
                <p class="text-2xl font-extrabold text-amber-800 mt-1"><?= $summary['TERLAMBAT'] ?></p>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <span class="text-[10px] font-bold uppercase text-blue-600">Izin / Sakit</span>
                <p class="text-2xl font-extrabold text-blue-800 mt-1"><?= $summary['IZIN'] + $summary['SAKIT'] ?></p>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <span class="text-[10px] font-bold uppercase text-rose-600">Alpha</span>
                <p class="text-2xl font-extrabold text-rose-800 mt-1"><?= $summary['ALPHA'] ?></p>
            </div>
        </div>

        <!-- Attendance List -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-3 sm:p-0">
            <div class="table-responsive-card overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-600">
                    <thead class="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                        <tr>
                            <th class="py-3 px-4">Tanggal</th>
                            <th class="py-3 px-4">Jam Masuk</th>
                            <th class="py-3 px-4">Jam Pulang</th>
                            <th class="py-3 px-4">Status</th>
                            <th class="py-3 px-4">Metode</th>
                            <th class="py-3 px-4">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php if (empty($history)): ?>
                            <tr>
                                <td colspan="6" class="text-center py-10 text-slate-400" data-label="Info">
                                    Tidak ada catatan presensi pada bulan yang dipilih.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($history as $item): ?>
                                <tr class="hover:bg-slate-50/80 transition">
                                    <td class="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap" data-label="Tanggal">
                                        <?= format_date_indo($item['date'], true) ?>
                                    </td>
                                    <td class="py-3.5 px-4 font-mono font-bold text-emerald-700" data-label="Masuk">
                                        <?= format_time($item['time_in']) ?>
                                    </td>
                                    <td class="py-3.5 px-4 font-mono font-bold text-slate-700" data-label="Pulang">
                                        <?= format_time($item['time_out']) ?>
                                    </td>
                                    <td class="py-3.5 px-4" data-label="Status">
                                        <?= status_badge($item['status']) ?>
                                    </td>
                                    <td class="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-400 font-mono" data-label="Metode">
                                        <?= htmlspecialchars($item['method'] ?: 'QR') ?>
                                    </td>
                                    <td class="py-3.5 px-4 text-slate-500 text-xs italic" data-label="Catatan">
                                        <?= htmlspecialchars($item['notes'] ?: '-') ?>
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

<?php include __DIR__ . '/../includes/footer.php'; ?>
