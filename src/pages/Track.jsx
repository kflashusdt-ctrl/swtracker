import ExampleTimeline from '@/components/checker/ExampleTimeline';
import TrackCard from '@/components/checker/TrackCard';
import PageHero from '@/components/site/PageHero';
import { Container, Eyebrow, Reveal } from '@/components/site/bits';
import { useTitle } from '@/lib/hooks';

const POINTS = [
  ['Reported by banks only', 'Statuses come straight from partner banks’ systems. Nobody at BIC Finder can type one in.'],
  ['No personal data', 'We never show names, account numbers or amounts — only where the payment is and when.'],
  ['Honest when empty', 'If no bank has reported your payment, we say so and help you ask your bank to trace it.'],
];

export default function Track() {
  useTitle('Payment status');
  return (
    <>
      <PageHero
        eyebrow="SWIFT gpi status"
        title="Payment status"
        subtitle="Look up the status of an international payment using its UETR — the reference your bank gives you when it sends the money."
      >
        <TrackCard />
      </PageHero>
      
      
    </>
  );
}
