// A clearly labelled, static illustration of what a real status result looks like.
// It uses placeholder banks (Bank A/B/C) and placeholder codes, is not linked to any
// UETR lookup, and never changes on its own.
import { cn } from '@/lib/utils';

const BANKS = {
  A: { name: 'Bank A', role: 'Sender’s bank', code: 'AAAAXX11', tone: ['#e8eefb', '#1c3f99'] },
  B: { name: 'Bank B', role: 'Middle (correspondent) bank', code: 'BBBBXX22', tone: ['#f1eafb', '#5f2fae'] },
  C: { name: 'Bank C', role: 'Recipient’s bank', code: 'CCCCXX33', tone: ['#e6f4ee', '#0c6b49'] },
};

const EVENTS = [
  { bank: 'A', status: 'ACSP', reason: 'G000', when: 'Day 1 · 09:15', title: 'Passed on to the next bank', dot: 'bg-seg-bank', explain: 'Bank A has sent the payment on to Bank B.' },
  { bank: 'B', status: 'ACSP', reason: 'G000', when: 'Day 1 · 14:40', title: 'Passed on to the next bank', dot: 'bg-seg-bank', explain: 'Bank B has passed it on to Bank C.' },
  { bank: 'C', status: 'ACCC', reason: null, when: 'Day 2 · 08:05', title: 'Credited to the recipient’s account', dot: 'bg-ok', explain: 'Bank C has paid the money into the recipient’s account. Finished.' },
];

function Letter({ id, size = 40 }) {
  const [bg, fg] = BANKS[id].tone;
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center font-bold"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.26), background: bg, color: fg, fontSize: size * 0.42 }}
    >
      {id}
    </span>
  );
}

const CODES = [
  ['ACSP', 'In progress — a bank has the payment and it’s still moving. Always comes with a reason code:'],
  ['G000', 'passed on to the next bank'],
  ['G001', 'passed to a bank that doesn’t send updates'],
  ['G002', 'at the last bank; the credit may not be immediate'],
  ['G003', 'waiting for documents the bank asked the customer for'],
  ['G004', 'waiting for funds'],
  ['ACCC', 'Credited — the money reached the recipient’s account. Finished.'],
  ['RJCT', 'Rejected — a bank refused the payment and it goes back.'],
];

export default function ExampleTimeline() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-[28px] border-2 border-dashed border-ink/15 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper px-5 py-3 sm:px-7">
          <span className="text-sm font-semibold text-ink">Example result</span>
          <span className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-bold tracking-[0.14em] text-white">EXAMPLE — NOT A REAL PAYMENT</span>
        </div>

        <div className="p-5 sm:p-8">
          {/* Route */}
          <ol className="grid grid-cols-3 gap-2 sm:gap-4">
            {Object.entries(BANKS).map(([id, b], i) => (
              <li key={id} className="relative flex flex-col items-center text-center">
                {i < 2 && (
                  <span aria-hidden="true" className="absolute left-[calc(50%+28px)] right-[calc(-50%+28px)] top-5 h-0.5 bg-ok sm:left-[calc(50%+32px)] sm:right-[calc(-50%+32px)]" />
                )}
                <Letter id={id} />
                <p className="mt-2 text-sm font-semibold text-ink">{b.name}</p>
                <p className="text-[11px] leading-snug text-sub sm:text-xs">{b.role}</p>
                <p className="mt-1 font-mono text-[11px] font-semibold tracking-wide text-ink-2 sm:text-xs">{b.code}</p>
              </li>
            ))}
          </ol>

          {/* Progress — only reflects the events below */}
          <div className="mt-8 grid grid-cols-3 gap-2">
            {['Sent', 'With the banks', 'Completed'].map((s) => (
              <div key={s}>
                <div className="h-1.5 rounded-full bg-ok" />
                <p className="mt-2 text-xs font-semibold text-ink sm:text-sm">{s}</p>
              </div>
            ))}
          </div>

          {/* Timeline, newest first, as on a real result */}
          <h3 className="heading mt-8 text-lg text-ink">Updates from banks</h3>
          <ol className="relative mt-3 space-y-6 border-l-2 border-line pl-6">
            {[...EVENTS].reverse().map((e) => (
              <li key={e.when} className="relative">
                <span className={cn('absolute -left-[31px] top-1 size-3.5 rounded-full ring-4 ring-white', e.dot)} />
                <p className="font-semibold text-ink">{e.title}</p>
                <p className="text-sm text-sub">
                  {e.when} · <span className="font-mono">{e.status}{e.reason ? ` ${e.reason}` : ''}</span>
                </p>
                <span className="mt-2 inline-flex items-center gap-2.5 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-3">
                  <Letter id={e.bank} size={30} />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{BANKS[e.bank].name}</span>
                    <span className="block font-mono text-xs text-sub">{BANKS[e.bank].code}</span>
                  </span>
                </span>
                <p className="mt-1.5 text-sm text-ink-2">{e.explain}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-paper p-5 sm:p-6">
        <p className="font-semibold text-ink">What the codes mean</p>
        <dl className="mt-3 space-y-2 text-[15px]">
          {CODES.map(([code, text]) => (
            <div key={code} className={cn('flex gap-3', code.startsWith('G') && 'pl-6')}>
              <dt className="w-12 shrink-0 font-mono font-bold text-ink">{code}</dt>
              <dd className="text-ink-2">{text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-sub">
          Bank A, B and C and their codes are placeholders. Real results appear only when a connected bank reports a payment, and
          then show the real banks and their logos.
        </p>
      </div>
    </div>
  );
}
