<?php
$flash = get_flash();
// $base_url already resolved by header.php
?>
    </div> <!-- End flex-1 flex overflow-hidden from header -->

    <!-- Mobile Bottom Navigation Bar -->
    <?php include __DIR__ . '/bottom_nav.php'; ?>

    <!-- Sidebar & Menu Controller Script -->
    <script>
        const desktopSidebarBtn = document.getElementById('desktop-sidebar-btn');
        const appSidebar = document.getElementById('app-sidebar');

        // Desktop: burger untuk hide/show sidebar (state tersimpan antar halaman)
        if (desktopSidebarBtn && appSidebar) {
            if (localStorage.getItem('ht-sidebar-collapsed') === '1') {
                appSidebar.classList.add('lg:hidden');
            }
            desktopSidebarBtn.addEventListener('click', () => {
                appSidebar.classList.toggle('lg:hidden');
                localStorage.setItem('ht-sidebar-collapsed', appSidebar.classList.contains('lg:hidden') ? '1' : '0');
            });
        }

        // Mobile: tombol "Menu" admin membuka bottom sheet ala iPhone
        const bottomMenuBtn = document.getElementById('bottom-menu-btn');
        const bottomMenuModal = document.getElementById('bottom-menu-modal');
        const bottomMenuSheet = document.getElementById('bottom-menu-sheet');
        const bottomMenuBackdrop = document.getElementById('bottom-menu-backdrop');
        const bottomMenuClose = document.getElementById('bottom-menu-close');

        function closeBottomMenu() {
            if (!bottomMenuSheet || !bottomMenuModal) return;
            bottomMenuSheet.classList.add('translate-y-full');
            setTimeout(() => bottomMenuModal.classList.add('hidden'), 300);
        }

        if (bottomMenuBtn && bottomMenuModal) {
            bottomMenuBtn.addEventListener('click', () => {
                if (bottomMenuModal.classList.contains('hidden')) {
                    bottomMenuModal.classList.remove('hidden');
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                        bottomMenuSheet.classList.remove('translate-y-full');
                    }));
                } else {
                    closeBottomMenu();
                }
            });
            if (bottomMenuBackdrop) {
                bottomMenuBackdrop.addEventListener('click', closeBottomMenu);
            }
            if (bottomMenuClose) {
                bottomMenuClose.addEventListener('click', closeBottomMenu);
            }
        }
    </script>

    <!-- Core App Script -->
    <script src="<?= $base_url ?>/assets/js/app.js"></script>

    <!-- PWA Service Worker Registration & Install Banner -->
    <div id="pwa-install-banner" class="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-xl z-50 hidden transition-all transform duration-300">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl flex-shrink-0">
                <i class="fa-solid fa-mobile-screen"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold text-white leading-tight">Pasang Aplikasi HadirTadz</h4>
                <p class="text-[11px] text-emerald-200 mt-0.5">Akses cepat & presensi tanpa browser</p>
            </div>
            <button id="pwa-install-btn" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow transition">
                Pasang
            </button>
            <button onclick="document.getElementById('pwa-install-banner').classList.add('hidden')" class="p-1 text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>
        </div>
    </div>

    <script>
        // Register PWA Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('<?= $base_url ?>/service-worker.js')
                    .then(reg => console.log('HadirTadz Service Worker Active:', reg.scope))
                    .catch(err => console.log('HadirTadz Service Worker Failed:', err));
            });
        }

        // PWA Install Prompt Event Listener
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const banner = document.getElementById('pwa-install-banner');
            if (banner) {
                banner.classList.remove('hidden');
            }
        });

        const pwaInstallBtn = document.getElementById('pwa-install-btn');
        if (pwaInstallBtn) {
            pwaInstallBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response to the install prompt: ${outcome}`);
                    deferredPrompt = null;
                    document.getElementById('pwa-install-banner').classList.add('hidden');
                }
            });
        }
    </script>

    <!-- Flash Message Toast Trigger -->
    <?php if ($flash): ?>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof showToast === 'function') {
                showToast(<?= json_encode($flash['message']) ?>, <?= json_encode($flash['type']) ?>);
            }
        });
    </script>
    <?php endif; ?>

</body>
</html>
