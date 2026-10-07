# Chavan Udyog Samuh: website design options

A static Next.js 15 site presenting five design directions for the client to compare. A floating
**Design A–E** switch (bottom-left) moves between them.

| Route | Option |
| --- | --- |
| `/` | **A**: dark and gold, with expanding business panels and the 3D sketch journey |
| `/option-b/` | **B**: paper and ink sketchbook |
| `/option-c/` | **C**: A with the 3D diorama journey (dawn to dusk) |
| `/option-d/` | **D**: clean, light and engineered, with a monochrome 3D model |
| `/option-e/` | **E**: monochrome luxury (globe hero, 3D fleet story, milestone road, highway) |

All text lives in [`lib/content.ts`](lib/content.ts). Photography is from Unsplash; brand names are
shown as text, since manufacturer logos need permission.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
```

Requires Node 20 or newer.

## Deploy to Vercel

The project builds as a static export (`output: "export"` in `next.config.ts`); Vercel detects
Next.js automatically, so no extra configuration is needed.

**Option 1: from GitHub (recommended)**
1. Push this folder to a private GitHub repository.
2. In Vercel: **Add New… → Project → Import** the repository.
3. Keep the defaults (Framework: Next.js, Build: `npm run build`) and click **Deploy**.

**Option 2: from the command line**
```bash
npm i -g vercel
vercel login
vercel          # preview deployment
vercel --prod   # production deployment
```

## Demo notes
- The site is marked **noindex** (`robots.txt` and page metadata) so the demo stays out of search
  results. Remove both before the public launch.
- The 3D scenes (Options B–E) use WebGL; test on a real mid-range phone before launch.
- Adding `?snap` to a 3D page URL removes camera smoothing (only used for screenshot checks).
- Still needed from the client: showroom addresses, phone numbers, email, photos of the
  leadership and showrooms, and permission to use brand logos.
