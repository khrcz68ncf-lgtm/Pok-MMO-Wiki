'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ── Feedback Modal ────────────────────────────────────────────────────────────

type ModalType = 'bug' | 'idea' | null;

function FeedbackModal({
  type,
  username,
  onClose,
}: {
  type:     'bug' | 'idea';
  username: string | null;
  onClose:  () => void;
}) {
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [status,  setStatus]  = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');

  const isBug    = type === 'bug';
  const webhook  = isBug
    ? process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_BUGS
    : process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_IDEAS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !webhook) return;
    setStatus('sending');
    try {
      const res = await fetch(webhook, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title:       (isBug ? '🐛 Bug Report: ' : '💡 Idea: ') + title,
            description: content,
            color:       isBug ? 0xff0000 : 0x00ff00,
            footer:      { text: 'Submitted by ' + (username ?? 'Anonymous') },
            timestamp:   new Date().toISOString(),
          }],
        }),
      });
      setStatus(res.ok ? 'ok' : 'err');
    } catch {
      setStatus('err');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-bold">
            {isBug ? '🐛 Bug Report' : '💡 Idea Box'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        {status === 'ok' ? (
          <div className="px-5 py-10 text-center">
            <p className="text-2xl mb-2">🙏</p>
            <p className="text-green-400 font-semibold text-sm">Sent! Thank you</p>
            <button
              onClick={onClose}
              className="mt-5 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            {status === 'err' && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                Failed to send, please try again.
              </p>
            )}

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder={isBug ? 'What went wrong?' : 'Your idea in one line…'}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">
                {isBug ? 'Details' : 'Description'}
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                rows={5}
                placeholder={isBug ? 'Steps to reproduce, what you expected vs what happened…' : 'Describe your idea in detail…'}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400 transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'sending'}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  isBug
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {status === 'sending' ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

type Profile = {
  username: string;
  role: string;
};

const navLinks = [
  { label: 'Home',      href: '/'                   },
  { label: 'Wiki',      href: '/wiki'               },
  { label: 'Guides',    href: '/guides'             },
  { label: 'Dmg Calc',  href: '/damage-calculator'   },
  { label: 'Breeding',  href: '/breeding-calculator' },
  { label: 'Community', href: '/community'           },
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
  const [open,      setOpen]      = useState(false);
  const [modal,     setModal]     = useState<ModalType>(null);
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
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="text-lg font-bold text-red-400">
            PokéMMO Wiki
          </Link>
          <Link
            href="/updates"
            className="rounded-full bg-gray-800 border border-gray-700 hover:border-gray-500 px-2 py-0.5 text-[10px] font-medium text-gray-400 hover:text-white transition-all leading-none"
          >
            📢 Updates
          </Link>
          <button
            onClick={() => setModal('bug')}
            className="rounded-full bg-gray-800 border border-gray-700 hover:border-red-500/50 px-2 py-0.5 text-[10px] font-medium text-gray-400 hover:text-red-400 transition-all leading-none"
          >
            🐛 Bug
          </button>
          <button
            onClick={() => setModal('idea')}
            className="rounded-full bg-gray-800 border border-gray-700 hover:border-green-500/50 px-2 py-0.5 text-[10px] font-medium text-gray-400 hover:text-green-400 transition-all leading-none"
          >
            💡 Idea
          </button>
        </div>

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
                <span className="text-sm text-gray-300 hidden sm:block">{profile?.username}</span>
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
                  <p className="text-sm font-semibold text-white truncate">{profile?.username}</p>
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

      {modal && (
        <FeedbackModal
          type={modal}
          username={profile?.username ?? null}
          onClose={() => setModal(null)}
        />
      )}
    </nav>
  );
}
