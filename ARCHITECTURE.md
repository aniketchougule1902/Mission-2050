# Adventure V3 architecture

## Runtime and boundaries

Locally packaged Three.js r180, browser ES modules and a semantic DOM HUD. Node20+ serves/builds/tests; Vercel hosts static dist plus a Node verdict endpoint. No installed runtime packages or CDN required.

- rules.js: deterministic decisions, budgets, final gates and server replay.
- adventure.js: pure task prerequisites, carried stones, ordered underground installation, locations and save reconstruction.
- layout.js: shared metre-based district regions, unlock corridors, task coordinates, footprint collision, roof support and A* route finding. Map and simulation use this layout.
- city.js / world.js: photographed PBR city surfaces, detailed buildings, static batching, scanned decoration loading, surface entrance and underground lab.
- engine.js / controller.js: native character animation, locomotion, camera, ladder, driving, distance culling, markers, breadcrumbs, lift and researcher/core cinematics.
- reactor-model.js: authored detailed core with pipes, layered base, containment, rings, clamps and five stone cells; also exports to GLB through the asset pipeline.
- quest.js: milestone checklist from stable task IDs.
- app.js: real input/proximity work, HUD/map, local events, saves, heat, menus, accessibility and final API verdict.
- locale.js / adventure-locale.js / expansion-locale.js: stable English keys, partial Hindi/Arabic previews and long-text locale. Complete translation QA is still needed.
- audio.js: gesture-started original synthesised score/effects, per-stone activation, lift, doors, transfer, steps, scanner and vehicle, volume and visibility handling.

## Character and physical representation

Soldier.glb uses its own native Idle/Walk/Run clips, never another character's bone tracks. A1.78m character group holds the skinned model and simple collision body separately. The doctor/NPCs are clones with representative material/coat changes. Bone animation cannot shift collision alignment. Movement delta is capped, jump uses gravity, roof support uses explicit bounds, and the ladder is a controlled transition. No combat hitboxes/hurtboxes are necessary. City footprints, canal and locked district boundaries block movement; lab containment and walls block passage.

The researcher approaches the front of the core and follows an outside arc to the matching socket, avoiding containment. Elevator and handover promises lock input, retain rendering/audio, and commit progression only after completion. City and lab visibility switch with actual vertical location. Native model load is awaited before the researcher sequence.

## Rendering and media budgets

Locally packaged1K albedo/normal/roughness textures, HDR lighting, ACES output and shared materials. Building geometry batches by material/UV tiling/spatial chunk for culling. Scanned trees/lamps/barriers are deduplicated, welded and simplified before local GLB packaging; raw scans remain outside public/build. Nearby actors' mixers update; street decorations are culled at55m Low /95m High. Resolution caps1x Low /1.5x High.

City shadows are authored projected ground geometry and a moving contact patch, avoiding a costly real-time sunlight shadow pass. This is a deliberate browser performance compromise. Lab point lights and plasma emissive materials supply the core presentation.320 particles use pooled typed arrays; no per-frame particle objects. Core geometry is approximately165k triangles; representative lab frames have about191k visible triangles including humans. Initial texture/model shader compilation can cause a warmup hitch. No performance guarantee or physical mobile benchmark is claimed.

The asset tools in the workspace use official glTF Transform and meshoptimizer packages; optimized GLBs need no external decompression runtime. Preserve source scans separately, keep collision simple, and export consistent skeleton units/axes. Audio is generated progressively; no video/downloaded music is required.

## Backend, saves and automation

POST /api/verdict validates ordered decisions, known unique budget entries, player count and the100-unit cap, then replays all rules. Client meters are ignored.400 invalid,413 oversized,405 unsupported method. No files, data storage, credentials, accounts, purchases, leaderboard or cloud saves. A local labelled verdict handles API failure. Same-origin CSP and restricted permissions headers apply.

m2050.adventure.v3 isolates older saves; ordered installation and reconstructed rules are checked. Autosave after actions/pause, every5s and pagehide; storage failure is nonfatal. Semantic menus have visible focus/trapping. Touch and keyboard share the actual simulation. Release is required between work actions.

Read-only #game-state JSON and window.mission2050.snapshot() expose cloned state, nearby action, position, driving, nativeRig/modelLoaded, render calls/triangles, locale and bounded local event history. Body cinematic step attributes support screenshot timing. No remote admin/mutation API. Automation uses real UI input; movement-free fallback is not evidence of complete physical traversal.

Stable events include menu.view, adventure.start, task.complete, stone.collect, elevator.start/complete, cinematic.stage, assembly.start/complete, ending.view, vehicle.toggle, player.heat_exhaustion, action.rejected and save.failure. Local CustomEvents/bounded buffer only; no provider transmission. Any future adapter must be opt-in and failure-safe.

## Release

CI runs tests/build; build recreates only the verified project dist directory to prevent stale assets. Preview-smoke all local assets and API results on Vercel before promotion. Retain the previous deployment for rollback; no database migrations. ZIP excludes repository metadata, builds, raw scans, credentials and tool caches. Real newcomer/device checks, sustained frame pacing and bespoke art remain open production work.
