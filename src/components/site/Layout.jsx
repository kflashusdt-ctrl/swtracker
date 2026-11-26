import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Container, Flag } from './bits';

const NAV = [
  { to: '/', label: 'SWIFT checker', end: true },
  { to: '/countries', label: 'Codes by country' },
  { to: '/track', label: 'Payment status' },
  { to: '/guide', label: 'Knowledge centre' },
];

export function Logo({ light = true }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="BIC Finder home">
      <svg width="26" height="22" viewBox="0 0 26 22" aria-hidden="true">
        <path d="M6 0h20l-6 22H0z" fill="#f4c24d" />
        <path d="M9.5 6.5h9M8.3 11h7.4M7.1 15.5h9" stroke="#0b1f3a" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className={`display whitespace-nowrap text-[19px] leading-none tracking-[0.01em] ${light ? 'text-white' : 'text-navy'}`}>BIC Finder</span>
    </Link>
  );
}

function MenuIcon({ open }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <motion.path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        initial={false}
        d={open ? 'M4 4L16 16' : 'M3 6.5L17 6.5'}
        animate={{ d: open ? 'M4 4L16 16' : 'M3 6.5L17 6.5' }}
        transition={{ duration: 0.2 }}
      />
      <motion.path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        initial={false}
        d={open ? 'M4 16L16 4' : 'M3 13.5L17 13.5'}
        animate={{ d: open ? 'M4 16L16 4' : 'M3 13.5L17 13.5' }}
        transition={{ duration: 0.2 }}
      />
    </svg>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-navy text-white">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `relative whitespace-nowrap px-2.5 py-2 text-[15px] font-medium transition-colors xl:px-3.5 ${isActive ? 'text-white' : 'text-white/70 hover:text-white'}`
              }
            >
              {({ isActive }) => (
                <>
                  {n.label}
                  {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-2.5 -bottom-[13px] h-[3px] rounded-full bg-gold xl:inset-x-3.5" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="gold" size="pill" className="hidden sm:inline-flex">
            <Link to="/#check">Check a code</Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/15 lg:hidden"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </Container>
      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/10 lg:hidden"
          >
            <Container className="flex flex-col py-3">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `border-b border-white/10 py-4 text-lg font-medium last:border-b-0 ${isActive ? 'text-gold' : 'text-white'}`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
              <Button asChild variant="gold" size="xl" className="mt-3 mb-2">
                <Link to="/#check">Check a SWIFT code</Link>
              </Button>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

const FOOT_COUNTRIES = [
  ['GB', 'United Kingdom'],
  ['US', 'United States'],
  ['DE', 'Germany'],
  ['AE', 'United Arab Emirates'],
  ['IN', 'India'],
  ['SG', 'Singapore'],
];

function Footer() {
  return (
    <footer className="bg-navy text-white">
  <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr] lg:py-16">
    <div className="space-y-4">
      <Logo />
      <p className="max-w-xs text-sm leading-relaxed text-white/65">
        Independent SWIFT Tracker & Database of Correspondent Relations
      </p>
    </div>
    <FooterCol title="Tools">
      <FooterLink to="/">SWIFT / BIC checker</FooterLink>
      <FooterLink to="/countries">Codes by country</FooterLink>
      <FooterLink to="/#popular">Popular bank codes</FooterLink>
      <FooterLink to="/track">Payment status (UETR)</FooterLink>
    </FooterCol>
    <FooterCol title="Knowledge centre">
      <FooterLink to="/guide#swift">SWIFT codes explained</FooterLink>
      <FooterLink to="/guide#mt103">MT103 fields</FooterLink>
      <FooterLink to="/guide#uetr">What is a UETR?</FooterLink>
      <FooterLink to="/guide#trace">Tracing a payment</FooterLink>
    </FooterCol>
    <FooterCol title="Popular countries">
      {FOOT_COUNTRIES.map(([cc, name]) => (
        <li key={cc}>
          <Link to={`/countries/${cc}`} className="inline-flex items-center gap-2.5 text-white/70 transition hover:text-white">
            <Flag code={cc} className="h-[14px] w-[19px]" />
            {name}
          </Link>
        </li>
      ))}
    </FooterCol>
  </Container>

  {/* Bottom Legal Section */}
  <div className="border-t border-white/10">
    <Container className="flex flex-col gap-6 py-8 text-xs leading-relaxed text-white/50 lg:flex-row lg:items-center lg:justify-between">
      <p className="whitespace-nowrap">© {new Date().getFullYear()} BIC Finder.</p>
      
      <div className="max-w-4xl space-y-2 lg:text-right">
        <p>
          Copyright 2022-2026. BIC Findern Limited, registered under the laws of the United Kingdom (Company Number: 15431563).
          {' '}
          
        </p>
        <p>
          <strong>Disclaimers:</strong> SWIFT, UETR and GPI are trademarks owned by S.W.I.F.T. SCRL, which is headquartered at Avenue Adele 1, 1310 La Hulpe, Belgium. We are not in any way affiliated with S.W.I.F.T. We do not provide any financial services.
        </p>
      </div>
    </Container>
  </div>
</footer>
  );
}

function FooterCol({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="text-white/70 transition hover:text-white">
        {children}
      </Link>
    </li>
  );
}

export default function Layout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
