'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchAPI } from '@/lib/api';
import { toastSuccess } from '@/components/ui/Toast';
import LoginBrandPanel from '@/components/login/LoginBrandPanel';
import LoginForm from '@/components/login/LoginForm';
import LoginRegisterCTA from '@/components/login/LoginRegisterCTA';
import LoginFooter from '@/components/login/LoginFooter';

interface School {
  id: number;
  school_code: string;
  npsn: string;
  name: string;
  level: string;
  logo_url?: string;
  address?: string;
  phone?: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [schools, setSchools] = useState<School[]>([]);

  const [selectedSchoolId, setSelectedSchoolId] = useState<number>(0);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  // Fetch registered schools from API
  useEffect(() => {
    async function loadSchools() {
      const res = await fetchAPI<School[]>('/api/schools', { silent: true });
      if (res.success && res.data && res.data.length > 0) {
        setSchools(res.data);
        setSelectedSchoolId(res.data[0].id);
      }
    }
    loadSchools();
  }, []);

  const currentSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0];

  const adminWhatsApp = (() => {
    const raw = currentSchool?.phone || '';
    let digits = raw.replace(/\D/g, '');
    if (!digits) return null;
    if (digits.startsWith('0')) digits = '62' + digits.slice(1);
    return digits;
  })();
  const waUrl =
    adminWhatsApp &&
    `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent('Assalamualaikum/Selamat pagi, saya lupa kata sandi akun HadirTadz. Mohon bantuan untuk me-reset kata sandi saya. Terima kasih.')}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!identifier.trim()) {
      setError('Email / Username wajib diisi.');
      return;
    }
    if (!password) {
      setError('Password wajib diisi.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          password,
          school_id: selectedSchoolId,
          remember,
        }),
      });

      if (response.success) {
        setSuccessMsg(response.message || 'Login berhasil! Mengalihkan...');
        toastSuccess(response.message || 'Login berhasil');
        const dest = response.redirectUrl || '/admin';
        setTimeout(() => {
          router.push(dest);
        }, 500);
      } else {
        setError(response.message || 'Gagal login. Periksa kembali ID dan Password Anda.');
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div
        id="main-content"
        className="min-h-[100dvh] lg:h-screen lg:overflow-hidden w-full relative bg-[#F6FCF8] text-slate-800 antialiased selection:bg-emerald-500 selection:text-white overflow-x-hidden"
      >
      {/* Top Left & Top Right Organic Background Shapes for Mobile View */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Mobile top-left mint fluid curve */}
        <div className="lg:hidden absolute -top-4 -left-4 w-44 h-44 pointer-events-none">
          <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-[#D4F6E5]">
            <path
              d="M0 0H160C160 85 90 165 0 185V0Z"
              fill="currentColor"
              fillOpacity="0.9"
            />
          </svg>
        </div>

        {/* Mobile top-right soft circle */}
        <div className="lg:hidden absolute top-8 right-8 w-11 h-11 rounded-full bg-[#D4F6E5] opacity-90" />

        {/* Desktop ambient lighting */}
        <div
          className="hidden lg:block absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D1FAE5 0%, transparent 70%)' }}
        />
        <div
          className="hidden lg:block absolute bottom-0 right-1/3 w-[30rem] h-[30rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #A7F3D0 0%, transparent 70%)' }}
        />
      </div>

      {/* Main Layout Grid */}
      <div className="min-h-[100dvh] lg:h-full lg:min-h-0 w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(400px,500px)] xl:grid-cols-[minmax(0,1.2fr)_minmax(440px,540px)] items-center relative z-10">
        {/* LEFT COLUMN: Desktop Brand Panel */}
        <LoginBrandPanel
          schoolLogoUrl={currentSchool?.logo_url}
          tagline="Disiplin hari ini, sukses nanti."
        />

        {/* RIGHT COLUMN: Form Section */}
        <section className="flex flex-col justify-between items-center px-4 py-6 sm:px-8 sm:py-8 lg:justify-center lg:h-full lg:min-h-0 lg:py-4 overflow-visible lg:overflow-hidden">
          <div className="w-full max-w-[390px] sm:max-w-[420px] xl:max-w-[450px] mx-auto lg:pt-0 flex flex-col">
            {/* Mobile-only Branding Header — Logo + Name */}
            <div className="lg:hidden flex flex-col items-center mb-5 animate-fade-in">
              {currentSchool?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentSchool.logo_url}
                  alt="Logo Sekolah"
                  className="h-16 w-auto object-contain drop-shadow-md"
                />
              ) : (
                <Image
                  src="/logo.png"
                  alt="Logo HadirTadz"
                  width={948}
                  height={996}
                  className="h-16 w-auto object-contain drop-shadow-md"
                  priority
                />
              )}
              <h1 className="mt-2 text-[26px] font-black tracking-tight text-emerald-950">
                Hadir<span className="text-emerald-600">Tadz</span>
              </h1>
            </div>

            {/* Login Card */}
            <LoginForm
              schools={schools}
              selectedSchoolId={selectedSchoolId}
              onSchoolChange={(id) => setSelectedSchoolId(id)}
              identifier={identifier}
              onIdentifierChange={setIdentifier}
              password={password}
              onPasswordChange={setPassword}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((v) => !v)}
              remember={remember}
              onRememberChange={setRemember}
              showForgot={showForgot}
              onToggleForgot={() => setShowForgot((v) => !v)}
              currentSchool={currentSchool}
              waUrl={waUrl}
              error={error}
              successMsg={successMsg}
              loading={loading}
              onSubmit={handleSubmit}
            >
              <LoginRegisterCTA />
            </LoginForm>

            {/* Footer */}
            <div className="mt-6 lg:mt-5 text-center mt-auto pt-4">
              <LoginFooter />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}