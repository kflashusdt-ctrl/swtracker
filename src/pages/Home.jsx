import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CheckerCard from '@/components/checker/Checker';
import CountUp from '@/components/reactbits/CountUp';
import Mt103Sample from '@/components/site/Mt103Sample';
import PageHero from '@/components/site/PageHero';
import { BankAvatar, Container, Eyebrow, Flag, LogoStack, Reveal, Skeleton } from '@/components/site/bits';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { POPULAR, SEGMENTS } from '@/lib/bic';
import { getCountries } from '@/lib/data';
import { useAsync, useTitle } from '@/lib/hooks';

// Below-the-fold React Bits components load after the first screen.
const LogoLoop = lazy(() => import('@/components/reactbits/LogoLoop'));
const SplitFlapText = lazy(() => import('@/components/reactbits/SplitFlapText'));

const BOARD = ['DEUTDEFF500', 'BARCGB22XXX', 'CHASUS33XXX', 'HSBCHKHHHKH', 'BNPAFRPPXXX', 'DBSSSGSGXXX'];
const SAMPLE_PARTS = [
  ['DEUT', 0],
  ['DE', 1],
  ['FF', 2],
  ['500', 3],
];

const STEPS = [
  {
    title: 'Get the details from the recipient',
    body: 'Ask for their bank’s SWIFT / BIC code and their IBAN or account number. Get them in writing, from the recipient — not from a third party.',
  },
  {
    title: 'Check the SWIFT code here',
    body: 'Make sure the code is valid and belongs to the bank and country you expect. A one-letter mistake can send money to the wrong bank.',
  },
  {
    title: 'Keep your MT103 and UETR',
    body: 'After you pay, your bank can give you the MT103 confirmation. Its UETR lets your bank trace the payment if it’s ever delayed.',
  },
];

const FAQ = [
  [
    'What is a SWIFT / BIC code?',
    'A Bank Identifier Code (BIC), usually called a SWIFT code, is an 8 or 11 character code that identifies a bank in an international transfer. Banks use it to route money to the right institution.',
  ],
  [
    'Is a SWIFT code the same as an IBAN?',
    'No. The SWIFT code identifies the bank. The IBAN identifies the individual account at that bank. Most international transfers to Europe and the Middle East need both.',
  ],
  [
    'Should I use the 8 or 11 character code?',
    'The 8-character code points to the bank’s head office and works for most payments. Use the 11-character branch code only if the recipient’s bank asks for it.',
  ],
  [
    'Can I track a SWIFT payment on this site?',
    <>
      YES.
    </>,
  ],
  [
    'How up to date is this directory?',
    'The data comes direct from Bank-api.',
  ],
];

function PopularStrip({ data }) {
  return (
    <section id="popular" className="scroll-mt-20 pt-14 sm:pt-20">
      <Container>
        <p className="text-center text-sm font-semibold text-sub">Popular SWIFT codes, worldwide</p>
      </Container>
      <div className="mt-5 h-14">
        <Suspense fallback={null}>
          <LogoLoop
            logos={POPULAR.map((p) => ({ ...p, title: `${p.bank} ${p.bic}` }))}
            speed={40}
            gap={12}
            logoHeight={56}
            pauseOnHover
            fadeOut
            fadeOutWidth={0.08}
            draggable={false}
            ariaLabel="Popular SWIFT codes"
            renderItem={(p) => (
              <Link
                to={`/swift-code/${p.bic}`}
                className="flex h-14 items-center gap-3 whitespace-nowrap rounded-2xl border border-line bg-white py-2 pl-2 pr-5 transition hover:border-ink/25"
              >
                <BankAvatar name={p.bank} src={data?.featuredLogo(p.bic)} size={38} />
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-ink">{p.bank}</span>
                  <span className="flex items-center gap-1.5 text-xs text-sub">
                    <Flag code={p.cc} className="h-[10px] w-[14px] rounded-[2px]" />
                    {p.city}
                  </span>
                </span>
                <span className="ml-1 font-mono text-[13px] font-bold tracking-[0.08em] text-ink">{p.bic}</span>
              </Link>
            )}
          />
        </Suspense>
      </div>
    </section>
  );
}

