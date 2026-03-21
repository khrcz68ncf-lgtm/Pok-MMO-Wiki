import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const cookieStore = await cookies();
  const secret = cookieStore.get('ADMIN_SECRET')?.value;
  if (!secret || secret !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }
}
