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
