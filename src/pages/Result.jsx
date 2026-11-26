import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { CodeBreakdown, ResultRow } from '@/components/checker/Checker';
import DecryptedText from '@/components/reactbits/DecryptedText';
import { BankAvatar, Container, Flag, Reveal, Skeleton } from '@/components/site/bits';
import { Button } from '@/components/ui/button';
import { branchLabel, countryName, parseBic, prettyName } from '@/lib/bic';
import { lookupBic } from '@/lib/data';
import { useAsync, useTitle } from '@/lib/hooks';
import { cn } from '@/lib/utils';

function CopyButton({ value }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="onNavy"
      size="pill"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* blocked */
        }
      }}
    >
      {done ? <Check className="text-gold" /> : <Copy />}
      {done ? 'Copied' : 'Copy code'}
    </Button>
  );
}

const TONES = {
  ok: { dot: 'bg-ok', text: 'text-ok', ring: 'border-ok/25 bg-ok/[0.06]' },
  warn: { dot: 'bg-warn', text: 'text-warn', ring: 'border-warn/25 bg-warn/[0.06]' },
  bad: { dot: 'bg-bad', text: 'text-bad', ring: 'border-bad/25 bg-bad/[0.06]' },
};

function Verdict({ tone, title, children }) {
  const t = TONES[tone];
  return (
    <div className={cn('rounded-2xl border px-5 py-4 sm:px-6', t.ring)}>
      <p className={cn('flex items-center gap-2.5 font-semibold', t.text)}>
        <span className={cn('size-2.5 rounded-full', t.dot)} />
        {title}
      </p>
      {children && <div className="mt-1.5 pl-5 text-[15px] leading-relaxed text-ink-2">{children}</div>}
    </div>
  );
}

function Row({ label, children, mono }) {
  return (
    <div className="grid gap-1 border-b border-line py-4 last:border-b-0 sm:grid-cols-[180px_1fr] sm:gap-6">
      <dt className="text-sm text-sub">{label}</dt>
      <dd className={cn('min-w-0 break-words font-semibold text-ink', mono && 'font-mono tracking-[0.08em]')}>{children}</dd>
    </div>
  );
}

