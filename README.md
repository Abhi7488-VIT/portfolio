# Abhishek Kumar: AI + Data Engineer

A "mission control" portfolio: a live operations console for a builder. React + TypeScript + Vite,
Tailwind v4, GSAP + ScrollTrigger, Lenis, and Framer Motion (lazy, for the palette and chat only).

**Scores on the production build (Lighthouse 12):** mobile 96–97 / 100 / 100 / 100,
desktop 100 / 100 / 100 / 100. CLS 0. Scroll holds 60 fps (p95 frame 16.9 ms) in both themes.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check, bundle, then pre-render the hero into dist/index.html
npm run preview    # serve dist/ at http://localhost:4173 (test performance here, not in dev)
```

Requires Node 20+.

## Edit everything in one place

| What | Where |
| --- | --- |
| Every word, number, link, the skill graph, the chat knowledge base, easter-egg phrases, SEO title and description | `src/content/content.ts` |
| Colours, fonts, type scale, spacing, motion durations and easings (CSS) | `src/styles/tokens.css` |
| Motion tokens for GSAP / Framer Motion (keep in step with tokens.css) | `src/lib/motion.ts` |

Before launch, in `content.ts`:

1. **`FORMSPREE_FORM_ID`**: create a form at [formspree.io](https://formspree.io) and paste its ID.
   Until then the form says plainly that it isn't connected and sends nothing.
2. **`links.siteUrl`**: your production URL. On Vercel this is filled automatically from the
   production domain at build time; set it (or a `SITE_URL` env var) for any other host.

Things to confirm (each is a reasonable reading of the résumé, marked `CONFIRM` in the file):
the one-line descriptions of the six AgentFlow nodes (names come from the repo's architecture
diagram), the About ticker's "sharpening" list, and the short console-log lines.

## Deploy to Vercel

**Dashboard (easiest):** push this folder to a GitHub repo, then on vercel.com choose
*Add New → Project*, import the repo and press *Deploy*. `vercel.json` already sets the Vite
framework, `npm run build`, the `dist` output, long-lived caching for hashed assets and
security headers.

**CLI:**

```bash
npm i -g vercel
vercel          # first run links the project and makes a preview deploy
vercel --prod   # production
```

After the first production deploy, open the URL, share it once to check the Open Graph card
(`/og.png`), and submit `/sitemap.xml` in Google Search Console.

## How it's built

- **Pre-rendered first screen.** `scripts/prerender.mjs` renders the nav and hero to HTML at
  build, so the name paints with the HTML on a phone, before any JavaScript. The app script is
  started only after the first contentful paint, then React takes over with the identical tree
  and plays the boot (the name decodes in place; nothing jumps).
- **One animation loop.** GSAP's ticker drives Lenis, ScrollTrigger, the node field, the skill
  physics, the pipeline packets, the cursor and the marquee (`src/lib/gsap.ts`). Lenis re-syncs if
  anything outside it moves the page (scrollbar, Find, assistive tools).
- **Code-split.** First load: React, GSAP, Lenis and the app (~141 KB gzip). The sections below
  the hero mount one per idle slice; the palette, chat, pipeline dock and easter eggs (with Framer
  Motion) load once the page is idle.
- **Fonts.** Self-hosted. A 21 KB "hero" cut of Archivo (only the first screen's glyphs) is
  preloaded; the full face (axes trimmed to what the CSS uses) and an 8 KB static Martian Mono load
  from CSS. Rebuild them from `fonts-src/` with `pip install fonttools brotli`, then
  `npm run build && python scripts/fonts.py && npm run build`
  (paste the printed `unicode-range` into `tokens.css` if the hero copy changed).
- **Adaptive effects.** `src/lib/perf.ts` picks particle counts and pixel ratio from the device and
  drops a quality level if frames run long. Canvas loops pause off-screen and in hidden tabs.
- **Reduced motion.** Follows the OS setting until the visitor uses the on-page switch. Movement
  becomes fades; the design stays.

## Features

| Feature | How to try it |
| --- | --- |
| Command palette | Ctrl K (⌘ K on Mac), or the nav / phone menu |
| Ask my résumé | Bottom-right. Answers only from `knowledgeBase` in content.ts; anything else gets an honest fallback |
| CI pipeline progress | Bottom-left after the hero: stages per section, streaming log, click a stage to jump |
| Easter eggs | Type `sudo hire abhishek`, the Konami code, or `status` (outside any field). DevTools has a greeting |
| Themes | Console (dark) and Blueprint (light), wiped in from the switch you press |

## File tree

```
├── index.html                 meta/OG/icons; %TOKENS% filled from content.ts at build
├── seo.plugin.ts              injects SEO + JSON-LD, emits sitemap.xml and robots.txt
├── vite.config.ts             chunking (react / gsap / lenis / motion)
├── vercel.json                build settings, caching, security headers
├── scripts/
│   ├── prerender.mjs          renders the hero into dist/index.html, starts the app after FCP
│   └── fonts.py               rebuilds the subset fonts from fonts-src/
├── fonts-src/                 original Archivo + Martian Mono (OFL)
├── public/
│   ├── Abhishek_Kumar_Resume.pdf
│   ├── og.png, favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192/512.png, site.webmanifest
│   ├── fonts/                 archivo-hero, archivo-var, martian-mono (woff2)
│   └── work/                  project captures (WebP, 800 + 1600)
└── src/
    ├── main.tsx, App.tsx, prerender.tsx
    ├── content/content.ts     ← all copy, links, skills, knowledge base
    ├── lib/                   motion tokens, gsap loop, lenis scroll, perf governor, kb matcher,
    │                          scramble/decode, count-up, confetti, colour tokens for canvas, event bus
    ├── hooks/                 prefs (theme + motion), useReveal (section entrances)
    ├── components/
    │   ├── Nav, Backdrop, Cursor, Magnetic, Tilt, Switch, SystemToggles, SectionTitle, Toast, Marquee, Footer
    │   ├── hero/              node field (2D canvas) + React wrapper
    │   ├── work/              AgentFlow graph, CommerceLens lab, NSE chart + t-stat, capture lens, meta
    │   ├── skills/            constellation physics
    │   └── features/          command palette, chat, pipeline dock, easter eggs (lazy chunk)
    ├── sections/              Hero, About, Work, Experience, Skills, Record, Contact, Below (lazy)
    └── styles/                tokens, base, index (Tailwind + stamp), chrome, hero, sections, work, features
```

## Honesty notes

- Every figure on the page is from the résumé. The NSE equity curves are **illustrative shapes**
  (labelled on the chart); the t-stat, the cost and the sign of every Sharpe are real.
- The CommerceLens what-if only interpolates the résumé's own scenario (halving late deliveries ≈
  1,700 fewer low reviews); it never extrapolates past it.
- Project pictures are real captures: AgentFlow's live demo landing page, and the CommerceLens and
  NSE repositories (the Streamlit app was asleep when captured; a dashboard capture would be better).
- The phone number appears nowhere on the site. Note that the downloadable résumé PDF contains it.

## Design checks

Built with two design skills: *design-taste-frontend* (art direction and a real-browser inspector)
and *Hallmark* (anti-template rules; custom "Mission Control" theme). The final build passes
Hallmark's sweep with 0 FAIL / 0 WARN and the taste inspector with 0 FAIL; deliberate exceptions
the brief asked for (mono data labels, grid lines, glow) are waived on the record at the top of
`src/styles/index.css`.
