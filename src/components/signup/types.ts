export const LEVELS = ['SD', 'SMP', 'SMA', 'SMK', 'MA', 'MTS', 'MI', 'PESANTREN', 'LAINNYA'] as const;

export const LEVEL_LABELS: Record<string, string> = {
  SD: 'SD (Sekolah Dasar)',
  SMP: 'SMP (Sekolah Menengah Pertama)',
  SMA: 'SMA (Sekolah Menengah Atas)',
  SMK: 'SMK (Sekolah Menengah Kejuruan)',
  MA: 'MA (Madrasah Aliyah)',
  MTS: 'MTs (Madrasah Tsanawiyah)',
  MI: 'MI (Madrasah Ibtidaiyah)',
  PESANTREN: 'Pondok Pesantren',
  LAINNYA: 'Lainnya',
};

export type Step1Data = {
  school_name: string;
  npsn: string;
  level: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  school_email: string;
  school_phone: string;
};

export type Step2Data = {
  admin_name: string;
  admin_nik: string;
  admin_email: string;
  admin_phone: string;
  username: string;
  password: string;
  confirm_password: string;
};

export interface SignupResult {
  school_code: string;
  school_name: string;
  admin_identifier: string;
  admin_name: string;
}

export const DEFAULT_STEP1: Step1Data = {
  school_name: '',
  npsn: '',
  level: 'SMA',
  address: '',
  city: '',
  province: '',
  postal_code: '',
  school_email: '',
  school_phone: '',
};

export const DEFAULT_STEP2: Step2Data = {
  admin_name: '',
  admin_nik: '',
  admin_email: '',
  admin_phone: '',
  username: '',
  password: '',
  confirm_password: '',
};