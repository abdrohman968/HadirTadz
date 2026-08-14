<?php
$flash = get_flash();
$base_url = get_base_url();
?>
    </div> <!-- End flex-1 flex overflow-hidden from header -->

    <!-- Mobile Bottom Navigation Bar -->
    <?php include __DIR__ . '/bottom_nav.php'; ?>

    <!-- Mobile Sidebar Controller Script -->
    <script>
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const appSidebar = document.getElementById('app-sidebar');
        const mobileSidebarBackdrop = document.getElementById('mobile-sidebar-backdrop');

        if (mobileMenuBtn && appSidebar && mobileSidebarBackdrop) {
            mobileMenuBtn.addEventListener('click', () => {
                appSidebar.classList.toggle('-translate-x-full');
                mobileSidebarBackdrop.classList.toggle('hidden');
            });

            mobileSidebarBackdrop.addEventListener('click', () => {
                appSidebar.classList.add('-translate-x-full');
                mobileSidebarBackdrop.classList.add('hidden');
            });
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
