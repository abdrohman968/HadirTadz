import React from 'react';

export default function SchoolIllustration({ className = 'w-full max-w-[400px]' }: { className?: string }) {
  return (
    <div className={`mx-auto ${className} pointer-events-none select-none`} aria-hidden="true">
      <svg
        viewBox="0 0 500 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm"
      >
        <defs>
          <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6F4EA" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ECFDF5" />
            <stop offset="100%" stopColor="#D1FAE5" />
          </linearGradient>
          <linearGradient id="hillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D1FAE5" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Soft Background Hills & Clouds */}
        <path
          d="M0 240C60 215 140 210 250 210C360 210 440 215 500 240H0Z"
          fill="url(#hillGrad)"
        />
        <path
          d="M40 180C70 150 120 160 150 185H40Z"
          fill="#D1FAE5"
          fillOpacity="0.4"
        />
        <path
          d="M350 185C380 160 430 150 460 180H350Z"
          fill="#D1FAE5"
          fillOpacity="0.4"
        />

        {/* Trees Left */}
        <g id="trees-left">
          {/* Back Tree */}
          <circle cx="85" cy="180" r="32" fill="#6EE7B7" fillOpacity="0.7" />
          <rect x="82" y="180" width="6" height="40" rx="3" fill="#047857" />

          {/* Front Tree Left */}
          <ellipse cx="145" cy="185" r="24" fill="#86EFAC" />
          <rect x="142" y="190" width="5" height="30" rx="2.5" fill="#059669" />
          <path d="M145 168V195M145 178L139 173M145 183L151 178" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />

          {/* Small Bush */}
          <ellipse cx="115" cy="205" rx="18" ry="12" fill="#34D399" />
          <ellipse cx="55" cy="208" rx="14" ry="9" fill="#10B981" />
        </g>

        {/* Trees Right */}
        <g id="trees-right">
          {/* Back Tree */}
          <circle cx="415" cy="180" r="32" fill="#6EE7B7" fillOpacity="0.7" />
          <rect x="412" y="180" width="6" height="40" rx="3" fill="#047857" />

          {/* Front Tree Right */}
          <ellipse cx="355" cy="185" r="24" fill="#86EFAC" />
          <rect x="352" y="190" width="5" height="30" rx="2.5" fill="#059669" />
          <path d="M355 168V195M355 178L349 173M355 183L361 178" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />

          {/* Small Bush */}
          <ellipse cx="385" cy="205" rx="18" ry="12" fill="#34D399" />
          <ellipse cx="445" cy="208" rx="14" ry="9" fill="#10B981" />
        </g>

        {/* MAIN SCHOOL BUILDING */}
        <g id="school-building">
          {/* Building Base Shadows */}
          <rect x="160" y="145" width="180" height="75" rx="4" fill="#A7F3D0" />

          {/* Left Wing */}
          <rect x="165" y="148" width="55" height="70" rx="2" fill="url(#wallGrad)" stroke="#10B981" strokeWidth="1.5" />
          {/* Left Wing Roof */}
          <path d="M162 148H223L220 140H165L162 148Z" fill="url(#roofGrad)" />
          {/* Left Wing Windows */}
          <rect x="172" y="156" width="16" height="20" rx="2" fill="#FFFFFF" stroke="#34D399" strokeWidth="1.5" />
          <line x1="180" y1="156" x2="180" y2="176" stroke="#34D399" strokeWidth="1" />
          <line x1="172" y1="166" x2="188" y2="166" stroke="#34D399" strokeWidth="1" />

          <rect x="195" y="156" width="16" height="20" rx="2" fill="#FFFFFF" stroke="#34D399" strokeWidth="1.5" />
          <line x1="203" y1="156" x2="203" y2="176" stroke="#34D399" strokeWidth="1" />
          <line x1="195" y1="166" x2="211" y2="166" stroke="#34D399" strokeWidth="1" />

          <rect x="172" y="184" width="16" height="20" rx="2" fill="#FFFFFF" stroke="#34D399" strokeWidth="1.5" />
          <line x1="180" y1="184" x2="180" y2="204" stroke="#34D399" strokeWidth="1" />
          <line x1="172" y1="194" x2="188" y2="194" stroke="#34D399" strokeWidth="1" />

          <rect x="195" y="184" width="16" height="20" rx="2" fill="#FFFFFF" stroke="#34D399" strokeWidth="1.5" />
          <line x1="203" y1="184" x2="203" y2="204" stroke="#34D399" strokeWidth="1" />
          <line x1="195" y1="194" x2="211" y2="194" stroke="#34D399" strokeWidth="1" />

          {/* Right Wing */}
          <rect x="280" y="148" width="55" height="70" rx="2" fill="url(#wallGrad)" stroke="#10B981" strokeWidth="1.5" />
          {/* Right Wing Roof */}
          <path d="M277 148H338L335 140H280L277 148Z" fill="url(#roofGrad)" />
          {/* Right Wing Windows */}
          <rect x="289" y="156" width="16" height="20" rx="2" fill="#FFFFFF" stroke="#34D399" strokeWidth="1.5" />
          <line x1="297" y1="156" x2="297" y2="176" stroke="#34D399" strokeWidth="1" />
          <line x1="289" y1="166" x2="305" y2="166" stroke="#34D399" strokeWidth="1" />

          <rect x="312" y="156" width="16" height="20" rx="2" fill="#FFFFFF" stroke="#34D399" strokeWidth="1.5" />
          <line x1="320" y1="156" x2="320" y2="176" stroke="#34D399" strokeWidth="1" />
          <line x1="312" y1="166" x2="328" y2="166" stroke="#34D399" strokeWidth="1" />

          <rect x="289" y="184" width="16" height="20" rx="2" fill="#FFFFFF" stroke="#34D399" strokeWidth="1.5" />
          <line x1="297" y1="184" x2="297" y2="204" stroke="#34D399" strokeWidth="1" />
          <line x1="289" y1="194" x2="305" y2="194" stroke="#34D399" strokeWidth="1" />

          <rect x="312" y="184" width="16" height="20" rx="2" fill="#FFFFFF" stroke="#34D399" strokeWidth="1.5" />
          <line x1="320" y1="184" x2="320" y2="204" stroke="#34D399" strokeWidth="1" />
          <line x1="312" y1="194" x2="328" y2="194" stroke="#34D399" strokeWidth="1" />

          {/* Center Main Block */}
          <rect x="212" y="125" width="76" height="93" fill="#FFFFFF" stroke="#059669" strokeWidth="1.5" />

          {/* Center Gable Roof Triangle */}
          <path d="M210 126L250 88L290 126H210Z" fill="url(#roofGrad)" stroke="#047857" strokeWidth="1.5" />

          {/* Clock Tower / Cupola */}
          <rect x="236" y="65" width="28" height="26" fill="#FFFFFF" stroke="#059669" strokeWidth="1.5" />
          {/* Clock Tower Roof */}
          <path d="M232 66L250 46L268 66H232Z" fill="url(#roofGrad)" />
          {/* Flagpole & Flag */}
          <line x1="250" y1="46" x2="250" y2="30" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
          <path d="M250 30L266 36L250 42V30Z" fill="#10B981" />

          {/* Clock Dial */}
          <circle cx="250" cy="78" r="8" fill="#FFFFFF" stroke="#047857" strokeWidth="1.5" />
          <line x1="250" y1="78" x2="250" y2="73" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="250" y1="78" x2="254" y2="78" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />

          {/* School Main Entrance Door */}
          <rect x="238" y="178" width="24" height="40" rx="3" fill="#059669" />
          <rect x="240" y="180" width="9.5" height="38" rx="2" fill="#047857" />
          <rect x="250.5" y="180" width="9.5" height="38" rx="2" fill="#047857" />
          <circle cx="247" cy="200" r="1.5" fill="#FDE047" />
          <circle cx="253" cy="200" r="1.5" fill="#FDE047" />

          {/* Entrance Stairs */}
          <rect x="232" y="218" width="36" height="4" rx="2" fill="#A7F3D0" />
          <rect x="228" y="222" width="44" height="4" rx="2" fill="#6EE7B7" />

          {/* Columns */}
          <rect x="220" y="138" width="6" height="78" rx="2" fill="#E6F4EA" stroke="#10B981" strokeWidth="1" />
          <rect x="274" y="138" width="6" height="78" rx="2" fill="#E6F4EA" stroke="#10B981" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
