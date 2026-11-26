import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/** Real country flag (SVG from flag-icons, served from /flags). */
export function Flag({ code, className }) {
  return (
    <img
      src={`/flags/${code}.svg`}
      alt=""
      width="24"
      height="18"
      loading="lazy"
      decoding="async"
      className={cn('inline-block aspect-[4/3] h-[18px] w-6 shrink-0 rounded-[3px] object-cover ring-1 ring-black/10', className)}
    />
  );
}

const AVATAR_TONES = [
  ['#e8eefb', '#1c3f99'],
  ['#e6f4ee', '#0c6b49'],
  ['#fbefe4', '#9a4a0b'],
  ['#f1eafb', '#5f2fae'],
  ['#e9f1f4', '#1f5568'],
  ['#f8e9ec', '#9b2c45'],
  ['#eef0e4', '#4d5a16'],
];
const SKIP = new Set(['THE', 'OF', 'AND', 'DE', 'DU', 'LA', 'LE', 'DES', 'DEL', 'DI', 'S.A.', 'SA', 'AG', 'PLC', 'LTD', 'LTD.', 'LIMITED', 'N.A.', 'NA', 'INC', 'CO', 'CO.', 'SPA', 'S.P.A.', 'N.V.', 'NV', 'PJSC', 'JSC', '&']);

function initials(name = '') {
  const words = name
    .toUpperCase()
    .replace(/\(.*?\)/g, ' ')
    .split(/[\s,\-/]+/)
    .filter((w) => w && !SKIP.has(w) && /[A-Z]/.test(w));
  if (!words.length) return '·';
  if (words.length === 1) return words[0].replace(/[^A-Z0-9]/g, '').slice(0, 2);
  return (words[0][0] + words[1][0]).replace(/[^A-Z0-9]/g, '');
}

/**
 * Bank badge: the bank's official icon when we have one, otherwise a monogram
 * with a stable colour per name. Falls back to the monogram if the image fails.
 */
export function BankAvatar({ name, src, size = 40, className }) {
  const [failed, setFailed] = useState(false);
  const shape = 'inline-grid shrink-0 place-items-center overflow-hidden';
  const radius = Math.round(size * 0.26);
  if (src && !failed) {
    return (
      <span
        aria-hidden="true"
        className={cn(shape, 'bg-white ring-1 ring-black/[0.08] shadow-[0_1px_2px_rgba(11,31,58,0.06)]', className)}
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-contain"
          style={{ padding: Math.max(2, Math.round(size * 0.1)) }}
        />
      </span>
    );
  }
  let h = 0;
  for (const c of name || '') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [bg, fg] = AVATAR_TONES[h % AVATAR_TONES.length];
  return (
    <span
      aria-hidden="true"
      className={cn(shape, 'font-semibold tracking-tight', className)}
      style={{ width: size, height: size, borderRadius: radius, background: bg, color: fg, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}

/** Overlapping row of bank logos (e.g. the biggest banks in a country). */
export function LogoStack({ srcs, size = 26, max = 4 }) {
  if (!srcs?.length) return null;
  return (
    <span className="flex items-center" aria-hidden="true">
      {srcs.slice(0, max).map((src, i) => (
        <span
          key={src}
          className="inline-grid place-items-center overflow-hidden rounded-full bg-white ring-2 ring-white shadow-[0_0_0_1px_rgba(11,31,58,0.10)]"
          style={{ width: size, height: size, marginLeft: i ? -size * 0.3 : 0, zIndex: max - i }}
        >
          <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" className="size-full object-contain p-[3px]" />
        </span>
      ))}
    </span>
  );
}

export function Reveal({ children, className, delay = 0, as = 'div' }) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}

export function Container({ className, children }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

export function Eyebrow({ children, className }) {
  return <p className={cn('text-[13px] font-semibold uppercase tracking-[0.14em] text-seg-bank', className)}>{children}</p>;
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-paper', className)} />;
}