function FormatSection() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <Reveal>
          <Eyebrow>The format</Eyebrow>
          <h2 className="heading mt-3 text-3xl text-ink sm:text-[40px] sm:leading-[1.1]">Format of a SWIFT / BIC code</h2>
          <p className="mt-4 text-lg leading-relaxed text-sub">
            A SWIFT/BIC is an 8–11 character code that identifies the country, city, bank and branch.
          </p>
          <ul className="mt-8 space-y-6">
            {SEGMENTS.map((s, i) => (
              <li key={s.key} className="flex gap-4">
                <span
                  className="mt-0.5 grid h-10 min-w-16 place-items-center rounded-lg border bg-white px-2 font-mono text-[15px] font-bold tracking-[0.12em]"
                  style={{ color: s.color, borderColor: `color-mix(in srgb, ${s.color} 35%, transparent)` }}
                >
                  {SAMPLE_PARTS[i][0]}
                </span>
                <div>
                  <p className="font-semibold text-ink">
                    {s.label} <span className="font-normal text-sub">· {s.chars}</span>
                    {s.optional && <span className="ml-2 rounded bg-paper px-1.5 py-0.5 text-xs font-medium text-sub">optional</span>}
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-sub">{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-[28px] bg-navy p-5 shadow-[0_40px_80px_-40px_rgba(11,31,58,0.7)] sm:p-8">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55 sm:text-xs">
              <span>SWIFT / BIC</span>
              <span className="flex items-center gap-2">
                <span className="size-1.5 animate-pulse rounded-full bg-gold" /> Directory
              </span>
            </div>
            <div className="mt-6 flex min-h-[clamp(40px,11vw,76px)] justify-center overflow-hidden">
              <Suspense fallback={null}>
                <SplitFlapText
                  words={BOARD}
                  padTo={11}
                  fontSize="clamp(21px, 6.9vw, 44px)"
                  gap="clamp(2px, 0.5vw, 6px)"
                  tileRadius={6}
                  tileColor="#13294a"
                  textColor="#f4c24d"
                  cycleDelay={2600}
                  flipsPerChar={6}
                  align="center"
                />
              </Suspense>
            </div>
            <div className="mt-6 grid grid-cols-4 gap-2 border-t border-white/10 pt-5 text-[11px] sm:text-xs">
              {SEGMENTS.map((s) => (
                <div key={s.key}>
                  <div className="mb-2 h-[3px] rounded-full" style={{ background: s.color, filter: 'brightness(1.5)' }} />
                  <p className="font-semibold text-white">{s.short}</p>
                  <p className="text-white/50">
                    {s.len} {s.key === 'bank' || s.key === 'country' ? 'letters' : 'chars'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function StepsSection() {
  return (
    <section className="bg-paper py-16 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <Eyebrow>Before you send</Eyebrow>
          <h2 className="heading mt-3 text-3xl text-ink sm:text-[40px] sm:leading-[1.1]">Three steps to a safe international payment</h2>
          <ol className="mt-10 space-y-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[auto_1fr] gap-5">
                <span className="display text-[44px] leading-none text-navy/15">{String(i + 1).padStart(2, '0')}</span>
                <div className="border-t border-line pt-3">
                  <p className="text-lg font-semibold text-ink">{s.title}</p>
                  <p className="mt-1.5 leading-relaxed text-sub">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button asChild variant="link" className="mt-6 h-auto px-0 text-base font-semibold text-ink underline underline-offset-4">
            <Link to="/guide#mt103">
              Read more about MT103 fields <ArrowRight />
            </Link>
          </Button>
        </Reveal>
        <Reveal delay={0.1} className="lg:pt-10">
          <Mt103Sample />
        </Reveal>
      </Container>
    </section>
  );
}

function StatsAndCountries({ data }) {
  const top = data ? [...data.list].sort((a, b) => b.codes - a.codes).slice(0, 12) : [];
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line">
          {[
            ['SWIFT codes', data?.total],
            ['Countries', data?.list.length],
            ['Banks', data?.list.reduce((s, c) => s + c.banks, 0)],
          ].map(([label, n]) => (
            <div key={label} className="px-3 py-6 text-center sm:py-9">
              <p className="text-[22px] font-extrabold tracking-tight text-navy tabular-nums min-[400px]:text-2xl sm:display sm:text-5xl">
                {n ? <CountUp to={n} separator="," duration={1.8} /> : '—'}
              </p>
              <p className="mt-2 text-xs font-medium text-sub sm:text-sm">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Eyebrow>Browse</Eyebrow>
            <h2 className="heading mt-3 text-3xl text-ink sm:text-[40px]">SWIFT codes by country</h2>
          </div>
          <Button asChild variant="outline" size="pill" className="self-start border-ink/15 font-semibold sm:self-auto">
            <Link to="/countries">
              All {data?.list.length ?? ''} countries <ArrowRight />
            </Link>
          </Button>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 lg:grid-cols-3">
          {data
            ? top.map((c) => (
                <li key={c.code}>
                  <Link
                    to={`/countries/${c.code}`}
                    className="group flex items-center gap-3.5 rounded-xl border border-line bg-white px-4 py-3.5 transition hover:border-ink/20 hover:shadow-[0_8px_24px_-16px_rgba(11,31,58,0.35)]"
                  >
                    <Flag code={c.code} className="h-6 w-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{c.name}</span>
                      <span className="block text-[13px] tabular-nums text-sub">{c.codes.toLocaleString('en-US')} codes</span>
                    </span>
                    <LogoStack srcs={c.topLogos} size={28} max={3} />
                  </Link>
                </li>
              ))
            : Array.from({ length: 12 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-[54px]" />
                </li>
              ))}
        </ul>
      </Container>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="border-t border-line py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <Reveal>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="heading mt-3 text-3xl text-ink sm:text-[40px] sm:leading-[1.1]">Frequently asked questions</h2>
          <p className="mt-4 leading-relaxed text-sub">
            Sending money abroad for the first time? The knowledge centre explains SWIFT, MT103 and UETR in plain English.
          </p>
          <Button asChild variant="navy" size="pill" className="mt-6">
            <Link to="/guide">
              Knowledge centre <ArrowRight />
            </Link>
          </Button>
        </Reveal>
        <Reveal delay={0.08}>
          <Accordion type="single" collapsible defaultValue="q0" className="border-t border-line">
            {FAQ.map(([q, a], i) => (
              <AccordionItem key={q} value={`q${i}`} className="border-line">
                <AccordionTrigger className="py-5 text-base font-semibold text-ink hover:no-underline sm:text-lg [&>svg]:size-5">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-sub sm:text-base">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Container>
    </section>
  );
}

function SafetyBand() {
  return (
    <section className="pb-16 sm:pb-24">
      
    </section>
  );
}

export default function Home() {
  useTitle(null);
  const { data } = useAsync(getCountries, []);
  return (
    <>
      <PageHero
        eyebrow={data ? `${data.total.toLocaleString('en-US')} codes · ${data.list.length} countries` : 'Free SWIFT / BIC directory'}
        title="SWIFT code checker"
        subtitle="SWIFT/BIC codes always follow a set format. Check if yours is valid, see which bank it belongs to, or look up a bank’s code by name."
      >
        <CheckerCard />
      </PageHero>
      <PopularStrip data={data} />
      <FormatSection />
      <StepsSection />
      <StatsAndCountries data={data} />
      <FaqSection />
      <SafetyBand />
    </>
  );
}
