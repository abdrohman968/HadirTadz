<?php
$page_title = 'Kartu Pelajar Digital';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['siswa']);
$user = auth_user();

$school_name = get_setting('schoolName', 'SMA Negeri Harapan Bangsa');
$school_address = get_setting('address', 'Bandung');
$npsn = get_setting('npsn', '20227912');

$stmt = $pdo->prepare("
    SELECT s.*, c.class_name, c.major
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.user_id = ?
");
$stmt->execute([$user['id']]);
$student = $stmt->fetch();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>

<main class="flex-1 overflow-y-auto bg-slate-900 p-4 sm:p-6 lg:p-8">
    <div class="max-w-md w-full mx-auto min-h-full flex flex-col">
      <div class="flex flex-col justify-center my-auto space-y-6">

        <div class="text-center text-white space-y-1">
            <h1 class="text-xl font-bold tracking-tight">Kartu Pelajar Digital</h1>
            <p class="text-xs text-emerald-400">Tunjukkan QR Code ini ke kamera pemindai gerbang sekolah</p>
        </div>

        <!-- ID Card Component -->
        <div class="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/50 relative overflow-hidden flex flex-col justify-between">
            
            <!-- Card Header -->
            <div class="flex items-center justify-between border-b border-emerald-500/40 pb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-white text-emerald-800 flex items-center justify-center font-extrabold text-lg shadow-md">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div>
                        <h2 class="text-sm font-extrabold tracking-tight leading-tight"><?= htmlspecialchars($school_name) ?></h2>
                        <p class="text-[10px] text-emerald-200 uppercase font-semibold tracking-wider">KARTU TANDA PELAJAR DIGITAL</p>
                    </div>
                </div>
                <span class="text-[10px] font-mono font-bold text-emerald-300">NPSN: <?= htmlspecialchars($npsn) ?></span>
            </div>

            <!-- Student Profile Section -->
            <div class="my-6 flex flex-col items-center text-center space-y-4">
                <!-- Large QR Code -->
                <div class="bg-white p-3 rounded-2xl shadow-xl ring-4 ring-emerald-500/30">
                    <div id="fullscreen-qrcode"></div>
                </div>

                <div>
                    <h3 class="text-lg font-black text-white"><?= htmlspecialchars($user['full_name']) ?></h3>
                    <p class="text-xs font-mono font-bold text-emerald-300 mt-0.5">NISN: <?= htmlspecialchars($student['nisn'] ?? $user['identifier']) ?></p>
                    <p class="text-xs text-emerald-100 mt-1"><?= htmlspecialchars($student['class_name'] ?? 'Kelas Umum') ?> &bull; <?= htmlspecialchars($student['major'] ?? '') ?></p>
                </div>
            </div>

            <!-- Card Footer -->
            <div class="border-t border-emerald-500/40 pt-3 flex items-center justify-between text-[10px] text-emerald-200 font-mono">
                <span>TA: 2025/2026</span>
                <span class="font-bold text-white uppercase tracking-widest">VALID DIGITAL ID</span>
            </div>

            <div class="absolute -left-12 -bottom-12 w-36 h-36 rounded-full bg-white/5 pointer-events-none"></div>
        </div>

        <div class="flex justify-center">
            <button onclick="window.print()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center gap-2 border border-slate-700">
                <i class="fa-solid fa-print"></i>
                <span>Cetak Kartu</span>
            </button>
        </div>

      </div>
    </div>
</main>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        new QRCode(document.getElementById("fullscreen-qrcode"), {
            text: <?= json_encode($user['identifier']) ?>,
            width: 140,
            height: 140,
            colorDark: "#064e3b",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    });
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
