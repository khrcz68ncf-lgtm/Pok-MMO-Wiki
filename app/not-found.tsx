import Link from 'next/link';
import Navbar from './components/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar />

      {/* 404 body */}
      <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
        <p className="text-8xl font-extrabold text-gray-800 select-none">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 text-gray-400 max-w-sm">
          This page doesn&apos;t exist or may have been moved. Try browsing the wiki instead.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="rounded-lg bg-red-500 hover:bg-red-600 px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/wiki"
            className="rounded-lg border border-gray-700 hover:border-gray-500 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Browse wiki
          </Link>
        </div>
      </div>
    </div>
  );
}
