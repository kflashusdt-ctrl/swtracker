import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Mt103Sample from '@/components/site/Mt103Sample';
import PageHero from '@/components/site/PageHero';
import { Container, Reveal } from '@/components/site/bits';
import { Button } from '@/components/ui/button';
import { useTitle } from '@/lib/hooks';

const TOC = [
  ['swift', 'SWIFT / BIC codes'],
  ['iban', 'SWIFT code vs IBAN'],
  ['mt103', 'MT103 fields'],
  ['uetr', 'What is a UETR?'],
  ['trace', 'Tracing a payment'],
];

function Section({ id, title, children }) {
  return (
    <Reveal as="section" className="scroll-mt-24 border-t border-line pt-10 first:border-t-0 first:pt-0">
      <h2 id={id} className="heading scroll-mt-24 text-2xl text-ink sm:text-[32px]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[16.5px] leading-[1.7] text-ink-2">{children}</div>
    </Reveal>
  );
}

const FIELDS = [
  [':20:', 'Sender’s reference', 'The sending bank’s reference for this payment.'],
  [':32A:', 'Value date, currency, amount', 'When the funds were sent, in which currency and how much.'],
  [':50K:', 'Ordering customer', 'The sender’s account and name.'],
  [':52A:', 'Ordering institution', 'SWIFT code of the sender’s bank.'],
  [':57A:', 'Account with institution', 'SWIFT code of the recipient’s bank.'],
  [':59:', 'Beneficiary', 'The recipient’s IBAN or account number and name.'],
  [':71A:', 'Charges', 'OUR (sender pays), SHA (shared) or BEN (recipient pays).'],
];

export default function Guide() {
  useTitle('Knowledge centre');
  return (
    <>
      <PageHero
        eyebrow="Knowledge centre"
        title="Payments explained"
        subtitle="SWIFT codes, MT103s and UETRs in plain English — plus how to find a delayed payment."
        overlap={false}
      />
      <Container className="grid gap-12 pb-20 pt-12 sm:pt-16 lg:grid-cols-[220px_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-28 space-y-1 border-l-2 border-line text-sm">
            {TOC.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="-ml-[2px] block border-l-2 border-transparent py-1.5 pl-4 text-sub transition hover:border-navy hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 max-w-[720px] space-y-12">
          <Section id="swift" title="What is a SWIFT / BIC code?">
            <p>
              A SWIFT code — officially a Business Identifier Code (BIC) — identifies a bank in an international transfer. It’s 8 or
              11 characters: a 4-letter bank code, a 2-letter country code, a 2-character location code and an optional 3-character
              branch code.
            </p>
            <p>
              Find your own bank’s code in online banking, on a statement, or by asking the bank. For a recipient’s bank, ask the
              recipient — then{' '}
              <Link to="/#check" className="font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4">
                check it here
              </Link>{' '}
              before you pay.
            </p>
          </Section>

          <Section id="iban" title="SWIFT code vs IBAN">
            <p>
              The SWIFT code says <strong>which bank</strong>. The IBAN (International Bank Account Number) says{' '}
              <strong>which account</strong> at that bank, and is used across Europe, the Middle East and many other countries. In
              the US you’ll use an account number and routing number instead.
            </p>
          </Section>

          <Section id="mt103" title="MT103 fields">
            <p>
              An MT103 is the standard SWIFT message a bank sends for a single customer payment. If a payment is late, your bank can
              give you a copy as proof it was sent. These are the fields that matter most:
            </p>
            <div className="overflow-hidden rounded-2xl border border-line">
              <table className="w-full text-left text-[15px]">
                <tbody>
                  {FIELDS.map(([tag, name, desc]) => (
                    <tr key={tag} className="border-b border-line last:border-b-0">
                      <td className="w-[70px] bg-paper px-3 py-3 align-top font-mono font-bold text-ink sm:w-[84px] sm:px-4">{tag}</td>
                      <td className="px-3 py-3 sm:px-4">
                        <p className="font-semibold text-ink">{name}</p>
                        <p className="text-sub">{desc}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Mt103Sample />
          </Section>

          <Section id="uetr" title="What is a UETR?">
            <p>
              The UETR (Unique End-to-end Transaction Reference) is a 36-character ID such as{' '}
              <code className="break-all rounded bg-paper px-1.5 py-0.5 font-mono text-[14px]">eb6305c9-1f7f-49de-aed0-16487c27b42d</code>.
              It stays with the payment from bank to bank, and banks use it to follow the payment through SWIFT gpi. Only banks can
              look it up — it isn’t a public tracking number.
            </p>
          </Section>

          <Section id="trace" title="Tracing a delayed payment">
            <ol className="space-y-5">
              {[
                ['Give it time', 'Most SWIFT payments arrive in 1–4 business days. Weekends, holidays and currency conversion add time.'],
                
              ].map(([t, b], i) => (
                <li key={t} className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="grid size-9 place-items-center rounded-full bg-navy text-sm font-bold text-gold">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-ink">{t}</p>
                    <p className="text-sub">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          

          <Reveal>
            <Button asChild variant="gold" size="xl">
              <Link to="/#check">
                Check a SWIFT code <ArrowRight />
              </Link>
            </Button>
          </Reveal>
        </article>
      </Container>
    </>
  );
}
