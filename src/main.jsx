import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Layout from './components/site/Layout';
import Home from './pages/Home';
import './index.css';

const Result = lazy(() => import('./pages/Result'));
const Countries = lazy(() => import('./pages/Countries'));
const Country = lazy(() => import('./pages/Country'));
const Guide = lazy(() => import('./pages/Guide'));
const Track = lazy(() => import('./pages/Track'));
const TrackResult = lazy(() => import('./pages/TrackResult'));

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="display text-7xl text-navy/15">404</p>
      <h1 className="heading mt-2 text-3xl">Page not found</h1>
      <Link to="/" className="mt-6 inline-block rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white">
        Go to the code checker
      </Link>
    </div>
  );
}

const fallback = (
  <div className="grid min-h-[50vh] place-items-center">
    <span role="status" aria-label="Loading" className="size-6 animate-spin rounded-full border-2 border-line border-t-navy" />
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={fallback}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="swift-code/:bic" element={<Result />} />
            <Route path="countries" element={<Countries />} />
            <Route path="countries/:cc" element={<Country />} />
            <Route path="guide" element={<Guide />} />
            <Route path="track" element={<Track />} />
            <Route path="track/:uetr" element={<TrackResult />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
