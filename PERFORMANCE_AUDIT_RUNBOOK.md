# Performance Audit Runbook

## Goal
- Keep page load fast and stable while protecting SEO.
- Track Core Web Vitals on every release.

## 1) Pre-Audit Checklist
- Build both apps:
  - `cd frontend/user && npm.cmd run build`
  - `cd frontend/admin && npm.cmd run build`
- Start production preview:
  - `cd frontend/user && npm.cmd run preview`
- Confirm API is up and reachable.

## 2) Lighthouse (Desktop + Mobile)
- Install once:
  - `npm.cmd i -g lighthouse`
- Run audit:
  - `lighthouse https://your-domain.com --view --preset=desktop`
  - `lighthouse https://your-domain.com --view --preset=perf`
- Check these first:
  - LCP
  - CLS
  - INP / TBT
  - Unused JS/CSS
  - Largest payload requests

## 3) DevTools Performance Pass
- Open Chrome DevTools -> Performance.
- Record on homepage + one deep route:
  - `/`
  - `/:university/:course/:semester/:paper`
- Validate:
  - No long main-thread tasks > 200ms
  - No repeated settings/university/course API bursts
  - Smooth interaction on filter/search

## 4) Network/API Checks
- In DevTools Network:
  - Verify cached responses for repeated settings/courses/universities requests.
  - Ensure PDF endpoints return quickly and respect size limits.
  - Ensure no failed 4xx/5xx on critical route transitions.

## 5) SEO Checks
- Validate:
  - Canonical URL updates per route
  - Meta title/description changes per page
  - OG/Twitter tags present
  - `robots.txt` and `sitemap.xml` reachable

## 6) Security Regression Checks
- Verify response headers on backend:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Strict-Transport-Security` (prod)
- Confirm all external links using `_blank` include `rel="noopener noreferrer"`.
- Confirm paper search handles regex safely.

## 7) Release Gates
- Do not release unless:
  - Lighthouse Performance >= 80 (mobile), >= 90 (desktop)
  - No critical console errors
  - No SEO/canonical mismatches
  - No new high-risk security warning
