# Mission 2050 Aakhri Saans

A playable climate adventure: 3D exploration, five evidence missions, original music, shared-device team play, three endings, saved progress, and English/Hindi.

## Play locally

Install Node.js 20 or newer. Open this folder in a terminal and run:

```sh
npm run dev
```

Open http://127.0.0.1:4185. Click the music button to enable audio. No dependency installation is needed; Three.js is packaged locally.

## Verify and build

```sh
npm test
npm run build
```

## Deploy to Vercel

1. Push this complete folder to a new GitHub repository, including `public/vendor`, `api`, and `src`.
2. Import the repository into Vercel.
3. Framework Preset: **Other**. Build Command: **npm run build**. Output Directory: **dist**. Node: **20 or newer**.
4. Keep the included `vercel.json`. No environment variables or database are needed.
5. Deploy a preview, complete a mission, test music and the final verdict, then promote to production.

CLI alternative: `npx vercel`, inspect the preview, then `npx vercel --prod`. This project is prepared for deployment; it is not already published. The backend uses Vercel's Node function support: https://vercel.com/docs/functions/runtimes/node-js

## Three-minute demonstration

0:00–0:30: Dadi needs the fan; ECO-CORE misses individual needs.

0:30–1:40: show clinic, roof, land and river evidence and their consequences.

1:40–2:20: test buses/cycling/training without backup, show clinic failure; amend to the 100-unit plan with protected backup.

2:20–3:00: activate the fair plan, explain illustrative numbers and ongoing recovery, and show the source and SDG connection.

See GAME_DESIGN.md, ARCHITECTURE.md and VALIDATION.md. 2–4 players take turns on one device; there is no online multiplayer. Arabic is a partial RTL UI preview with English fallback.

Credits: participant story and attached storybook; Codex-assisted code, procedural art and original synthesised music. Three.js MIT license included. No sample-game artwork, music or copyrighted characters reused.
