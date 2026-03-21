import Link from 'next/link';

type Crumb = { label: string; href?: string };

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            {isLast || !crumb.href ? (
              <span className="text-gray-300">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-gray-300 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
