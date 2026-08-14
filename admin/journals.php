<?php
$page_title = 'Jurnal Mengajar Guru';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$base_url = get_base_url();

$filter_class = $_GET['class_id'] ?? '';
$filter_date = $_GET['date'] ?? '';

// Fetch Classes
$classes = $pdo->query("SELECT * FROM classes ORDER BY grade, class_name")->fetchAll();

// Build Query
$sql = "
    SELECT j.*, u.full_name AS teacher_name, u.identifier AS teacher_nip, c.class_name
    FROM journals j
    JOIN users u ON j.teacher_user_id = u.id
    JOIN classes c ON j.class_id = c.id
    WHERE j.deleted_at IS NULL
";
$params = [];

if (!empty($filter_class)) {
    $sql .= " AND j.class_id = :class_id";
    $params[':class_id'] = $filter_class;
}

if (!empty($filter_date)) {
    $sql .= " AND j.date = :date";
    $params[':date'] = $filter_date;
}

$sql .= " ORDER BY j.date DESC, j.created_at DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$journals = $stmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Jurnal Mengajar Guru</h1>
                <p class="text-xs sm:text-sm text-slate-500">Monitoring catatan kegiatan belajar mengajar, materi yang diajarkan, dan kehadiran siswa di kelas.</p>
            </div>
        </div>

        <!-- Filter Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <form method="GET" action="" class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Kelas</label>
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
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tanggal Kegiatan</label>
                    <input type="date" name="date" value="<?= htmlspecialchars($filter_date) ?>" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>

                <div class="flex gap-2">
                    <button type="submit" class="flex-1 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition">
                        Filter
                    </button>
                    <a href="journals.php" class="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition" title="Reset">
                        <i class="fa-solid fa-rotate-left"></i>
                    </a>
                </div>
            </form>
        </div>

        <!-- Journals Feed / Table -->
        <div class="space-y-4">
            <?php if (empty($journals)): ?>
                <div class="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-400">
                    Belum ada rekaman jurnal pembelajaran yang sesuai filter.
                </div>
            <?php else: ?>
                <?php foreach ($journals as $j): ?>
                    <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4">
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-sm flex items-center justify-center">
                                    <i class="fa-solid fa-book-open"></i>
                                </div>
                                <div>
                                    <h3 class="text-base font-bold text-slate-800"><?= htmlspecialchars($j['subject']) ?></h3>
                                    <p class="text-xs text-slate-500">
                                        Oleh <strong class="text-slate-700"><?= htmlspecialchars($j['teacher_name']) ?></strong> &bull; Kelas <?= htmlspecialchars($j['class_name']) ?>
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 text-xs">
                                <span class="font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                    <i class="fa-regular fa-calendar mr-1 text-slate-400"></i>
                                    <?= format_date_indo($j['date'], true) ?>
                                </span>
                                <span class="font-mono text-slate-500"><?= htmlspecialchars($j['time'] ?: '-') ?></span>
                            </div>
                        </div>

                        <div class="space-y-2 text-xs">
                            <div>
                                <span class="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Materi Pokok / Bahasan:</span>
                                <p class="text-slate-800 text-sm font-medium mt-0.5 leading-relaxed"><?= nl2br(htmlspecialchars($j['topic'])) ?></p>
                            </div>

                            <?php if ($j['notes']): ?>
                                <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-slate-600">
                                    <span class="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">Catatan Kejadian di Kelas:</span>
                                    <?= nl2br(htmlspecialchars($j['notes'])) ?>
                                </div>
                            <?php endif; ?>
                        </div>

                        <div class="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                            <div class="flex items-center gap-3">
                                <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                    <?= $j['present_count'] ?> Siswa Hadir
                                </span>
                                <?php if ($j['absent_count'] > 0): ?>
                                    <span class="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold">
                                        <?= $j['absent_count'] ?> Siswa Tidak Hadir
                                    </span>
                                <?php endif; ?>
                            </div>
                            <span class="text-[11px] text-slate-400">Dicatat: <?= date('d/m/Y H:i', strtotime($j['created_at'])) ?></span>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

    </div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>
