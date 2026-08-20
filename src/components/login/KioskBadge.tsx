'use client';

import React from 'react';
import Link from 'next/link';

export default function KioskBadge() {
  return (
    <div className="hidden lg:block absolute top-4 right-4 sm:top-6 sm:right-8 z-40 animate-fade-in">
      <Link
        href="/scan"
        title="Buka Mode Kiosk Pemindai Presensi (QR Code & Barcode)"
        aria-label="Buka Mode Kiosk Scanner"
        className="group inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/95 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-950 font-bold text-xs sm:text-sm border border-emerald-300/80 shadow-[0_4px_16px_-2px_rgba(16,185,129,0.25)] backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40"
      >
        {/* Live status pulse */}
        <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500" />
        </span>

        {/* QR Scanner Icon */}
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 group-hover:text-emerald-700 transition-transform group-hover:rotate-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>

        <span className="font-extrabold tracking-tight text-xs sm:text-sm">Mode Kiosk</span>

        <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-emerald-100/90 text-emerald-700 font-bold border border-emerald-200/80">
          Scan
        </span>
      </Link>
    </div>
  );
}
