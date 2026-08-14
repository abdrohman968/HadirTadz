<?php
$page_title = 'Cetak Kartu Pelajar Digital';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$base_url = get_base_url();

$filter_class = $_GET['class_id'] ?? '';
$school_name = get_setting('schoolName', 'SMA Terpadu Al-Mu\'min');
$school_address = get_setting('address', 'Bandung');
$npsn = get_setting('npsn', '20227912');

// Fetch Classes
$classes = $pdo->query("SELECT * FROM classes ORDER BY grade, class_name")->fetchAll();

// Query Students
$sql = "
    SELECT s.*, c.class_name, c.major, u.identifier
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.deleted_at IS NULL
";
$params = [];
if (!empty($filter_class)) {
    $sql .= " AND s.class_id = :class_id";
    $params[':class_id'] = $filter_class;
}
$sql .= " ORDER BY c.class_name, s.full_name";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$students = $stmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<!-- QR Code Generator Library -->
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Top Controls (Hidden on Print) -->
        <div class="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Cetak Kartu Pelajar Digital</h1>
                <p class="text-xs sm:text-sm text-slate-500">Generate kartu tanda pengenal dengan QR Code untuk scan otomatis di gerbang sekolah.</p>
            </div>
            <div class="flex items-center gap-2.5">
                <form method="GET" action="" class="flex items-center gap-2">
                    <select name="class_id" onchange="this.form.submit()" class="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                        <option value="">-- Semua Kelas --</option>
                        <?php foreach ($classes as $c): ?>
                            <option value="<?= $c['id'] ?>" <?= ($filter_class == $c['id']) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($c['class_name']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </form>
                <button onclick="window.print()" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2">
                    <i class="fa-solid fa-print"></i>
                    <span>Cetak Semua Kartu</span>
                </button>
            </div>
        </div>

        <!-- Cards Print Grid -->
        <div class="card-print-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <?php if (empty($students)): ?>
                <div class="col-span-3 text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-400">
                    Tidak ada data siswa yang ditemukan untuk dicetak.
                </div>
            <?php else: ?>
                <?php foreach ($students as $idx => $s): ?>
                    <!-- ID Card Item (Credit Card / ID-1 standard ratio ~85x54mm) -->
                    <div class="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-600 relative overflow-hidden flex flex-col justify-between aspect-[1.58/1]">
                        
                        <!-- Top Header -->
                        <div class="flex items-center justify-between border-b border-emerald-500/40 pb-2.5">
                            <div class="flex items-center gap-2">
                                <div class="w-7 h-7 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow">
                                    <i class="fa-solid fa-graduation-cap"></i>
                                </div>
                                <div>
                                    <h4 class="text-[11px] font-extrabold tracking-tight leading-tight"><?= htmlspecialchars($school_name) ?></h4>
                                    <p class="text-[9px] text-emerald-200">KARTU TANDA PELAJAR</p>
                                </div>
                            </div>
                            <span class="text-[9px] font-mono font-bold text-emerald-300">NPSN: <?= htmlspecialchars($npsn) ?></span>
                        </div>

                        <!-- Card Body -->
                        <div class="flex items-center gap-4 my-auto py-2">
                            <!-- Student Avatar -->
                            <div class="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-xl font-black text-white shadow-inner flex-shrink-0">
                                <?= strtoupper(substr($s['full_name'], 0, 1)) ?>
                            </div>

                            <!-- Student Info -->
                            <div class="flex-1 min-w-0">
                                <h3 class="text-sm font-extrabold text-white truncate"><?= htmlspecialchars($s['full_name']) ?></h3>
                                <p class="text-[11px] font-mono font-bold text-emerald-300">NISN: <?= htmlspecialchars($s['nisn']) ?></p>
                                <p class="text-[10px] text-emerald-100 mt-0.5"><?= htmlspecialchars($s['class_name'] ?? 'Umum') ?></p>
                                <p class="text-[9px] text-emerald-200/80"><?= htmlspecialchars($s['major'] ?? '') ?></p>
                            </div>

                            <!-- QR Code Box -->
                            <div class="w-16 h-16 bg-white p-1 rounded-xl shadow flex items-center justify-center flex-shrink-0">
                                <div id="qrcode-<?= $idx ?>" class="w-full h-full flex items-center justify-center"></div>
                            </div>
                        </div>

                        <!-- Card Footer -->
                        <div class="flex items-center justify-between border-t border-emerald-500/40 pt-2 text-[9px] text-emerald-200">
                            <span>Tahun Ajaran: 2025/2026</span>
                            <span class="font-bold text-white tracking-widest uppercase">ID DIGITAL</span>
                        </div>

                        <!-- Decorative background circle -->
                        <div class="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-white/5 pointer-events-none"></div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

    </div>
</main>

<script>
    // Generate QR Codes on the fly for each student
    document.addEventListener('DOMContentLoaded', () => {
        <?php foreach ($students as $idx => $s): ?>
            new QRCode(document.getElementById("qrcode-<?= $idx ?>"), {
                text: "<?= $s['identifier'] ?>",
                width: 56,
                height: 56,
                colorDark: "#064e3b",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        <?php endforeach; ?>
    });
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
