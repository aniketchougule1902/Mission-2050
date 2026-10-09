# Adventure V2 architecture

Locally vendored Three.js 0.180.0, browser ES modules, semantic DOM HUD/menus, Node20+ preview/build/test, and Vercel static dist plus a Node verdict function. No runtime CDN, framework dependency or package installation. Next.js is unnecessary for this scoped single-player game.

## Boundaries

- rules.js: deterministic climate decisions, budget arithmetic, ending gates and server replay.
- adventure.js: pure physical task prerequisites, stone carrying/assembly order, checkpoint reconstruction and stable action IDs. Only assembling advances the district.
- controller.js: animated humans, locomotion, gravity/jump, camera orbit/collision, ladder tween, driving, traffic penalties, visual work pose, world action markers, carry props, reactor/VFX and final cinematic.
- world.js: procedural environment, shared materials/geometries, batched static meshes, simple obstacle data, water and lighting.
- app.js: actual input, hold-to-work proximity, mission state, HUD/map, radio, menus, heat, persistence, local events, accessibility and server verdict.
- locale.js + adventure-locale.js: stable translation keys; complete English, partial Hindi radio/settings fallback, expansion locale and partial Arabic RTL preview.
- audio.js: gesture-initialised AudioContext, original generated score and per-stone/equipment/UI effects, volume, hidden-tab suspension.

Collision uses simple x/z footprints separate from visual meshes. Roof support and ladder destinations use explicit height bounds; jump uses capped elapsed time and gravity. Human bone animation does not move the collision body. Source animations transfer relative to each skeleton's rest pose rather than applying raw export-axis quaternions. Vehicle inertia, reverse, steering, brake and bounce are arcade approximations. Camera obstruction uses cheap obstacle sampling. There is no combat, so attack hitboxes/hurtboxes or weapon traces are not applicable. Heat/traffic are the damage model.

Assembly and final activation run controlled animation states and promises. Inputs are locked; audio/particles/camera remain active. Pool particles in typed arrays; do not allocate a particle object per frame. Static boxes batch by material. NPC mixers only update near the player. Low profile caps resolution1× and disables shadows; High caps1.5× with1024 shadow maps. Human models and a1K HDR are local assets; procedural sky/body fallbacks handle failures. Future art exports should keep simplified collision, glTF skeleton naming, compressed textures, texture/triangle budgets and LODs.

## Backend and security

POST /api/verdict validates four ordered decisions, known unique budget entries, player count and100-unit cap, then replays rules. Client totals are ignored. It does not prove that a human completed field tasks. Invalid payload400, oversized413, unsupported method405. No data storage, secrets, authentication, purchases, public leaderboard or cloud saves. Client remains playable with a clearly labelled local verdict on API failure. Functions never write files. Same-origin CSP and restricted permission headers are included; no permissive CORS.

## Saves, controls and automation

m2050.adventure.v2 is isolated from V1 saves. Ordered assembled sockets, carried stage and reconstructed climate state are checked. Autosave after actions, pause, every5 seconds and pagehide. Local storage failure is nonfatal. Menus use semantic buttons, visible focus and focus trapping. Mobile hold controls and short-tap movement share the real simulation; pointer-capture loss must not cancel the short-tap movement timer. Release is required between actions.

Read-only #game-state JSON and window.mission2050.snapshot() expose screen, cloned adventure state, nearest task, position, driving/model status, locale and a200-event memory buffer. No remote mutation/admin API. Test through actual controls; the movement-free fallback is explicitly labelled and should not count as a complete physical route test.

Events include app.ready, menu.view, adventure.start, task.complete, stone.collect, assembly.start/complete, ending.view, vehicle.toggle, player.traffic_hit, player.heat_exhaustion, action.rejected, save.failure and models.ready. Language-independent IDs; locale as context. CustomEvent stream and bounded local buffer only; no transmission/provider. Remote analytics adapters must be opt-in and failure-safe.

Audio is generated rather than downloaded: staggered score notes, gain ramps, stereo assembly harmonics, noise/impact transients, scanner, footsteps and vehicle cues. Distinct stone motifs preserve the user's assembly fantasy without copying franchise music. Gesture autoplay restrictions, mute/volume and visibility suspension are handled. No video pipeline is needed in this slice.

## Release

CI runs tests/build. Preview on Vercel with the included configuration; verify every asset and server verdict, good route and missing-backup route. Promote only after preview smoke checks and real-player/device checks. Roll back by restoring the prior Vercel deployment. There are no database migrations. Source and zip are reproducible; exclude .git, secrets and caches. Production monitoring, durable backend features, physical phone measurements and external playtest evidence are future gates, not claimed complete.
