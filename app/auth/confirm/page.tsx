'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('success');
        setTimeout(() => router.push('/'), 2000);
      } else {
        setStatus('error');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="text-red-400 font-bold text-lg">PokéMMO Wiki</Link>

        <div className="mt-8 rounded-xl border px-6 py-8 bg-gray-900 border-gray-800">
          {status === 'loading' && (
            <>
              <div className="w-8 h-8 rounded-full border-2 border-gray-600 border-t-red-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Confirming your email…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <p className="text-3xl mb-3">✅</p>
              <h2 className="text-lg font-bold text-green-400 mb-2">Email confirmed!</h2>
              <p className="text-sm text-gray-300">
                Welcome to PokéMMO Wiki. Redirecting you now…
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="text-3xl mb-3">❌</p>
              <h2 className="text-lg font-bold text-red-400 mb-2">Confirmation failed</h2>
              <p className="text-sm text-gray-400">
                This link may have expired. Please try registering again.
              </p>
              <Link
                href="/auth/register"
                className="inline-block mt-4 rounded-lg bg-red-500 hover:bg-red-600 px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                Register again
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
