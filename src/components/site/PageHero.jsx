import BlurText from '@/components/reactbits/BlurText';
import { cn } from '@/lib/utils';
import { Container } from './bits';

/** Navy band with a big display headline. `children` overlaps the band (like a floating card). */
export default function PageHero({ eyebrow, title, subtitle, children, className, align = 'center', overlap = true }) {
  const center = align === 'center';
  return (
    <>
      <section className={cn('relative overflow-hidden bg-navy text-white', className)}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />
        <Container className={cn('relative pt-10 sm:pt-14', overlap && children ? 'pb-32 sm:pb-40' : 'pb-14 sm:pb-20', center && 'text-center')}>
          {eyebrow && <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/60">{eyebrow}</p>}
          <BlurText
            as="h1"
            text={title}
            animateBy="words"
            delay={90}
            direction="bottom"
            distance={24}
            className={cn(
              'display text-gold text-[40px] min-[400px]:text-[46px] sm:text-[68px] lg:text-[84px] gap-x-[0.22em]',
              center && 'justify-center',
            )}
          />
          {subtitle && (
            <p className={cn('mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/75 sm:text-lg', center && 'mx-auto')}>
              {subtitle}
            </p>
          )}
        </Container>
      </section>
      {children && (
        <Container className={cn('relative z-10', overlap ? '-mt-24 sm:-mt-28' : 'mt-8')}>{children}</Container>
      )}
    </>
  );
}
