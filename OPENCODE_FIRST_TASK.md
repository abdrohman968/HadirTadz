# HADIR-TADZ — OPENCODE FIRST TASK

Buka dan pahami:

```text
docs/PROJECT_BASELINE.md
docs/OPENCODE_MASTER_SYNC_PROMPT.md
docs/DEVELOPMENT_RULES.md
docs/README.md
```

Lalu kerjakan **AUDIT + STABILIZATION**, bukan redesign UI.

Urutan:

1. Audit tenant isolation semua query yang mengakses data sekolah.
2. Fokuskan perbaikan awal pada `admin/rules.php`, `api/checkin_self.php`, `api/scan_process.php` dan jalur attendance lainnya.
3. Audit `attendance_rules` vs `school_settings` dan tetapkan source of truth yang konsisten.
4. Audit auth/session dan school context.
5. Audit duplicate route, component, helper, query, dan data.
6. Audit error: undefined variable/index/function, SQL error, broken include/route, empty response, invalid JSON, debug leakage.
7. Jangan ubah UI login/signup dulu kecuali perubahan minimal diperlukan agar flow tetap berjalan.
8. Jangan membuat dummy data.
9. Jangan menghapus code/file sebelum search reference.
10. Setelah audit, buat/update:

```text
docs/BUG_INVENTORY.md
docs/DATA_INTEGRITY_AUDIT.md
docs/TENANT_ISOLATION_AUDIT.md
docs/IMPLEMENTATION_ROADMAP.md
```

11. Jalankan syntax check seluruh PHP dan test yang tersedia.
12. Berikan laporan files changed, bug fixed, tests, dan remaining risks.

**Target akhir task pertama:** project lebih stabil dan lebih aman tanpa rewrite besar.
