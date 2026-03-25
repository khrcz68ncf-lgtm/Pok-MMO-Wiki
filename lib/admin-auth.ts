import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const cookieStore = await cookies();
  const secret   = (cookieStore.get('ADMIN_SECRET')?.value ?? '').trim();
  const expected = (process.env.ADMIN_PASSWORD ?? '').trim();

  console.log('[admin-auth] cookie present:', !!secret);
  console.log('[admin-auth] match:', secret === expected && expected !== '');

  if (!secret || secret !== expected || expected === '') {
    redirect('/admin/login');
  }
}
