'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchAPI } from '@/lib/api';
import SignupBrandPanel from '@/components/signup/SignupBrandPanel';
import SignupStepper from '@/components/signup/SignupStepper';
import StepSchoolInfo from '@/components/signup/StepSchoolInfo';
import StepAdminInfo from '@/components/signup/StepAdminInfo';
import StepVerification from '@/components/signup/StepVerification';
import StepSuccess from '@/components/signup/StepSuccess';
import { DEFAULT_STEP1, DEFAULT_STEP2, type Step1Data, type Step2Data, type SignupResult } from '@/components/signup/types';

export default function RegisterSchoolPage() {
  const [step, setStep] = useState(0);
  const [step1, setStep1] = useState<Step1Data>(DEFAULT_STEP1);
  const [step2, setStep2] = useState<Step2Data>(DEFAULT_STEP2);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SignupResult | null>(null);

  const setS1 = (patch: Partial<Step1Data>) => setStep1((prev) => ({ ...prev, ...patch }));
  const setS2 = (patch: Partial<Step2Data>) => setStep2((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetchAPI<SignupResult>('/api/register-school', {
      method: 'POST',
      body: JSON.stringify({
        school_name: step1.school_name,
        npsn: step1.npsn,
        level: step1.level,
        address: step1.address,
        city: step1.city,
        province: step1.province,
        postal_code: step1.postal_code,
        school_email: step1.school_email,
        school_phone: step1.school_phone,
        admin_name: step2.admin_name,
        admin_nik: step2.admin_nik,
        admin_email: step2.admin_email,
        admin_phone: step2.admin_phone,
        identifier: step2.username,
        password: step2.password,
        confirm_password: step2.confirm_password,
      }),
    });
    setSubmitting(false);
    if (res.success) {
      setResult(res.data ?? null);
      setStep(3);
    } else {
      setSubmitError(res.message || 'Pendaftaran sekolah gagal. Silakan coba kembali.');
    }
  };

  return (
    <div
      id="main-content"
      className="min-h-[100dvh] lg:h-screen lg:overflow-hidden w-full relative bg-[#F6FCF8] text-slate-800 antialiased selection:bg-emerald-500 selection:text-white overflow-x-hidden"
    >
      {/* Ambient background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="lg:hidden absolute -top-4 -left-4 w-44 h-44 pointer-events-none">
          <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-[#D4F6E5]">
            <path d="M0 0H160C160 85 90 165 0 185V0Z" fill="currentColor" fillOpacity="0.9" />
          </svg>
        </div>
        <div className="lg:hidden absolute top-8 right-8 w-11 h-11 rounded-full bg-[#D4F6E5] opacity-90" />
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
      <div className="min-h-[100dvh] lg:h-full lg:min-h-0 w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(400px,500px)] xl:grid-cols-[minmax(0,1.2fr)_minmax(460px,580px)] items-center relative z-10">
        {/* LEFT: Brand Panel */}
        <SignupBrandPanel />

        {/* RIGHT: Signup Section */}
        <section className="flex flex-col justify-between items-center px-4 py-6 sm:px-8 sm:py-8 lg:justify-center lg:h-full lg:min-h-0 lg:py-4 overflow-visible lg:overflow-hidden">
          <div className="w-full max-w-[400px] sm:max-w-[440px] xl:max-w-[500px] mx-auto lg:pt-0 flex flex-col">
            {/* Mobile-only Branding Header */}
            {step < 3 && (
              <div className="lg:hidden flex flex-col items-center mb-5 animate-fade-in">
                <Image
                  src="/logo.png"
                  alt="Logo HadirTadz"
                  width={948}
                  height={996}
                  className="h-16 w-auto object-contain drop-shadow-md"
                  priority
                />
                <h1 className="mt-2 text-[26px] font-black tracking-tight text-emerald-950">
                  Hadir<span className="text-emerald-600">Tadz</span>
                </h1>
              </div>
            )}

            {/* Stepper */}
            {step < 3 && <SignupStepper current={step} />}

            {/* Card */}
            <div className={`bg-white rounded-[24px] border border-emerald-100/70 shadow-[0_10px_40px_-12px_rgba(16,185,129,0.18)] p-5 sm:p-7 mt-5 ${step === 0 ? 'max-w-[500px]' : step === 1 ? 'max-w-[540px]' : step === 2 ? 'max-w-[540px]' : ''}`}>
              {step === 0 && <StepSchoolInfo data={step1} onChange={setS1} onNext={() => setStep(1)} />}
              {step === 1 && <StepAdminInfo data={step2} onChange={setS2} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
              {step === 2 && (
                <StepVerification
                  step1={step1}
                  step2={step2}
                  onEditSchool={() => setStep(0)}
                  onEditAdmin={() => setStep(1)}
                  onBack={() => setStep(1)}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  error={submitError}
                />
              )}
              {step === 3 && result && <StepSuccess result={result} />}
            </div>

            {/* Login Link */}
            {step < 3 && (
              <div className="mt-6 text-center">
                <p className="text-[13px] text-slate-500">
                  Sudah punya akun sekolah?{' '}
                  <Link href="/login" className="text-emerald-700 font-bold hover:underline underline-offset-2">
                    Masuk di sini
                  </Link>
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}