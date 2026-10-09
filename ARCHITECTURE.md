# Architecture and release foundations

Three.js 0.180.0 is locally vendored with MIT license. Plain ES modules and semantic DOM overlays keep the game small. Node 20+ runs tests/build/local preview. Vercel serves static `dist` plus `api/verdict.js`. Next.js is unnecessary for this scoped game.

## Module boundaries

`rules.js`: pure deterministic choices, budget checks, endings, replay and save reconstruction.

`world.js`: rendering, camera, simple player/obstacle footprints, procedural locomotion and environment motion, quality profiles.

`app.js`: screen state machine, actual inputs, DOM menus, autosave, local analytics, server verdict.

`locale.js`: stable English/Hindi keys, expansion pseudolocale, partial Arabic RTL UI preview.

`audio.js`: lazy AudioContext, original music sequence, effects and gain control.

Rules must not depend on rendering or locale. Detailed visual meshes remain separate from collisions. Movement normalizes diagonal speed and clamps elapsed time. Limb animation has no collision effect. There is no combat, so hitboxes, hurtboxes, traces and damage physics are out of scope.

## Backend and trust

POST `/api/verdict` validates four ordered choices, 1–4 players, unique known budget entries and the 100-unit cap. It recomputes totals from decisions, ignoring client meters/scores. Invalid input returns 400, unsupported methods 405 and oversized payloads 413. It stores no data and needs no secrets. This checks plan arithmetic; it does not prove a human played the run. No accounts, online multiplayer, purchases, cloud saves or public leaderboard are implemented. Future competitive features require authenticated durable storage and signed sessions.

The client remains playable if the API fails and labels the verdict local. Vercel functions never write files. CSP limits assets/scripts/connections to same origin; headers deny camera, microphone and geolocation. No permissive CORS is included.

## Automation and analytics

`window.mission2050.snapshot()` provides a cloned read-only semantic view of screen, state, report, locale and bounded events. It contains no secrets and exposes no mutation or remote-admin endpoint. Tests use real DOM buttons via stable `data-action` IDs and actual keyboard/touch inputs, then assert the snapshot and capture frames.

Events: app.ready, renderer.unavailable, mission.start, onboarding.city_enter, menu.view, mission.open, evidence.inspect, decision.commit, budget.change, night_test.complete, plan.amend, ending.view, mission.restart, settings.quality, audio.toggle, save.failure, server.unavailable, performance.low_fps. IDs are language independent; locale is contextual. Events remain in a bounded in-memory buffer and CustomEvent stream. No analytics transmission/provider is enabled. Future providers must fail safely.

## Persistence and localization

Versioned local saves reconstruct meters and points by replay. Corrupt/invalid order and unknown budget entries fail safely. localStorage errors do not stop gameplay. Save after decisions, budget changes, pause, periodically during walking and pagehide.

English and Hindi are supported; Hindi uses system Devanagari fonts. Pseudolocalization expands vowels. Arabic is explicitly a partial UI preview with English fallback, requiring human translation before release as a full language. Flexible scrolling panels support expansion and RTL inspection. Stable IDs stay independent of translated copy. Buttons have focus/disabled/selected/pressed states. Essential information never depends on sound.

## Optimized assets and audio

Shared box geometry and cached materials; simple collision footprints; tiny generated sign textures; capped pixel ratio; modest view distance; no video or external fonts. Music starts with a gesture, uses gain ramps, short effects and a small generated sequence, and suspends when hidden. Future authored art should use optimized glTF, LODs, texture budgets and simplified collision meshes. No Blender source or giant texture assets belong in public builds.

## Release process

Run `npm test` and `npm run build`, then smoke-test packaged assets and the API in a Vercel preview. CI runs tests/build on push and pull request. Test canonical green route and missing-backup failure before promotion. Retain a previous Vercel deployment for rollback. No database migrations/backups apply until durable storage exists. Physical iOS/Android frame pacing, heat/memory/lifecycle measurements, newcomer playtests and production-network testing remain unverified release gates.
