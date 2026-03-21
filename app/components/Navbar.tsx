'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Profile = {
  username: string;
  role: string;
};

const navLinks = [
  { label: 'Home',      href: '/'          },
  { label: 'Wiki',      href: '/wiki'      },
  { label: 'Guides',    href: '/guides'    },
  { label: 'Community', href: '/community' },
];

const menuItems = [
  { icon: '👤', label: 'My Profile',      href: '/profile'               },
  { icon: '⚙️', label: 'Account Settings', href: '/profile/settings'     },
  { icon: '📝', label: 'My Contributions', href: '/profile/contributions' },
];

export default function Navbar() {
  const router = useRouter();
  const [user, setUser]       = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Resolve auth state immediately — never wait for profile fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', userId)
      .single();
    setProfile(data);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.refresh();
    router.push('/');
  }

  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? '';
  const isAdmin  = profile?.role === 'admin';

  return (
    <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="text-lg font-bold text-red-400 shrink-0">
          PokéMMO Wiki
        </Link>

        {/* Centre nav links */}
        <div className="flex gap-6 text-sm text-gray-300">
          {navLinks.map(({ label, href }) => (
            <Link key={label} href={href} className="hover:text-white transition-colors">
              {label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
        <div className="flex items-center gap-3 text-sm shrink-0">
          {loading ? (
            /* Skeleton prevents layout shift while resolving session */
            <div className="w-7 h-7 rounded-full bg-gray-800 animate-pulse" />
          ) : user ? (
            /* Logged-in: avatar + dropdown */
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-xs font-bold text-red-400 select-none">
                  {initials}
                </div>
                <span className="text-sm text-gray-300 hidden sm:block">{profile.username}</span>
                <svg
                  className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              <div
                role="menu"
                className={`
                  absolute right-0 top-full mt-2 w-52
                  rounded-xl bg-gray-900 border border-gray-800 shadow-xl shadow-black/40
                  overflow-hidden z-50
                  transition-all duration-150 origin-top-right
                  ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
                `}
              >
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-xs text-gray-500">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate">{profile.username}</p>
                </div>

                <div className="py-1">
                  {menuItems.map(({ icon, label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <span className="text-base">{icon}</span>
                      {label}
                    </Link>
                  ))}

                  {isAdmin && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-400 hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-base">🛠️</span>
                      Admin Panel
                    </Link>
                  )}
                </div>

                <div className="border-t border-gray-800 py-1">
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-base">🚪</span>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Logged-out: Login / Register links */
            <>
              <Link
                href="/auth/login"
                className="rounded-lg border border-gray-700 hover:border-gray-500 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-all"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-red-500 hover:bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
