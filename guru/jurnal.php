<?php
$page_title = 'Jurnal Pembelajaran';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['guru']);
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

// Build class options for ds_select
$class_options = ['' => '-- Pilih Kelas --'];
foreach ($classes as $c) {
    $class_options[$c['id']] = $c['class_name'];
}

// Pagination
$page = max(1, (int)($_GET['page'] ?? 1));
$per_page = 10;
$offset = ($page - 1) * $per_page;

// Count total
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM journals WHERE teacher_user_id = ? AND deleted_at IS NULL AND school_id = ?");
$countStmt->execute([$user['id'], $school_id]);
$total = (int)$countStmt->fetchColumn();
$total_pages = max(1, (int)ceil($total / $per_page));
if ($page > $total_pages) $page = $total_pages;

// Fetch My Journals (paginated)
$myJournalsStmt = $pdo->prepare("
    SELECT j.*, c.class_name
    FROM journals j
    JOIN classes c ON j.class_id = c.id
    WHERE j.teacher_user_id = ? AND j.deleted_at IS NULL AND j.school_id = ?
    ORDER BY j.date DESC, j.created_at DESC
    LIMIT $per_page OFFSET $offset
");
$myJournalsStmt->execute([$user['id'], $school_id]);
$my_journals = $myJournalsStmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-6xl mx-auto space-y-6">

        <?= ds_page_header(
            'Jurnal Pembelajaran Guru',
            'Catat agenda materi pembelajaran, capaian siswa, dan kehadiran per pertemuan.',
            '<button onclick="document.getElementById(\'form-jurnal-card\').scrollIntoView({ behavior: \'smooth\' })" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2"><i class="fa-solid fa-plus"></i> Tulis Jurnal Hari Ini</button>'
        ) ?>

        <?php if (!empty($error)): ?>
            <?= ds_alert(htmlspecialchars($error), 'danger') ?>
        <?php endif; ?>

        <?php if ($flash = get_flash()): ?>
            <?= ds_alert(htmlspecialchars($flash['message']), $flash['type']) ?>
        <?php endif; ?>

        <?= ds_card_start('Formulir Jurnal Mengajar', 'fa-solid fa-pen-nib', ['id' => 'form-jurnal-card']) ?>
            <form method="POST" action="" class="space-y-4">
                <input type="hidden" name="action" value="save_journal">

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <?= ds_select('class_id', $class_options, '', 'Kelas yang Diajar', ['required' => true, 'id' => 'field-jurnal-class']) ?>
                    <?= ds_input('date', 'Tanggal', 'date', date('Y-m-d'), ['required' => true, 'id' => 'field-jurnal-date']) ?>
                    <?= ds_input('time', 'Jam Pelajaran / Waktu', 'text', '07:30 - 09:00', ['placeholder' => 'Contoh: 07:30 - 09:00', 'id' => 'field-jurnal-time']) ?>
                </div>

                <?= ds_input('subject', 'Mata Pelajaran', 'text', $teacher['subject_specialty'] ?? 'Informatika', ['required' => true, 'id' => 'field-jurnal-subject']) ?>

                <?= ds_textarea('topic', 'Materi Pokok / Pembahasan Hari Ini', '', ['required' => true, 'rows' => 3, 'placeholder' => 'Jelaskan pokok bahasan, kompetensi dasar, atau aktivitas praktik siswa...', 'id' => 'field-jurnal-topic']) ?>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <?= ds_input('present_count', 'Jumlah Siswa Hadir', 'number', '30', ['min' => '0', 'class' => 'font-mono', 'id' => 'field-jurnal-present']) ?>
                    <?= ds_input('absent_count', 'Jumlah Tidak Hadir (Izin/Sakit/Alpha)', 'number', '0', ['min' => '0', 'class' => 'font-mono', 'id' => 'field-jurnal-absent']) ?>
                </div>

                <?= ds_textarea('notes', 'Catatan Khusus / Kejadian di Kelas', '', ['rows' => 2, 'placeholder' => 'Siswa antusias / tugas dikumpulkan tepat waktu / catatan remedial...', 'id' => 'field-jurnal-notes']) ?>

                <div class="flex justify-end pt-2">
                    <?= ds_button('<i class="fa-solid fa-floppy-disk"></i> Simpan Jurnal', 'primary', 'submit') ?>
                </div>
            </form>
        <?= ds_card_end() ?>

        <?= ds_card_start('Riwayat Jurnal yang Pernah Anda Buat', 'fa-solid fa-clock-rotate-left') ?>
            <div class="space-y-3">
                <?php if (empty($my_journals)): ?>
                    <div class="text-center py-8 text-slate-500 text-xs">
                        <?php if ($total > 0): ?>
                            Tidak ada data di halaman ini.
                        <?php else: ?>
                            Belum ada jurnal pembelajaran yang tersimpan.
                        <?php endif; ?>
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
                                <span>Hadir: <strong class="text-emerald-700"><?= (int)$mj['present_count'] ?></strong> | Tidak Hadir: <strong class="text-rose-700"><?= (int)$mj['absent_count'] ?></strong></span>
                                <span>Dicatat: <?= date('d/m/Y H:i', strtotime($mj['created_at'])) ?></span>
                            </div>
                        </div>
                    <?php endforeach; ?>

                    <?php if ($total_pages > 1): ?>
                        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                            <span class="text-[11px] text-slate-500">Hal <?= $page ?> dari <?= $total_pages ?> (<?= $total ?> data)</span>
                            <div class="flex items-center gap-1">
                                <?php if ($page > 1): ?>
                                    <a href="?page=<?= $page - 1 ?>" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition">
                                        <i class="fa-solid fa-chevron-left text-[10px]"></i>
                                    </a>
                                <?php endif; ?>
                                <?php
                                $start_p = max(1, $page - 2);
                                $end_p = min($total_pages, $page + 2);
                                if ($start_p > 1): ?>
                                    <a href="?page=1" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition">1</a>
                                    <?php if ($start_p > 2): ?><span class="text-slate-400 text-xs">...</span><?php endif; ?>
                                <?php endif; ?>
                                <?php for ($p = $start_p; $p <= $end_p; $p++): ?>
                                    <a href="?page=<?= $p ?>" class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition <?= $p === $page ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600' ?>"><?= $p ?></a>
                                <?php endfor;
                                if ($end_p < $total_pages): ?>
                                    <?php if ($end_p < $total_pages - 1): ?><span class="text-slate-400 text-xs">...</span><?php endif; ?>
                                    <a href="?page=<?= $total_pages ?>" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition"><?= $total_pages ?></a>
                                <?php endif; ?>
                                <?php if ($page < $total_pages): ?>
                                    <a href="?page=<?= $page + 1 ?>" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition">
                                        <i class="fa-solid fa-chevron-right text-[10px]"></i>
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        <?= ds_card_end() ?>

    </div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>
