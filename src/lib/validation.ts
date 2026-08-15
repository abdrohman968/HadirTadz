// Validator ringan untuk form (DEVELOPMENT_RULES #6)
// Tiap validator menerima nilai + seluruh form, mengembalikan pesan error (string) atau '' bila valid.

export interface Rule<T> {
  field: string;
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMsg?: string;
  email?: boolean;
  numeric?: boolean;
  phone?: boolean;
  duplicate?: (value: string, all: T) => boolean;
  msg?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
const NUMERIC_RE = /^\d+$/;

/** Jalankan seluruh rules, kembali object { [field]: pesanError } untuk field yang gagal. */
export function validateForm<T extends Record<string, string>>(values: T, rules: Rule<T>[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const r of rules) {
    const value = String(values[r.field] ?? '').trim();
    if (r.required && !value) {
      errors[r.field] = r.msg || `${r.label} wajib diisi`;
      continue;
    }
    if (!value) continue;
    if (r.min && value.length < r.min) {
      errors[r.field] = `${r.label} minimal ${r.min} karakter`;
    } else if (r.max && value.length > r.max) {
      errors[r.field] = `${r.label} maksimal ${r.max} karakter`;
    } else if (r.email && !EMAIL_RE.test(value)) {
      errors[r.field] = `${r.label} tidak valid`;
    } else if (r.phone && !PHONE_RE.test(value)) {
      errors[r.field] = `${r.label} tidak valid (contoh: 0812xxxx)`;
    } else if (r.numeric && !NUMERIC_RE.test(value)) {
      errors[r.field] = `${r.label} harus berupa angka`;
    } else if (r.pattern && !r.pattern.test(value)) {
      errors[r.field] = r.patternMsg || `${r.label} tidak valid`;
    } else if (r.duplicate && r.duplicate(value, values)) {
      errors[r.field] = `${r.label} sudah digunakan`;
    }
  }
  return errors;
}

/** Cek error untuk satu field (dipakai saat realtime update). */
export function validateField<T extends Record<string, string>>(
  values: T,
  field: string,
  rules: Rule<T>[]
): string {
  const only = rules.filter((r) => r.field === field);
  if (!only.length) return '';
  const res = validateForm(values, only);
  return res[field] || '';
}

export function hasErrors(errors: Record<string, string>): boolean {
  return Object.values(errors).some((e) => !!e);
}