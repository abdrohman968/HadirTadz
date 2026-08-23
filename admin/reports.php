<?php
$page_title = 'Rekapitulasi Laporan Kehadiran';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$school_id = auth_school_id();

$start_date = $_GET['start_date'] ?? date('Y-m-01');
$end_date = $_GET['end_date'] ?? date('Y-m-d');
$filter_class = $_GET['class_id'] ?? '';
$filter_role = $_GET['role_code'] ?? '';
$format = $_GET['format'] ?? '';

// Handle CSV / Excel Export
if ($format === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=Rekap_Absensi_' . $start_date . '_sd_' . $end_date . '.csv');
    $output = fopen('php://output', 'w');
    fputcsv($output, ['No', 'Tanggal', 'ID/NISN', 'Nama Lengkap', 'Peran/Kelas', 'Jam Masuk', 'Jam Pulang', 'Status', 'Metode', 'Keterangan']);

    $sql = "
        SELECT a.*, u.full_name, u.identifier, r.role_name, c.class_name
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN classes c ON a.class_id = c.id
        WHERE a.date BETWEEN :start AND :end AND a.school_id = :school_id
    ";
    $params = [':start' => $start_date, ':end' => $end_date, ':school_id' => $school_id];
    if (!empty($filter_class)) {
        $sql .= " AND a.class_id = :class_id";
        $params[':class_id'] = $filter_class;
    }
    if (!empty($filter_role)) {
        $sql .= " AND r.role_code = :role_code";
        $params[':role_code'] = $filter_role;
    }
    $sql .= " ORDER BY a.date DESC, c.class_name, u.full_name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $no = 1;
    while ($row = $stmt->fetch()) {
        fputcsv($output, [
            $no++,
            $row['date'],
            $row['identifier'],
            $row['full_name'],
            $row['class_name'] ?? $row['role_name'],
            $row['time_in'] ?: '-',
            $row['time_out'] ?: '-',
            $row['status'],
            $row['method'],
            $row['notes'] ?: '-'
        ]);
    }
    fclose($output);
    exit;
}

// Fetch Classes
$classesStmt = $pdo->prepare("SELECT * FROM classes WHERE school_id = ? ORDER BY grade, class_name");
$classesStmt->execute([$school_id]);
$classes = $classesStmt->fetchAll();

// Main Query for Page View
$sql = "
    SELECT a.*, u.full_name, u.identifier, r.role_name, c.class_name
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE a.date BETWEEN :start AND :end AND a.school_id = :school_id
";
$params = [':start' => $start_date, ':end' => $end_date, ':school_id' => $school_id];
if (!empty($filter_class)) {
    $sql .= " AND a.class_id = :class_id";
    $params[':class_id'] = $filter_class;
}
if (!empty($filter_role)) {
    $sql .= " AND r.role_code = :role_code";
    $params[':role_code'] = $filter_role;
}
$sql .= " ORDER BY a.date DESC, c.class_name, u.full_name";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$records = $stmt->fetchAll();

// Calculate Summary Totals
$totals = ['HADIR' => 0, 'TERLAMBAT' => 0, 'IZIN' => 0, 'SAKIT' => 0, 'ALPHA' => 0];
foreach ($records as $r) {
    if (isset($totals[$r['status']])) {
        $totals[$r['status']]++;
    }
}

