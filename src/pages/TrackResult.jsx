import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Copy } from 'lucide-react';
import { UetrBreakdown } from '@/components/checker/TrackCard';
import DecryptedText from '@/components/reactbits/DecryptedText';
import { BankAvatar, Container, Flag, Reveal, Skeleton } from '@/components/site/bits';
import { Button } from '@/components/ui/button';
import { parseBic, prettyName } from '@/lib/bic';
import { lookupBic } from '@/lib/data';
import ProgressBar, { computeProgress } from './ProgressBar';
import TransferParties from './TransferParties';
import { useAsync, useTitle } from '@/lib/hooks';
import { describeStatus, fetchStatus, parseUetr, traceRequestText } from '@/lib/uetr';
import { cn } from '@/lib/utils';

// 1. Claude's helper function to sync the steps with the percent
function stepFromPercent(percent) {
  const p = Number.isFinite(percent) ? percent : 0;
  if (p >= 80) return 3;
  if (p >= 50) return 2;
  return 1;
}

function CopyText({ text, label, variant = 'navy' }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant={variant}
      size="pill"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* blocked */
        }
      }}
    >
      {done ? <Check className="text-gold" /> : <Copy />}
      {done ? 'Copied' : label}
    </Button>
  );
}

const fmt = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const STEPS = ['Sent', 'With the banks', 'Completed'];

