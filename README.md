# Mission 2050 — Aakhri Saans / Adventure V2

A complete browser adventure loop in Suryanagar: animated human characters, third-person exploration, rooftop tasks, river investigation, a drivable electric utility vehicle, five carried energy stones, manual reactor assembly, original synthesised music and three consequence-based endings.

## Play

Double-click **Start Game.cmd**, leave its window open, then visit http://127.0.0.1:4185 in Chrome or Edge. Alternatively, with Node.js 20+ installed, run `npm run dev`. No dependency installation is required. Click Enter City; music starts with that gesture. Use headphones for the five distinct assembly motifs.

WASD / arrows: move; Shift: sprint; mouse drag: orbit view; mouse wheel: camera distance; C: chase / wide / first-person; Space: jump or vehicle brake; hold E near a glowing task: work; Q: scanner and hold for scan tasks; F near the amber vehicle: enter / exit; M: map; Esc: pause. Touch has direction, action, camera, scan, vehicle and jump buttons. The compass points to the nearest available task; the map shows all available tasks.

Collect a stone after each mission, physically return to the lab, and hold E at the console. The next district unlocks only after assembly. Five assemblies unlock final activation. Shade cools heat stress; exhaustion returns Asha to the lab without discarding task progress. Traffic can cause a heat penalty. Progress saves in this browser. New Adventure resets it.

Settings offers High/Low quality, volume, and a clearly labelled movement-free accessibility fallback. Main play uses spatial tasks rather than question-and-answer popups. English is complete; Hindi covers the main objectives/actions but some radio/settings copy falls back to English. Arabic is a partial RTL UI preview; Expanded Text is a testing locale.

## Build and Vercel

Run `npm test` and `npm run build`. Push this complete folder to GitHub and import into Vercel. Choose **Other**, Build Command **npm run build**, Output **dist**, Node **20+**. Keep `vercel.json`, `api`, `src`, `public/vendor` and `public/models`. No environment variables or database are needed. The final verdict is recomputed by `/api/verdict`; offline/API failure uses a labelled local verdict. Deploy a preview and smoke-test before production. This project has not been published to your account.

The included launcher can use the bundled Node runtime on this computer; other computers need Node 20+. Do not open index.html directly: ES modules and the API need a server.

## Scope and credits

This is a browser adventure prototype with a full playable path. The city and vehicles remain procedural/stylised; characters use representative Mixamo models. It is not GTA/Marvel/AAA production artwork, combat, a huge open world, or licensed superhero content. No online multiplayer, accounts or purchases. Physical phone performance and real-player playtests remain release checks; displayed FPS is live, not a guarantee.

See GAME_DESIGN.md, ARCHITECTURE.md, VALIDATION.md and CREDITS.md. Story adapted from your supplied Mission 2050 documents. All environmental/budget figures are fictional teaching units. “Saans koi score nahi.”
