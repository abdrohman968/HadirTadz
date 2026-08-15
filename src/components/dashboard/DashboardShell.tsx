'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import MobileBottomNav, { bottomIcons } from './MobileBottomNav';
import NotificationBell from './NotificationBell';
import SessionWatcher from './SessionWatcher';
import ThemeToggle, { MobileThemeToggle } from '@/components/ui/ThemeToggle';
import GlobalSearch from './GlobalSearch';
import { fetchAPI } from '@/lib/api';
import { toastSuccess } from '@/components/ui/Toast';
import type { NavGroup } from '@/lib/nav';
import { nowClockWIB } from '@/lib/format';

interface DashboardShellProps {
  user: {
    full_name: string;
    identifier: string;
    role_code: string;
    role_name?: string;
    school_name?: string;
  };
  navGroups: NavGroup[];
  children: React.ReactNode;
}

function LiveClock() {
  const [now, setNow] = useState<string>('--:--:--');
  useEffect(() => {
    const update = () => setNow(nowClockWIB());
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hidden sm:flex items-center gap-2 bg-emerald-900/60 border border-emerald-700/50 px-3 py-1.5 rounded-lg text-emerald-100 font-mono text-xs font-semibold">
      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{now}</span>
    </div>
  );
}

function HeaderProfile({ user }: { user: DashboardShellProps['user'] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const initial = (user.full_name || 'U').charAt(0).toUpperCase();
  const firstName = (user.full_name || '').split(' ')[0];

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    const res = await fetchAPI('/api/auth/logout', { method: 'POST', silent: true });
    if (res.success) toastSuccess('Logout berhasil. Sampai jumpa!');
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Buka profil dan menu keluar"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-emerald-700/60 transition focus:outline-none"
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-600 border-2 border-emerald-300 flex items-center justify-center font-bold text-white shadow-sm text-xs">
          {initial}
        </div>
        <div className="hidden lg:block text-left">
          <div className="text-xs font-semibold leading-tight text-white">{firstName}</div>
          <div className="text-[10px] text-emerald-200 capitalize font-medium">{user.role_name || user.role_code}</div>
        </div>
        <svg className="w-3 h-3 text-emerald-200 hidden lg:block" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 text-slate-700">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Masuk sebagai:</p>
              <p className="text-sm font-bold text-slate-800 truncate">{user.full_name}</p>
              <p className="text-xs text-emerald-600 font-mono">{user.identifier}</p>
              {user.school_name && (
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.school_name}</p>
              )}
            </div>
            <div className="my-1 border-t border-slate-100"></div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2.5 px-4 py-2 w-full text-left text-sm text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{loggingOut ? 'Keluar...' : 'Keluar (Logout)'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardShell({ user, navGroups, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const flatItems = navGroups.flatMap((g) => g.items);
  const active =
    flatItems.find((item) => pathname === item.href)?.href ||
    flatItems.find((item) => pathname.startsWith(item.href + '/'))?.href ||
    flatItems[0]?.href;

  const role = user.role_code;
  const homeHref = role === 'admin' ? '/admin' : role === 'guru' ? '/guru' : '/siswa';
  const attendanceHref = role === 'admin' ? '/admin/attendance' : role === 'guru' ? '/guru/absen' : '/siswa/riwayat';

  // Tutup drawer mobile saat berpindah halaman.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Tutup drawer dengan tombol Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Bottom Nav mobile: maks 5 menu; admin memakai 4 + "Lainnya" (buka popup semua menu).
  const bottomItems = (() => {
    if (role === 'siswa') {
      return [
        { href: '/siswa', label: 'Beranda', icon: bottomIcons.home },
        { href: '/siswa/kartu', label: 'Kartu', icon: bottomIcons.card },
        { href: '/siswa/absen', label: 'Absen', icon: bottomIcons.camera },
        { href: '/siswa/izin', label: 'Izin', icon: bottomIcons.envelope },
        { href: '/siswa/riwayat', label: 'Riwayat', icon: bottomIcons.history },
      ];
    }
    if (role === 'guru') {
      return [
        { href: '/guru', label: 'Beranda', icon: bottomIcons.home },
        { href: '/guru/absen', label: 'Absen', icon: bottomIcons.camera },
        { href: '/guru/kelas', label: 'Kelas', icon: bottomIcons.clipboard },
        { href: '/guru/jurnal', label: 'Jurnal', icon: bottomIcons.book },
        { href: '/guru/riwayat', label: 'Riwayat', icon: bottomIcons.history },
      ];
    }
    return [
      { href: '/admin', label: 'Beranda', icon: bottomIcons.home },
      { href: '/admin/attendance', label: 'Presensi', icon: bottomIcons.clipboard },
      { href: '/admin/students', label: 'Data', icon: bottomIcons.grid },
      { href: '/admin/permissions', label: 'Izin', icon: bottomIcons.envelope },
      { more: true, label: 'Lainnya', icon: bottomIcons.grid },
    ];
  })();

  // Tutup drawer mobile; pada desktop toggle collapse sidebar.
  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setCollapsed((v) => !v);
    } else {
      setDrawerOpen(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Navigation Bar */}
      <header className="no-print flex-shrink-0 z-40 bg-emerald-700 text-white shadow-md border-b border-emerald-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Bagian kiri: Logo & Judul + Toggle sidebar */}
            <div className="flex items-center gap-2.5 lg:gap-3 min-w-0">
              <Link href={homeHref} className="flex items-center gap-2.5 group shrink-0" aria-label="Beranda HadirTadz">
                <Image
                  src="/logo.png"
                  alt="Logo HadirTadz"
                  width={948}
                  height={996}
                  className="h-8 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
                  priority
                />
                <div className="hidden sm:block">
                  <div className="font-extrabold text-base tracking-tight text-white leading-tight flex items-center gap-1">
                    <span>Hadir</span>
                    <span className="text-emerald-200">Tadz</span>
                  </div>
                  <div className="text-[10px] text-emerald-100 font-medium truncate max-w-[160px]">
                    {user.school_name || 'SMA Terpadu Al-Mu\'min'}
                  </div>
                </div>
              </Link>

              {/* Toggle/hamburger: menciutkan sidebar (desktop) / membuka drawer (mobile) */}
              <button
                onClick={toggleSidebar}
                type="button"
                aria-label="Buka atau tutup menu samping"
                aria-expanded={!collapsed}
                title="Buat/Tampilkan Sidebar"
                className="p-2 rounded-lg text-emerald-100 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
              >
                <span className="lg:hidden">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </span>
                <span className="hidden lg:inline-flex">
                  {collapsed ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7m4 0h.01" />
                    </svg>
                  )}
                </span>
              </button>
            </div>

            {/* Bagian tengah: Server Time + Search Bar global */}
            <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl justify-center mx-2 min-w-0">
              <LiveClock />
              {role === 'admin' || role === 'guru' ? <GlobalSearch /> : null}
            </div>

            {/* Bagian kanan: Lonceng, pintasan, & Profil */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
              <NotificationBell href={attendanceHref} />
              <Link
                href="/scan"
                target="_blank"
                className="hidden xl:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <svg className="w-4 h-4 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>Kiosk Gerbang</span>
              </Link>
              <ThemeToggle />
              <MobileThemeToggle />
              <HeaderProfile user={user} />
            </div>
          </div>
        </div>
      </header>

      {/* App Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Backdrop drawer (mobile) */}
        {drawerOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar: statis di kiri (desktop) + drawer (mobile) */}
        <aside
          id="app-sidebar"
          className={`no-print fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 dark:border-slate-800 border-r border-slate-200
            w-64 shrink-0
            transform transition-transform duration-300 ease-in-out
            ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:transform-none lg:transition-[width] lg:static
            ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
        >
          {/* Header sidebar: brand + tutup (hanya drawer mobile) */}
          <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Image
                src="/logo.png"
                alt="Logo HadirTadz"
                width={948}
                height={996}
                className="h-8 w-auto object-contain shrink-0"
              />
              <div className="min-w-0">
                <div className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white leading-tight flex items-center gap-1">
                  <span>Hadir</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Tadz</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">
                  {user.school_name || 'SMA Terpadu Al-Mu\'min'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setDrawerOpen(false)}
              type="button"
              aria-label="Tutup menu samping"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Navigasi */}
          <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p
                  className={`px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ${
                    collapsed ? 'lg:sr-only' : ''
                  }`}
                >
                  {group.title}
                </p>
                <nav className="space-y-1" aria-label={group.title} role="list">
                  {group.items.map((item) => {
                    const isActive = item.href === active;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        title={collapsed ? item.label : undefined}
                        className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition w-full ${
                          isActive
                            ? 'bg-emerald-700 text-white shadow-sm font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium'
                        } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                      >
                        <span
                          className={`text-base w-5 text-center shrink-0 ${
                            isActive ? 'text-emerald-200' : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-600'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className={`${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Versi aplikasi */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <div className="flex items-center justify-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Logo HadirTadz"
                width={948}
                height={996}
                className={`h-7 w-auto object-contain shrink-0 ${collapsed ? 'lg:hidden' : ''}`}
              />
              <div className={`leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">HadirTadz</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">v.1.0</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>

        {/* Bottom Nav mobile */}
        <MobileBottomNav items={bottomItems} moreGroups={navGroups} />
      </div>

      {/* Idle session timeout */}
      <SessionWatcher />
    </div>
  );
}