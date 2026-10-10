# Production enhancement implementation — 10 October 2026

The implementation preserves Asha, Kabir, Dadi, five evidence cores, ordered installation, native human animation clips, the researcher's outside containment path, and the clinic night-reserve dilemma. `rules.js` is unchanged. Collision, district coordinates and unlocks continue to come from `layout.js`. New dialogue, names and map controls use translation keys.

## Delivered

| Phase | Implementation |
| --- | --- |
| 1 — Physics | Traffic advances in the fixed physics loop. Every step separates pedestrians and cars independently of the damage cooldown. Interior and rotated contacts produce surface normals; cars use complete separating-axis translation. Walking acceleration/deceleration, lateral slip grip, normal-based bounce, suspension bob and 0.15 m movement sweeps are integrated. Small support-height changes follow the floor; roof access retains the explicit ladder. |
| 2 — Audio | Reusable city/lab loops crossfade through independent gains. Road proximity, canal proximity, driving engine/idle, speed wind, carried-core hum and heat pulses mix continuously. Horn (H), braking, traffic, radio crackle, character blips, progress, ladder, pickup, unlock and menu sounds are wired to gameplay. District scales and faster high-heat music support the score. |
| 3 — Presentation | High quality uses an additive bright-neighbour bloom pass, depth-based contact shading and district grading. Low/adaptive quality and unsupported float-render-target devices bypass the pass. Sky colours follow story-day progression. Pooled dust, sparks, canal splashes, traffic exhaust and grove fireflies supplement existing ecology/core effects. Shaft light cones approximate mist; installed cells intensify the reactor pulse. Compatible bones receive subtle breathing and nearby NPC head turns. Reduced motion suppresses decorative movement. |
| 4 — Conversations | Radio and story lines share queued typewriter dialogue, portraits, translated names, individual blips, manual advance and timed advance. Opening panorama, task radio, stone pickup, descent, researcher handover and Asha/Dadi ending exchanges are integrated. Live-region text is announced once per line. Conversations continue in movement-free mode and pause with menus/hidden tabs. |
| 5 — Navigation | Directional pulsing player icon, district labels/checkmarks and terrain colours, persistent exploration fog, bounded recent-path trail and pulsing objectives. Full map has zoom buttons, reset, pointer pan, wheel zoom and keyboard controls. Breadcrumbs bob/pulse, objectives have distant light columns and distance formatting supports kilometres. |
| 6 — Resources | Traffic uses a spatial broad phase and skips underground collision work. Existing spatial chunk bounding spheres remain active. Distant building facade detail drops after 120 m while base boxes remain. Signs share a canvas atlas; lab boxes now batch by geometry/material. Surface effects reuse typed buffers. World teardown disposes unique geometry, materials and textures. |

## Deliberate implementation limits

- Bloom and contact shading use one screen pass; the contact shading is a lightweight depth approximation rather than a full multi-pass SSAO pipeline. Shaft mist uses translucent geometry rather than volumetric ray marching; heat shimmer is a restrained screen overlay.
- Roof transitions preserve the school's explicit support bounds and ladder. This does not introduce arbitrary terrain slopes or change navigation geometry.
- City and lab materials stay cached while both scenes are reused. Disposing them on every elevator transition would repeatedly re-upload assets. Disposal occurs at world teardown instead.
- The optional rain effect is available in the sound system; this change does not add a weather simulation.
- New English keys follow the existing translation fallback. Full Hindi/Arabic dialogue translation remains a release task.

## Validation and reproduction

Run `npm test`, `npm run build`, and the existing `tests/browser-smoke.mjs` with Playwright available. Added regression tests exercise fully interior/rotated vehicle contact, crossed-car separation, traffic during cooldown at 30/60/144 Hz, tangential bounce, lateral grip, queued conversations, cancellation and reduced motion.

Browser verification covers actual city movement, native models, eight traffic vehicles, six guards, a sustained render soak, ecology effects and a physical 24 m elevator round trip. A separate movement-free journey covers all five missions, ordered installation, the real verdict API, the green ending (reserve 14) and restart without loading models. Map controls and live dialogue receive a targeted browser check. A standalone high-quality presentation fixture renders without WebGL errors.

Software-rendered Chrome reported 3–6 FPS in local soak runs. These checks establish functional behaviour, not hardware performance. Full physical traversal of all five districts and target desktop/mobile frame pacing, thermals, memory and touch checks remain release gates. No deployment or publication was performed.

Final automated result: **59 tests passed**, production build passed, and whitespace checks passed. Browser checks passed for city movement/rendering, physical elevator round trip, five-mission accessibility journey and restart, map zoom/pan/keyboard input and character dialogue. Screenshots are retained in `outputs/production-enhancement/`.
