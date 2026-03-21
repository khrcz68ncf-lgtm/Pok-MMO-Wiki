'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const email    = (formData.get('email')    as string).trim();
    const password =  formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Invalid email or password.');
      setPending(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-red-400 font-bold text-lg">PokéMMO Wiki</Link>
          <h1 className="text-2xl font-extrabold mt-2">Sign in</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-gray-900 border border-gray-800 p-6 flex flex-col gap-4"
        >
          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3 font-semibold transition-colors text-sm mt-1"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-red-400 hover:text-red-300 transition-colors">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