$school_name = get_setting('schoolName', 'SMA Negeri Harapan Bangsa');
$school_address = get_setting('address', 'Bandung');

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <?= ds_page_header('Rekapitulasi Laporan Kehadiran', 'Filter, cetak laporan resmi, dan ekspor data presensi ke format Excel/CSV.', ds_button('<i class="fa-solid fa-print"></i> <span>Cetak Laporan</span>', 'secondary', 'button', ['onclick' => 'window.print()']) . '<a href="reports.php?start_date=' . urlencode($start_date) . '&end_date=' . urlencode($end_date) . '&class_id=' . urlencode($filter_class) . '&role_code=' . urlencode($filter_role) . '&format=csv" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2"><i class="fa-solid fa-file-excel"></i><span>Ekspor CSV</span></a>') ?>

        <!-- Filter Bar (Hidden on Print) -->
        <div class="no-print bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <form method="GET" action="" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <?= ds_input('Dari Tanggal', 'date', [
                    'name' => 'start_date',
                    'value' => $start_date
                ]) ?>

                <?= ds_input('Sampai Tanggal', 'date', [
                    'name' => 'end_date',
                    'value' => $end_date
                ]) ?>

                <?= ds_select('Kelas', array_merge(['' => '-- Semua Kelas --'], array_combine(
                    array_column($classes, 'id'),
                    array_column($classes, 'class_name')
                )), $filter_class, '', ['name' => 'class_id']) ?>

                <?= ds_select('Peran', [
                    '' => '-- Semua Peran --',
                    'siswa' => 'Siswa',
                    'guru' => 'Guru'
                ], $filter_role, '', ['name' => 'role_code']) ?>

                <div class="flex gap-2">
                    <?= ds_button('Tampilkan', 'secondary', 'submit', ['class' => 'flex-1']) ?>
                    <a href="reports.php" class="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition" title="Reset">
                        <i class="fa-solid fa-rotate-left"></i>
                    </a>
                </div>
            </form>
        </div>

        <!-- Summary Totals -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
            <div class="bg-emerald-50 border border-emerald-200 p-3 sm:p-3.5 rounded-2xl text-center">
                <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight leading-tight text-emerald-600 block">Hadir Tepat Waktu</span>
                <p class="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-1"><?= $totals['HADIR'] ?></p>
            </div>
            <div class="bg-amber-50 border border-amber-200 p-3 sm:p-3.5 rounded-2xl text-center">
                <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight leading-tight text-amber-600 block">Terlambat</span>
                <p class="text-xl sm:text-2xl font-extrabold text-amber-800 mt-1"><?= $totals['TERLAMBAT'] ?></p>
            </div>
            <div class="bg-blue-50 border border-blue-200 p-3 sm:p-3.5 rounded-2xl text-center">
                <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight leading-tight text-blue-600 block">Izin</span>
                <p class="text-xl sm:text-2xl font-extrabold text-blue-800 mt-1"><?= $totals['IZIN'] ?></p>
            </div>
            <div class="bg-purple-50 border border-purple-200 p-3 sm:p-3.5 rounded-2xl text-center">
                <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight leading-tight text-purple-600 block">Sakit</span>
                <p class="text-xl sm:text-2xl font-extrabold text-purple-800 mt-1"><?= $totals['SAKIT'] ?></p>
            </div>
            <div class="bg-rose-50 border border-rose-200 p-3 sm:p-3.5 rounded-2xl text-center col-span-2 sm:col-span-1">
                <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight leading-tight text-rose-600 block">Alpha</span>
                <p class="text-xl sm:text-2xl font-extrabold text-rose-800 mt-1"><?= $totals['ALPHA'] ?></p>
            </div>
        </div>

        <!-- Report Printable Sheet -->
        <div class="print-page bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <!-- Kop Surat Resmi (Visible on Print and Screen) -->
            <div class="border-b-2 border-slate-800 pb-4 mb-6 text-center">
                <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-tight"><?= htmlspecialchars($school_name) ?></h2>
                <p class="text-xs text-slate-600 mt-1"><?= htmlspecialchars($school_address) ?></p>
                <div class="mt-3 py-1 bg-slate-100 rounded-lg inline-block px-6">
                    <h3 class="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                        LAPORAN REKAPITULASI PRESENSI KEHADIRAN
                    </h3>
                    <p class="text-[11px] text-slate-500">
                        Periode: <?= format_date_indo($start_date, false) ?> s/d <?= format_date_indo($end_date, false) ?>
                    </p>
                </div>
            </div>

            <!-- Table -->
            <div class="table-responsive-card print-table">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border border-slate-300">
                            <th class="py-2.5 px-3 border border-slate-300 text-center w-10">No</th>
                            <th class="py-2.5 px-3 border border-slate-300">Tanggal</th>
                            <th class="py-2.5 px-3 border border-slate-300">ID / NISN</th>
                            <th class="py-2.5 px-3 border border-slate-300">Nama Lengkap</th>
                            <th class="py-2.5 px-3 border border-slate-300">Kelas / Peran</th>
                            <th class="py-2.5 px-3 border border-slate-300 text-center">Masuk</th>
                            <th class="py-2.5 px-3 border border-slate-300 text-center">Pulang</th>
                            <th class="py-2.5 px-3 border border-slate-300 text-center">Status</th>
                            <th class="py-2.5 px-3 border border-slate-300">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($records)): ?>
                            <tr>
                                <td colspan="9" class="text-center py-8 text-slate-500 border border-slate-300" data-label="">
                                    Tidak ada data presensi pada rentang waktu ini.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php $no = 1; foreach ($records as $item): ?>
                                <tr class="hover:bg-slate-50">
                                    <td class="py-2 px-3 border border-slate-300 text-center font-mono" data-label="No"><?= $no++ ?></td>
                                    <td class="py-2 px-3 border border-slate-300 font-mono text-[11px] whitespace-nowrap" data-label="Tanggal"><?= date('d/m/Y', strtotime($item['date'])) ?></td>
                                    <td class="py-2 px-3 border border-slate-300 font-mono font-bold text-slate-700" data-label="ID / NISN"><?= htmlspecialchars($item['identifier']) ?></td>
                                    <td class="py-2 px-3 border border-slate-300 font-bold text-slate-800" data-label="Nama Lengkap"><?= htmlspecialchars($item['full_name']) ?></td>
                                    <td class="py-2 px-3 border border-slate-300 text-slate-600" data-label="Kelas / Peran"><?= htmlspecialchars($item['class_name'] ?? $item['role_name']) ?></td>
                                    <td class="py-2 px-3 border border-slate-300 text-center font-mono font-bold text-emerald-700" data-label="Masuk"><?= format_time($item['time_in']) ?></td>
                                    <td class="py-2 px-3 border border-slate-300 text-center font-mono font-bold text-slate-700" data-label="Pulang"><?= format_time($item['time_out']) ?></td>
                                    <td class="py-2 px-3 border border-slate-300 text-center font-bold" data-label="Status">
                                        <?= htmlspecialchars($item['status']) ?>
                                    </td>
                                    <td class="py-2 px-3 border border-slate-300 text-slate-500 text-[11px]" data-label="Keterangan"><?= htmlspecialchars($item['notes'] ?: '-') ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

            <!-- Signature block for official printing -->
            <div class="mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-10 sm:gap-6 text-xs text-slate-700">
                <div class="text-center">
                    <p>Mengetahui,</p>
                    <p class="font-bold mt-1">Kepala Sekolah</p>
                    <div class="h-20"></div>
                    <p class="font-bold underline">Drs. H. Ahmad Fauzi, M.M.</p>
                    <p class="text-[10px] text-slate-500">NIP. 196805121995121001</p>
                </div>
                <div class="text-center">
                    <p><?= htmlspecialchars(explode(',', $school_address)[count(explode(',', $school_address))-1] ?? 'Bandung') ?>, <?= format_date_indo(date('Y-m-d'), false) ?></p>
                    <p class="font-bold mt-1">Petugas / Operator Presensi</p>
                    <div class="h-20"></div>
                    <p class="font-bold underline"><?= htmlspecialchars($current_user['full_name']) ?></p>
                    <p class="text-[10px] text-slate-500">NIP/ID. <?= htmlspecialchars($current_user['identifier']) ?></p>
                </div>
            </div>
        </div>

    </div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>