function Steps({ current, rejected }) {
  return (
    <ol className="grid grid-cols-3 gap-2">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const done = n <= current;
        const last = n === 3 && done;
        const color = last && rejected ? 'var(--color-bad)' : done ? 'var(--color-ok)' : 'var(--color-line)';
        return (
          <li key={s}>
            <div className="h-1.5 rounded-full" style={{ background: color }} />
            <p className={cn('mt-2 text-xs font-semibold sm:text-sm', done ? 'text-ink' : 'text-sub')}>
              {n === 3 && rejected ? 'Rejected' : s}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function AgentBank({ bic }) {
  const parsed = parseBic(bic || '');
  const { data } = useAsync(() => (parsed.valid ? lookupBic(parsed.bic) : Promise.resolve(null)), [parsed.bic]);
  if (!bic) return null;
  const m = data?.match ?? data?.head;
  
  return (
    <div className="mt-2 flex w-full max-w-full items-center gap-2.5 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-3">
      <BankAvatar name={m?.bank ?? bic} src={m?.logo} size={30} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink break-words leading-tight">
          {m ? prettyName(m.bank) : bic}
        </p>
        <div className="flex items-center gap-1.5 font-mono text-xs text-sub mt-1">
          {data?.country && <Flag code={data.country.code} className="h-[10px] w-[14px] rounded-[2px] shrink-0" />}
          {bic}
        </div>
      </div>
    </div>
  );
}

function Timeline({ events }) {
  return (
    <ol className="relative mt-2 space-y-6 border-l-2 border-line pl-4 sm:pl-6">
      {[...events].reverse().map((e, i) => {
        const d = describeStatus(e.status, e.reason);
        const dot = { ok: 'bg-ok', bad: 'bg-bad', warn: 'bg-warn', info: 'bg-seg-bank' }[d.tone];
        return (
          <li key={i} className="relative overflow-hidden">
            <span className={cn('absolute -left-[23px] sm:-left-[31px] top-1 size-3.5 rounded-full ring-4 ring-white', dot)} />
            <p className="font-semibold text-ink">{d.title}</p>
            <p className="text-sm text-sub">
              {fmt(e.occurredAt)} · <span className="font-mono">{e.status}{e.reason ? ` ${e.reason}` : ''}</span>
            </p>
            <AgentBank bic={e.agentBic} />
            <p className="mt-1.5 text-xs text-sub">Reported by {e.source}</p>
          </li>
        );
      })}
    </ol>
  );
}

function EmptyState({ uetr, partners, checkedAt }) {
  return (
    <div className="text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-dashed border-ink/20 bg-paper font-mono text-lg font-bold text-sub">
        0
      </div>
      <h2 className="heading mt-5 text-2xl text-ink">No status reported for this payment</h2>
      <p className="mx-auto mt-2 max-w-lg leading-relaxed text-sub">
        {partners === 0
          ? 'BIC Finder isn’t connected to any bank yet, so there are no payment statuses to show.'
          : 'None of our partner banks has reported this UETR. Its bank may not be connected to BIC Finder yet.'}{' '}
        Only the banks handling the payment can see where it is.
      </p>
      <p className="mt-3 text-xs text-sub">Checked {fmt(checkedAt)}</p>
    </div>
  );
}

export default function TrackResult() {
  const { uetr: raw = '' } = useParams();
  const parsed = parseUetr(raw);
  const { uetr } = parsed;
  useTitle('Payment status');
  const res = useAsync(() => (parsed.valid ? fetchStatus(uetr) : Promise.resolve(null)), [uetr, parsed.valid]);
  
  const events = res.data?.events ?? [];
  const latest = events.length ? describeStatus(events.at(-1).status, events.at(-1).reason) : null;

  // 2. Add a timer so the page re-renders every 30 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // 3. Calculate percent and steps
  const { percent } = computeProgress(events);
  const rejected = events.some((e) => e.status === 'RJCT');
  const currentStep = rejected ? 3 : stepFromPercent(percent);

  return (
    <>
      <section className="bg-navy text-white">
        <Container className="pb-32 pt-8 sm:pb-36 sm:pt-12">
          <Link to="/track" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white">
            <ArrowLeft className="size-4" /> Check another payment
          </Link>
          <p className="mt-8 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/60">UETR</p>
          <h1 className="mt-3 break-all font-mono text-[22px] font-bold leading-tight text-gold sm:text-3xl lg:text-4xl [&_.whitespace-nowrap]:whitespace-normal">
            <DecryptedText
              key={uetr}
              text={uetr || '—'}
              animateOn="view"
              sequential
              speed={20}
              characters="0123456789abcdef"
              encryptedClassName="text-white/40"
            />
          </h1>
          {latest && <p className="mt-4 text-lg text-white/85">{latest.title}</p>}
        </Container>
      </section>

      <Container className="relative z-10 -mt-24 pb-20 overflow-hidden">
        <Reveal className="rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgba(11,31,58,0.06),0_30px_70px_-30px_rgba(11,31,58,0.45)] ring-1 ring-black/[0.04] sm:p-9">
          <UetrBreakdown uetr={uetr} />
          <div className="mt-8">
            {!parsed.valid ? (
              <div className="rounded-2xl border border-bad/25 bg-bad/[0.06] px-5 py-4">
                <p className="font-semibold text-bad">This isn’t a valid UETR</p>
                <p className="mt-1 text-[15px] text-ink-2">{parsed.error}</p>
              </div>
            ) : res.loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10" />
                <Skeleton className="h-40" />
              </div>
            ) : res.error ? (
              <div className="rounded-2xl border border-warn/25 bg-warn/[0.06] px-5 py-4">
                <p className="font-semibold text-warn">The status service isn’t available right now</p>
                <p className="mt-1 text-[15px] text-ink-2">Please try again in a few minutes, or ask your bank to trace the payment.</p>
              </div>
            ) : events.length === 0 ? (
              <EmptyState uetr={uetr} partners={res.data.partnersConnected} checkedAt={res.data.checkedAt} />
            ) : (
              <>
                <TransferParties />
                <ProgressBar events={events} />
                
                {/* 4. Claude's fix: Use currentStep here */}
                <Steps current={currentStep} rejected={rejected} />
                
                <h2 className="heading mt-8 text-xl text-ink">Updates from banks</h2>
                <Timeline events={events} />
                <p className="mt-8 text-xs text-sub">
                  Last checked {fmt(res.data.checkedAt)}. Statuses come only from partner banks. If anything looks wrong, contact your
                  bank directly.
                </p>
              </>
            )}
          </div>
        </Reveal>
      </Container>
    </>
  );
}