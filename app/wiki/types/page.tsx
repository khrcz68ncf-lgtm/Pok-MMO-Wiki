import TypeBadge from '@/app/components/TypeBadge';
import Navbar from '@/app/components/Navbar';
import Breadcrumb from '@/app/components/Breadcrumb';
import { ALL_TYPES, EFF } from '@/lib/type-chart';

// PokéMMO uses 17 types (no Fairy)
const TYPES = ALL_TYPES.filter((t) => t !== 'fairy');

function multLabel(m: number): string {
  if (m === 0)   return '0';
  if (m === 0.5) return '½';
  if (m === 2)   return '2';
  if (m === 4)   return '4';
  return '·';
}

function multClass(m: number): string {
  if (m === 0)   return 'bg-gray-800 text-gray-500';
  if (m === 0.5) return 'bg-green-900/50 text-green-400 font-semibold';
  if (m === 2)   return 'bg-red-900/50 text-red-400 font-semibold';
  if (m === 4)   return 'bg-red-700/60 text-red-300 font-bold';
  return 'text-gray-600';
}

export default function TypesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Wiki', href: '/wiki' },
          { label: 'Types' },
        ]} />

        <h1 className="text-3xl font-extrabold mb-1">Types</h1>
        <p className="text-gray-400 text-sm mb-8">
          PokéMMO uses 17 types. Click any badge to see its detailed type page.
        </p>

        {/* ── Type badge grid ─────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-5 pb-2 border-b border-gray-800">All Types</h2>
          <div className="flex flex-wrap gap-3">
            {TYPES.map((t) => (
              <TypeBadge key={t} type={t} className="h-9" />
            ))}
          </div>
        </section>

        {/* ── Type effectiveness chart ─────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-2 pb-2 border-b border-gray-800">
            Type Effectiveness Chart
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            Rows = attacking type · Columns = defending type
          </p>

          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="text-[11px] border-collapse">
              <thead>
                <tr>
                  {/* corner cell */}
                  <th className="sticky left-0 z-10 bg-gray-900 px-2 py-2 text-gray-600 text-xs font-normal border-b border-r border-gray-800 whitespace-nowrap">
                    ATK ↓ / DEF →
                  </th>
                  {TYPES.map((def) => (
                    <th
                      key={def}
                      className="bg-gray-900 border-b border-gray-800 px-1 py-2 font-normal"
                    >
                      <div className="flex justify-center">
                        <TypeBadge type={def} className="h-5" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TYPES.map((atk, ri) => (
                  <tr key={atk} className={ri % 2 === 1 ? 'bg-gray-900/30' : ''}>
                    {/* Row label */}
                    <td className="sticky left-0 z-10 bg-gray-900 border-r border-gray-800 px-2 py-1.5 whitespace-nowrap">
                      <TypeBadge type={atk} className="h-5" />
                    </td>
                    {TYPES.map((def) => {
                      const m = EFF[atk]?.[def] ?? 1;
                      return (
                        <td
                          key={def}
                          className={`text-center px-1.5 py-1.5 border-gray-800/40 border ${multClass(m)}`}
                        >
                          {multLabel(m)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-5 rounded bg-red-900/50 text-red-400 font-semibold flex items-center justify-center text-[11px]">2</span>
              Super effective (×2)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-5 rounded bg-green-900/50 text-green-400 font-semibold flex items-center justify-center text-[11px]">½</span>
              Not very effective (×½)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-5 rounded bg-gray-800 text-gray-500 flex items-center justify-center text-[11px]">0</span>
              No effect (×0)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-5 rounded text-gray-600 flex items-center justify-center text-[11px]">·</span>
              Normal (×1)
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
