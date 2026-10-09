# Adventure V2 validation — 9 October 2026

## Automated checks

20 Node tests pass: complete physical action graph to green ending; mandatory carry/assemble gate; task prerequisites; three-panel placement; three river clues; budget overspend; failed night test and repair; explicit critical override; carried/assembled save reconstruction; solar descent ladder; local module dependency existence; original ending, worker, river, budget, server replay and deterministic legal-plan tests. Syntax checks pass for app/controller; production build succeeds. All assets are packaged locally.

## Browser evidence

Ran the local game in Codex's browser. Character GLBs and HDR loaded; semantic modelLoaded=true. Verified walking to the fuse and collecting it by real proximity interaction, genuine touch walking, utility-vehicle entry/acceleration/exit, camera/input controls, first and fifth real assembly animations, manual activation and a Server-checked green result with reserve14/carbon18/supply62/ecosystem65. The full five-mission UI prerequisite path was exercised through the labelled accessibility fallback, then returned to the real world for carrying/assembly/final activation. This does not substitute for traversing every mission physically.

Observed and fixed: mismatched animation export axes; upper-arm staging; touch pointer-capture cancellation; missing loader dependency; carried solar stone losing descent ladder; stale world position on restart; saved ending reopening without an ending panel; traffic route crossing the reactor; expanded settings overflowing a phone panel. Console error/warning list empty after final activation.

Inspected1440×900 desktop and390×844 phone-sized browser frames. English, expanded text and settings inspected; Hindi main objectives/actions and Arabic RTL remain partial with English fallback, requiring translation QA. Screenshots show actual runtime frames, including violet assembly. Reduced-motion duration, Low profile and semantic menus are implemented. No FPS target is claimed: live counter varied with model/HDR startup and warmed rendering; this is not a sustained hardware benchmark.

## Release checks still open

Newcomer playtests, complete physical traversal of all branches, physical iOS/Android touch/heat/memory/frame-pacing/lifecycle checks, full Hindi/Arabic translation review, sustained low-end performance measurement and deployed Vercel preview smoke checks. No real-player telemetry or external playtest evidence was supplied. No blind AAA comparisons performed; this remains a stylised browser prototype with representative characters, not GTA/Marvel production quality.

## Reproduce

Run npm test, npm run build, npm run dev. Walk to the fuse and holdE. Run each task in GAME_DESIGN.md, deliver each stone, check sockets remain lit and the next district unlocks only after assembly. Test buses/cycling/training without backup (reserve−2), then add backup to100 and retest (reserve14). Complete final activation and confirm Server-checked result. Refresh saves, pause/resume, enter/exit the car, use the roof ladder while carrying, switch camera/quality/locale, test phone controls and blocked local storage/API. Before publication repeat on a Vercel preview; retain its previous deployment for rollback.
