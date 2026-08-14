import { redirect } from 'next/navigation';

/**
 * Root page — redirect to /login.
 * After login the API sets the cookie and redirects to /admin, /guru, or /siswa.
 */
export default function RootPage() {
  redirect('/login');
}
