import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { ResultRow } from '@/components/checker/Checker';
import { BankAvatar, Container, Flag, Skeleton } from '@/components/site/bits';
import { prettyName } from '@/lib/bic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { filterRows, getCountries, getCountry } from '@/lib/data';
import { useAsync, useTitle } from '@/lib/hooks';

const PAGE = 60;

// Biggest banks in the country (by number of codes), one card each, linking to the head office code.
function majorBanks(rows, n = 15) {
  const groups = new Map();
  for (const r of rows) {
    const key = r.bic.slice(0, 6);
    const g = groups.get(key) ?? { count: 0, rows: [] };
    g.count++;
    g.rows.push(r);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => {
      const head = g.rows.find((r) => r.bic.length === 8) ?? g.rows[0];
      return { ...head, count: g.count, logo: g.rows.find((r) => r.logo)?.logo ?? null };
    })
    .sort(
      (a, b) =>
        Number(!!b.logo) - Number(!!a.logo) ||
        b.count - a.count ||
        Number(/BRANCH/.test(a.bank)) - Number(/BRANCH/.test(b.bank)),
    )
    .filter((b, i, all) => all.findIndex((x) => x.bank === b.bank) === i)
    .slice(0, n);
}

export default function Country() {
  const cc = (useParams().cc || '').toUpperCase();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const dq = useDeferredValue(q);
  const [limit, setLimit] = useState(PAGE);

  const meta = useAsync(getCountries, []);
  const country = meta.data?.byCode[cc];
  useTitle(country ? `SWIFT codes in ${country.name}` : 'SWIFT codes');

  const rows = useAsync(() => getCountries().then(({ byCode }) => (byCode[cc] ? getCountry(cc) : null)), [cc]);
  const results = useMemo(() => (rows.data ? filterRows(rows.data, dq) : []), [rows.data, dq]);
  const majors = useMemo(() => (rows.data ? majorBanks(rows.data) : []), [rows.data]);

  useEffect(() => {
    setLimit(PAGE);
    const next = dq.trim();
    setParams(next ? { q: next } : {}, { replace: true });
  }, [dq, setParams]);

  if (!rows.loading && !rows.error && rows.data === null) {
    return (
      <Container className="py-24 text-center">
        <h1 className="heading text-3xl">No codes for “{cc}”</h1>
        <Button asChild variant="navy" size="pill" className="mt-6">
          <Link to="/countries">Browse all countries</Link>
        </Button>
      </Container>
    );
  }

  return (
    <>
      <section className="bg-navy text-white">
        <Container className="pb-12 pt-8 sm:pb-16 sm:pt-12">
          <Link to="/countries" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white">
            <ArrowLeft className="size-4" /> All countries
          </Link>
          <div className="mt-8 flex items-center gap-4 sm:gap-5">
            <Flag code={cc} className="h-10 w-[54px] rounded-md ring-white/20 sm:h-14 sm:w-[75px]" />
            <h1 className="display text-[34px] text-gold sm:text-6xl">{country?.name ?? cc}</h1>
          </div>
          <p className="mt-4 text-white/75 sm:text-lg">
            {country ? `${country.codes.toLocaleString('en-US')} SWIFT codes from ${country.banks.toLocaleString('en-US')} banks` : ' '}
          </p>
        </Container>
      </section>

      <div className="sticky top-16 z-20 border-b border-line bg-white/90 backdrop-blur-md">
        <Container className="py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-sub" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by bank, city, branch or code"
              aria-label="Filter codes"
              className="h-12 rounded-xl pl-12 !text-base shadow-none focus-visible:border-seg-bank focus-visible:ring-seg-bank/15"
            />
          </div>
        </Container>
      </div>

      <Container className="pb-20 pt-6">
        {!dq.trim() && majors.length > 0 && (
          <section className="mb-10">
            <h2 className="heading text-xl text-ink sm:text-2xl">Major banks in {country?.name}</h2>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 lg:grid-cols-3">
              {majors.map((b) => (
                <li key={b.bic}>
                  <Link
                    to={`/swift-code/${b.bic}`}
                    className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-3.5 transition hover:border-ink/20 hover:shadow-[0_8px_24px_-16px_rgba(11,31,58,0.35)]"
                  >
                    <BankAvatar name={b.bank} src={b.logo} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{prettyName(b.bank)}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-[13px] text-sub">
                        <span className="font-mono font-semibold tracking-[0.06em] text-ink">{b.bic}</span>
                        {b.count > 1 && <span>· {b.count.toLocaleString('en-US')} codes</span>}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="heading mt-12 text-xl text-ink sm:text-2xl">All SWIFT codes</h2>
          </section>
        )}
        {rows.loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : rows.error ? (
          <p className="text-bad">Couldn’t load codes. Refresh to try again.</p>
        ) : results.length === 0 ? (
          <p className="py-10 text-center text-sub">Nothing matches “{dq}”.</p>
        ) : (
          <>
            <p className="pb-3 text-sm text-sub">
              Showing {Math.min(limit, results.length).toLocaleString('en-US')} of {results.length.toLocaleString('en-US')}
            </p>
            <ul className="divide-y divide-line rounded-2xl border border-line p-1.5 sm:p-2">
              {results.slice(0, limit).map((r) => (
                <ResultRow key={r.bic} r={r} />
              ))}
            </ul>
            {results.length > limit && (
              <div className="mt-8 text-center">
                <Button variant="outline" size="pill" className="border-ink/15 font-semibold" onClick={() => setLimit((l) => l + PAGE * 2)}>
                  Show more
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </>
  );
}
