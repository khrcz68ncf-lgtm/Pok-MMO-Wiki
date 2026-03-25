import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function loginAction(formData: FormData) {
  'use server';
  const submitted = (formData.get('password') as string ?? '').trim();
  const expected  = (process.env.ADMIN_PASSWORD ?? '').trim();

  console.log('[admin login] submitted length:', submitted.length);
  console.log('[admin login] expected  length:', expected.length);
  console.log('[admin login] match:', submitted === expected);

  if (submitted === expected && expected !== '') {
    const cookieStore = await cookies();
    cookieStore.set('ADMIN_SECRET', expected, {
      httpOnly: true,
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 8, // 8 hours
    });
    console.log('[admin login] cookie set, redirecting to /admin');
    redirect('/admin');
  } else {
    console.log('[admin login] password mismatch, redirecting to error');
    redirect('/admin/login?error=1');
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-red-400 font-bold text-lg">PokéMMO Wiki</p>
          <h1 className="text-2xl font-extrabold mt-1">Admin Login</h1>
        </div>

        <form
          action={loginAction}
          className="rounded-xl bg-gray-900 border border-gray-800 p-6 flex flex-col gap-4"
        >
          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
              Incorrect password. Try again.
            </p>
          )}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors"
              placeholder="Enter admin password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-red-500 hover:bg-red-600 px-4 py-3 font-semibold transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
