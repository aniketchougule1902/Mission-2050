# Adventure V3 validation - 9 October 2026

## Automated results

26 Node tests pass. These cover all five mission prerequisites and the strongest ending, mandatory underground installation, rooftop descent while carrying, three-panel placement, three river clues, budget and failed night-test repair/override, save reconstruction, dependency resolution, sequential district unlocks and traversable corridors, containment collision, rooftop elevation, A* building detours, alternate-choice checklist feedback, deterministic ending gates, worker/river requirements and server replay. Syntax checks for engine/app pass; clean production build succeeds.

Live local POST /api/verdict smoke test returns green with reserve14, carbon18, supply62 and ecosystem65. Server independently replays choices. No deployment was made.

## V3 browser evidence

Actual runtime shows modelLoaded/nativeRig true. Inspected corrected native character walk/idle alignment, photographed city materials, detailed facades and scanned street props. Used real touch movement into the research elevator; observed closing, actual 24m travel, arrival and lab doors. Actual first and final stone researcher sequences emitted handover, researcherCarry, socketFit, activation and complete; installed stones persist and the next district opens. The outside-arc doctor path avoids reactor containment. These are rendered gameplay sequences, not pre-rendered videos.

The full five-level prerequisite UI path was exercised through the labelled movement-free fallback. Missing backup produced critical reserve-2; adding backup and retesting yielded green reserve14. First and fifth handovers were also exercised in spatial play. This does not prove every district was physically traversed or all collision branches were played end to end.

Desktop1280x720, touch714x612 and phone390x844 layouts inspected. Phone English and Expanded Text had document width390 with no horizontal overflow; Low profile was exercised and defaults restored. Task instructions and checklist use stable keys. English is complete; Hindi/Arabic remain partial previews. Final observed console warning/error list was empty.

City preview warmed around60-90FPS; lab preview reached120-145FPS at the tested sizes. These are live counter observations in the instrumented browser, not sustained hardware benchmarks. Initial asset/shader warmup and repeated viewport/reload operations sometimes caused long stalls; startup/frame pacing still needs measurement in target Chrome/Edge and physical phones. City real-time sun shadows were removed after a severe stall; authored projected shadows and a moving contact patch retain grounding.

## Reproduce and release gates

Run npm test, npm run build and npm run dev. Walk each district's task route, collect its stone, descend to the lab, hand over, verify socket permanence and that exactly the next district opens. Use the ladder both directions while carrying. Test driving/deliveries, both pollution choices, shaded panels, heat recovery, save/refresh, pause, Low/High profiles, long labels and touch. Test missing backup and repaired reserve, then final API activation.

Complete physical traversal of all routes/branches, newcomer playtests, physical iOS/Android touch/thermals/memory/lifecycle/frame-pacing measurements, full translation review, startup/loading polish, bespoke character/city art and deployed Vercel preview smoke checks remain production gates. No external playtest telemetry was supplied. No blind AAA comparison or GTA-equivalent art claim is made.

## Roadside security patch validation

29 automated checks pass. Added coverage samples the entire compound footprint against grid/diagonal roads; confirms both traffic directions face movement without a lateral detour; checks guard clearance from the researcher arc; and migrates old lab saves without shifting them a second time. Build/syntax checks pass. Browser verification restored an old underground save, reported six security guards, showed four guards around the core, used actual movement and the elevator ascent to arrive at x24,y0,z31, and observed both lanes fixed at x-3/x3 with correct forward headings. A real azure handover/installation/particle activation completed in the moved lab, confirming camera/stone positions and the next unlock. Final observed console warning/error list was empty. Screenshots are actual runtime frames. No Vercel deployment or physical-device benchmark was performed.

## Production enhancement validation — 10 October 2026

59 automated tests pass and the production build succeeds. Added regression coverage checks interior and rotated traffic contacts, complete car separation, damage-cooldown independence at 30/60/144 Hz, reflected velocity, lateral grip, conversation queues/cancellation and reduced-motion presentation.

Installed Chrome with software WebGL passed actual city movement, native models, all eight traffic vehicles and six guards, a 20-second render soak, ecology geometry/timing and the physical elevator round trip. The movement-free five-mission journey passed ordered installation, the actual server verdict (green, reserve14), no model downloads and restart. Targeted map zoom/pan/keyboard and live portrait/dialogue checks passed. A high-quality post-processing fixture returned WebGL error0. An accessibility dialogue overlay initially intercepted task clicks; pointer handling/placement were corrected and the complete journey passed again.

Software-rendered soak readings were 3–6 FPS. These establish functionality and do not replace target-device benchmarks. Bloom/depth shading and shaft mist are lightweight approximations. Arbitrary sloped terrain, optional weather simulation, full new Hindi/Arabic translations and complete physical traversal of every district remain outside this implementation or release checks. See PRODUCTION_ENHANCEMENTS.md for implementation details and preserved architectural boundaries. Evidence screenshots are in outputs/production-enhancement.

## Browser optimization and quest regression validation — 10 October 2026

64 tests pass; production build and whitespace checks pass. Native Chrome on AMD Radeon 740M at 1280x720 averaged 117.7 FPS over a warmed 10-second city sample, compared with 77.7 FPS before. Draw calls fell from 381 to 205. District 4 was physically entered after three installations through the formerly blocked connection. Survey boundaries contain stakes/tape and no tree; restoration sites contain a watered sapling. The native browser soak, elevator round trip, five-mission accessibility journey and restart all passed. See BROWSER_OPTIMIZATION.md and outputs/browser-optimization for scope, raw measurements and evidence. Earlier software-rendered measurements above describe different runs and are superseded for hardware performance by this native sample.

## Final scenery and physical journey verification

73 residential buildings and 85 trees are restored through shared map/world placements. 69 automated tests, production build and whitespace checks pass. The real-input journey completed 49 actions across all five missions with save/restore, both vehicle deliveries, reserve -2 failure and reserve14 repair, five installations, HTTP200 green verdict and restart. Browser errors and missing assets were empty. Vehicle driving pose/save/reload/restart passed separately. A warmed native Chrome city sample at1280x720 on Radeon740M averaged138.8FPS, median6.9ms and p95 7.1ms, with292 draw calls and pixel ratio1. Full scope and evidence are recorded in FINAL_GAME_VALIDATION.md and outputs/scenery-final.
