/**
 * Guard global proses logout di sisi klien.
 *
 * Mencegah race condition antara SessionWatcher (idle timeout) dan LogoutButton:
 * keduanya bisa terpicu hampir bersamaan (mis. overlay idle masih tampil, user
 * klik tombol logout header) sehingga menghasilkan 2x POST /api/auth/logout
 * dan 2x navigasi ke /login. Guard ini memastikan hanya satu sesi logout yang
 * berjalan; yang lain menjadi no-op.
 */
let loggingOut = false;

/** Klaim hak untuk menjalankan logout. Return true bila berhasil pertama. */
export function beginLogout(): boolean {
  if (loggingOut) return false;
  loggingOut = true;
  return true;
}