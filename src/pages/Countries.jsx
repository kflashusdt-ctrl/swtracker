import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHero from '@/components/site/PageHero';
import { Flag, LogoStack, Skeleton } from '@/components/site/bits';
import { Input } from '@/components/ui/input';
import { getCountries } from '@/lib/data';
import { useAsync, useTitle } from '@/lib/hooks';

export default function Countries() {
  useTitle('SWIFT codes by country');
  const { data, loading, error } = useAsync(getCountries, []);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q.trim().toLowerCase());
  const list = useMemo(
    () => (data ? data.list.filter((c) => !dq || c.name.toLowerCase().includes(dq) || c.code.toLowerCase() === dq) : []),
    [data, dq],
  );

  return (
    <>
      <PageHero
        eyebrow="Browse the directory"
        title="Codes by country"
        subtitle="Choose a country to see every bank and branch SWIFT code we have for it."
      >
        <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-4 shadow-[0_30px_70px_-30px_rgba(11,31,58,0.45)] ring-1 ring-black/[0.04] sm:p-6">
          <label htmlFor="cq" className="mb-2 block text-sm font-semibold text-ink">
            Search countries
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-sub" />
            <Input
              id="cq"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. Germany"
              className="h-14 rounded-xl pl-12 !text-base shadow-none focus-visible:border-seg-bank focus-visible:ring-seg-bank/15"
            />
          </div>
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-2.5 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }, (_, i) => (
              <Skeleton key={i} className="h-[66px]" />
            ))}
          </div>
        ) : error ? (
          <p className="text-bad">Couldn’t load countries. Refresh to try again.</p>
        ) : list.length === 0 ? (
          <p className="text-center text-sub">No country matches “{q}”.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-sub">{list.length} countries</p>
            <ul className="grid gap-2.5 min-[480px]:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <li key={c.code}>
                  <Link
                    to={`/countries/${c.code}`}
                    className="flex items-center gap-3.5 rounded-xl border border-line bg-white px-4 py-3.5 transition hover:border-ink/20 hover:shadow-[0_8px_24px_-16px_rgba(11,31,58,0.35)]"
                  >
                    <Flag code={c.code} className="h-6 w-8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{c.name}</p>
                      <p className="text-[13px] text-sub">
                        {c.codes.toLocaleString('en-US')} codes · {c.banks.toLocaleString('en-US')} banks
                      </p>
                    </div>
                    <LogoStack srcs={c.topLogos} size={28} max={3} />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
