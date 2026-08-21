<?php
$page_title = 'Jurnal Pembelajaran';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['guru']);
$base_url = get_base_url();
$user = auth_user();
$school_id = auth_school_id();
$error = '';

// Dapatkan spesialisasi guru
$stmt = $pdo->prepare("SELECT * FROM teachers WHERE user_id = ?");
$stmt->execute([$user['id']]);
$teacher = $stmt->fetch();

// Simpan Jurnal
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'save_journal') {
        $class_id = $_POST['class_id'] ?? '';
        $date = $_POST['date'] ?? date('Y-m-d');
        $time = trim($_POST['time'] ?? date('H:i'));
        $subject = trim($_POST['subject'] ?? $teacher['subject_specialty'] ?? 'Umum');
        $topic = trim($_POST['topic'] ?? '');
        $present_count = (int)($_POST['present_count'] ?? 0);
        $absent_count = (int)($_POST['absent_count'] ?? 0);
        $notes = trim($_POST['notes'] ?? '');

        try {
            // Validasi kelas milik sekolah yang sama
            $classCheck = $pdo->prepare("SELECT id FROM classes WHERE id = ? AND school_id = ?");
            $classCheck->execute([$class_id, $school_id]);
            if (!$classCheck->fetchColumn()) {
                throw new Exception('Kelas tidak valid untuk sekolah ini.');
            }

            $stmt = $pdo->prepare("
                INSERT INTO journals (school_id, teacher_user_id, class_id, date, time, subject, topic, present_count, absent_count, notes, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$school_id, $user['id'], $class_id, $date, $time, $subject, $topic, $present_count, $absent_count, $notes]);
            log_audit('CREATE_JOURNAL', 'journals', $pdo->lastInsertId(), "Created journal for class $class_id", $school_id);
            set_flash('success', 'Jurnal pembelajaran berhasil disimpan!');
            header("Location: jurnal.php");
            exit;
        } catch (Exception $e) {
            $error = 'Gagal menyimpan jurnal: ' . $e->getMessage();
        }
    }
}

// Fetch Classes
$classes = $pdo->prepare("SELECT * FROM classes WHERE school_id = ? ORDER BY grade, class_name");
$classes->execute([$school_id]);
$classes = $classes->fetchAll();

// Fetch My Journals
$myJournalsStmt = $pdo->prepare("
    SELECT j.*, c.class_name
    FROM journals j
    JOIN classes c ON j.class_id = c.id
    WHERE j.teacher_user_id = ? AND j.deleted_at IS NULL AND j.school_id = ?
    ORDER BY j.date DESC, j.created_at DESC
");
$myJournalsStmt->execute([$user['id'], $school_id]);
$my_journals = $myJournalsStmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-6xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Jurnal Pembelajaran Guru</h1>
                <p class="text-xs sm:text-sm text-slate-500">Catat agenda materi pembelajaran, capaian siswa, dan kehadiran per pertemuan.</p>
            </div>
            <button onclick="document.getElementById('form-jurnal-card').scrollIntoView({ behavior: 'smooth' })" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2">
                <i class="fa-solid fa-plus"></i>
                <span>Tulis Jurnal Hari Ini</span>
            </button>
        </div>

        <?php if (!empty($error)): ?>
            <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- Form Input Jurnal -->
        <div id="form-jurnal-card" class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 class="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <i class="fa-solid fa-pen-nib text-emerald-600"></i>
                <span>Formulir Jurnal Mengajar</span>
            </h3>

            <form method="POST" action="" class="space-y-4">
                <input type="hidden" name="action" value="save_journal">

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Kelas yang Diajar</label>
                        <select name="class_id" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                            <option value="">-- Pilih Kelas --</option>
                            <?php foreach ($classes as $c): ?>
                                <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['class_name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Tanggal</label>
                        <input type="date" name="date" value="<?= date('Y-m-d') ?>" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Jam Pelajaran / Waktu</label>
                        <input type="text" name="time" value="07:30 - 09:00" placeholder="Contoh: 07:30 - 09:00" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Mata Pelajaran</label>
                    <input type="text" name="subject" value="<?= htmlspecialchars($teacher['subject_specialty'] ?? 'Informatika') ?>" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Materi Pokok / Pembahasan Hari Ini</label>
                    <textarea name="topic" required rows="3" placeholder="Jelaskan pokok bahasan, kompetensi dasar, atau aktivitas praktik siswa..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Jumlah Siswa Hadir</label>
                        <input type="number" name="present_count" value="30" min="0" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Jumlah Tidak Hadir (Izin/Sakit/Alpha)</label>
                        <input type="number" name="absent_count" value="0" min="0" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Catatan Khusus / Kejadian di Kelas</label>
                    <textarea name="notes" rows="2" placeholder="Siswa antusias / tugas dikumpulkan tepat waktu / catatan remedial..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
                </div>

                <div class="flex justify-end pt-2">
                    <button type="submit" class="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition flex items-center gap-2">
                        <i class="fa-solid fa-floppy-disk"></i>
                        <span>Simpan Jurnal</span>
                    </button>
                </div>
            </form>
        </div>

        <!-- History of My Journals -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 class="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-slate-400"></i>
                <span>Riwayat Jurnal yang Pernah Anda Buat</span>
            </h3>

            <div class="space-y-3">
                <?php if (empty($my_journals)): ?>
                    <div class="text-center py-8 text-slate-400 text-xs">
                        Belum ada jurnal pembelajaran yang tersimpan.
                    </div>
                <?php else: ?>
                    <?php foreach ($my_journals as $mj): ?>
                        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-slate-800 text-sm"><?= htmlspecialchars($mj['subject']) ?> &bull; <?= htmlspecialchars($mj['class_name']) ?></span>
                                <span class="font-mono text-slate-500"><?= format_date_indo($mj['date'], true) ?> (<?= htmlspecialchars($mj['time'] ?: '-') ?>)</span>
                            </div>
                            <p class="text-slate-700 font-medium"><?= nl2br(htmlspecialchars($mj['topic'])) ?></p>
                            <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                                <span>Hadir: <strong class="text-emerald-700"><?= $mj['present_count'] ?></strong> | Tidak Hadir: <strong class="text-rose-700"><?= $mj['absent_count'] ?></strong></span>
                                <span>Dicatat: <?= date('d/m/Y H:i', strtotime($mj['created_at'])) ?></span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

    </div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>
