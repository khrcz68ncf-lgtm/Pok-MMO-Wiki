'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef  = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const password = passwordRef.current?.value ?? '';
    const confirm  = confirmRef.current?.value  ?? '';

    if (password !== confirm) {
      confirmRef.current?.setCustomValidity('Passwords do not match.');
      confirmRef.current?.reportValidity();
      return;
    }
    confirmRef.current?.setCustomValidity('');

    setPending(true);

    const formData = new FormData(e.currentTarget);
    const username = (formData.get('username') as string).trim();
    const email    = (formData.get('email')    as string).trim();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: 'https://pok-mmo-wiki.vercel.app/auth/confirm',
      },
    });

    if (signUpError || !data.user) {
      setError('Something went wrong, please try again.');
      setPending(false);
      return;
    }

    // No session means email confirmation is required — show success message
    if (!data.session) {
      setSuccess(true);
      setPending(false);
      return;
    }

    // Session exists (email confirmation disabled) — go home directly
    router.refresh();
    router.push('/');
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="text-red-400 font-bold text-lg">PokéMMO Wiki</Link>
          <div className="mt-8 rounded-xl bg-green-500/10 border border-green-500/30 px-6 py-8">
            <p className="text-3xl mb-3">📬</p>
            <h2 className="text-lg font-bold text-green-400 mb-2">Check your email</h2>
            <p className="text-sm text-gray-300">
              Account created! Please check your email to confirm your account.
            </p>
          </div>
          <p className="text-center text-sm text-gray-500 mt-5">
            Already confirmed?{' '}
            <Link href="/auth/login" className="text-red-400 hover:text-red-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-red-400 font-bold text-lg">PokéMMO Wiki</Link>
          <h1 className="text-2xl font-extrabold mt-2">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the community</p>
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
            <label htmlFor="username" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              autoComplete="username"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors text-sm"
              placeholder="ash_ketchum"
            />
            <p className="text-xs text-gray-600 mt-1">3–20 characters: letters, numbers, underscores</p>
          </div>

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
              minLength={8}
              ref={passwordRef}
              autoComplete="new-password"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors text-sm"
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              ref={confirmRef}
              autoComplete="new-password"
              onChange={() => confirmRef.current?.setCustomValidity('')}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3 font-semibold transition-colors text-sm mt-1"
          >
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-red-400 hover:text-red-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
