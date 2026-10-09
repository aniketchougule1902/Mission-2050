# Validation record

Checked locally on 9 October 2026.

## Passed

- Ten automated Node tests, including exhaustive valid-choice/budget combinations, independent service gates, save reconstruction, shared-device scoring, input rejection and server-side recomputation.
- Production asset build and JavaScript syntax checks.
- Browser playthrough of all four early missions, evidence gating, budget allocation, failed clinic test, amendment and server-checked Green Future ending.
- Browser Critical Failure and Survival endings also reached through real menu actions.
- Save restored after page reload with four decisions and final budget intact.
- Music toggle changes to ON, with no captured browser error logs. Actual listening and subjective audio mix still need a human review.
- English/Hindi ending rendering, expanded pseudolocale, partial Arabic RTL interface, and accessible text mode.
- Desktop 1440×900 and phone-size 390×844 layouts inspected; no desktop horizontal overflow. Phone panels scroll to all decisions and actions.
- Simple meshes batched by material using InstancedMesh. Local FPS display ranged widely during browser inspection, approximately 26–144 FPS after initial compilation; startup readings were lower before batching/warm-up. This is not a sustained benchmark or a guarantee of 60 FPS.
- Low/High profiles and semantic DOM snapshots are available. Header and menus remain keyboard-accessible; normal movement logic uses keydown/up and touch pointer capture.

## Not yet verified

Physical iOS/Android devices, thermal/memory measurements, real touch-hardware feel, sustained frame pacing, newcomer comprehension, human Hindi proofreading, audible music quality, authenticated Vercel deployment, public-host smoke tests and organizer submission eligibility. Arabic is a partial UI preview, not a finished translation. Multiplayer is shared-device turn-taking only.

## Release smoke test

Run tests/build, deploy preview on Vercel, open on desktop and a physical phone, enable music, complete all missions, verify missing-backup failure, add backup, activate good ending, reload save, check text mode and Hindi, then promote. Retain the previous deployment for rollback. No database migration applies.