export default function Result() {
  const { bic: raw = '' } = useParams();
  const parsed = parseBic(raw);
  const { bic } = parsed;
  useTitle(bic ? `${bic} SWIFT code` : 'SWIFT code');
  const res = useAsync(() => (parsed.valid ? lookupBic(bic) : Promise.resolve(null)), [bic, parsed.valid]);
  const d = res.data;
  const m = d?.match ?? null;
  const cName = d?.country?.name ?? countryName(parsed.parts.country) ?? parsed.parts.country;

  return (
    <>
      <section className="bg-navy text-white">
        <Container className="pb-32 pt-8 sm:pb-36 sm:pt-12">
          <Link to="/#check" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white">
            <ArrowLeft className="size-4" /> Check another code
          </Link>
          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-white/60">SWIFT / BIC code</p>
              <h1 className="mt-3 break-all font-mono text-[40px] font-bold leading-none tracking-[0.1em] text-gold sm:text-6xl">
                <DecryptedText
                  key={bic}
                  text={bic || '—'}
                  animateOn="view"
                  sequential
                  speed={45}
                  characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                  encryptedClassName="text-white/40"
                />
              </h1>
              {m && (
                <div className="mt-5 flex items-center gap-3.5">
                  <BankAvatar name={m.bank} src={m.logo} size={48} className="ring-white/20" />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-white">{prettyName(m.bank)}</p>
                    <p className="flex items-center gap-2 text-sm text-white/70">
                      <Flag code={d.country.code} className="h-3.5 w-[19px]" />
                      {prettyName(m.city)}, {d.country.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {bic && (
              <div className="self-start sm:self-auto">
                <CopyButton value={bic} />
              </div>
            )}
          </div>
        </Container>
      </section>

      <Container className="relative z-10 -mt-24 pb-20">
        <Reveal className="rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgba(11,31,58,0.06),0_30px_70px_-30px_rgba(11,31,58,0.45)] ring-1 ring-black/[0.04] sm:p-9">
          <CodeBreakdown bic={bic} size="lg" />

          <div className="mt-8 space-y-4">
            {!parsed.valid ? (
              <Verdict tone="bad" title="This isn’t a valid SWIFT / BIC code">
                <ul className="list-disc space-y-0.5 pl-4">
                  {parsed.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Verdict>
            ) : res.loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-60" />
              </div>
            ) : res.error ? (
              <Verdict tone="warn" title="Couldn’t load the directory">
                Check your connection and refresh the page.
              </Verdict>
            ) : m ? (
              <>
                <Verdict tone="ok" title="Valid code — found in the directory">
                  Still confirm it with the recipient before you send money.
                </Verdict>
                <div className="mt-2 flex items-center gap-4 pt-4">
                  <BankAvatar name={m.bank} src={m.logo} size={56} />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-ink sm:text-xl">{prettyName(m.bank)}</p>
                    <p className="text-sub">
                      {prettyName(m.city)}, {d.country.name}
                    </p>
                  </div>
                </div>
                <dl className="border-t border-line">
                  <Row label="Bank">{prettyName(m.bank)}</Row>
                  <Row label="Branch">{branchLabel(m)}</Row>
                  <Row label="City">{prettyName(m.city) || '—'}</Row>
                  <Row label="Country">
                    <Link to={`/countries/${d.country.code}`} className="inline-flex items-center gap-2.5 underline decoration-line decoration-2 underline-offset-4 hover:decoration-gold">
                      <Flag code={d.country.code} /> {d.country.name}
                    </Link>
                  </Row>
                  <Row label="SWIFT code" mono>
                    {bic}
                  </Row>
                  <Row label="8-character code" mono>
                    {bic.slice(0, 8)}
                  </Row>
                </dl>
              </>
            ) : (
              <Verdict tone="warn" title="Valid format, but not in our directory">
                {!d?.country
                  ? `We have no codes for country “${parsed.parts.country}”. Check characters 5–6.`
                  : d.head
                    ? `This branch isn’t listed, but the head office ${d.head.bic} belongs to ${prettyName(d.head.bank)}. Ask the recipient’s bank to confirm the branch code.`
                    : `It may be new, retired or mistyped. Double-check it with the recipient’s bank in ${cName}.`}
              </Verdict>
            )}

            {parsed.valid && (parsed.isTest || parsed.isPassive) && (
              <Verdict tone="warn" title={parsed.isTest ? 'This looks like a test code' : 'Passive participant code'}>
                {parsed.isTest
                  ? 'A 0 in position 8 marks a test or training code, which can’t receive real payments.'
                  : 'A 1 in position 8 marks a bank that isn’t directly connected to the SWIFT network.'}
              </Verdict>
            )}
          </div>
        </Reveal>

        {d?.related?.length > 0 && (
          <Reveal className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="heading text-2xl text-ink">
                {m ? 'Other codes for this bank' : 'Similar codes'} <span className="text-base font-medium text-sub">{d.relatedTotal}</span>
              </h2>
              {d.relatedTotal > d.related.length && (
                <Link to={`/countries/${d.country.code}?q=${bic.slice(0, 6)}`} className="shrink-0 whitespace-nowrap text-sm font-semibold text-ink underline underline-offset-4">
                  See all
                </Link>
              )}
            </div>
            <ul className="mt-4 rounded-2xl border border-line p-1.5 sm:p-2">
              {d.related.map((r) => (
                <ResultRow key={r.bic} r={r} />
              ))}
            </ul>
          </Reveal>
        )}

        <Reveal className="mt-12 grid gap-5 rounded-2xl bg-paper p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <p className="text-lg font-semibold text-ink">Looking for where a payment is?</p>
            <p className="mt-1.5 max-w-2xl leading-relaxed text-sub">
              A SWIFT code only identifies a bank. No website can show the status of a transfer — only the banks involved can trace
              it, using its UETR. If a “tracking” page says funds are blocked and asks for a release fee, it’s a scam.
            </p>
          </div>
          <Button asChild variant="navy" size="pill" className="justify-self-start">
            <Link to="/guide#trace">
              How to trace a payment <ArrowRight />
            </Link>
          </Button>
        </Reveal>
      </Container>
    </>
  );
}
