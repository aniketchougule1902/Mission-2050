# Browser optimization and quest fixes — 10 October 2026

The subsequent scenery restoration and complete physical journey are recorded in [FINAL_GAME_VALIDATION.md](FINAL_GAME_VALIDATION.md). Measurements below describe the earlier optimization revision.

District 4 can now be reached after the third core installation. The previous unlock changed the district flag but left a locked gap between the grove and river. Shared, staged service connections now govern movement, roads, map corridors and procedural building clearance. Future district centres remain locked until their own installation milestone.

Housing surveys now place corner stakes and boundary tape. They create no tree, watering can or spray. Grove restoration separately places a young sapling and waters it; completed tasks restore the correct visuals from saves.

## Rendering changes

- Balanced is the default, including a one-time graphics-setting migration that preserves mission progress. It retains native animated characters, textured city surfaces, PBR materials and authored contact shadows. Cinematic enables the more expensive environment and screen effects; Performance lowers pixel and detail budgets.
- Static city, laboratory, reactor and vehicle geometry shares material batches. Spatial city chunks still support culling. Dynamic reactor rings, stones, plasma, player animation and utility-car wheels retain their animation.
- Small reactor parts use fewer segments. Distant NPC animation updates are reduced. Traffic collision candidates refresh at 15 Hz with a safety margin, while collision resolution stays in the fixed simulation.
- Pixel budgets bound rendering cost on large/high-density displays. Sustained frame-budget misses lower resolution/detail; recovery uses hysteresis. The target is 90 FPS, not a promise of 90 FPS on every device.
- Physics advances at 120 Hz with bounded catch-up. Active-play HUD panels avoid background blur and inactive heat effects.

## Hardware measurement

Installed Chrome, native ANGLE/D3D11, AMD Radeon 740M, 1280×720, device scale 1, identical spawn view. Each sample follows 12 seconds of warmup and records 10 seconds of animation frames. This is a warmed city sample; it does not measure cold startup, every route, mobile thermals or the Cinematic profile. The original configuration used the previous default High profile; the revised default is Balanced.

| Measurement | Before | After |
| --- | ---: | ---: |
| Average frames/second | 77.7 | 117.7 |
| Median frame interval | 13.9 ms | 8.2 ms |
| 95th-percentile frame interval | 20.7 ms | 9.7 ms |
| Render draw calls | 381 | 205 |
| Visible triangles | 128,050 | 94,930 |
| Pixel ratio | 1.05 | 1.00 |
| Browser errors | 0 | 0 |

Raw measurements and screenshots are in `outputs/browser-optimization/`.

## Verification

64 automated tests pass; production build and whitespace checks pass. Added checks cover district connection continuity and future locks, construction clearance, separate survey/plant action kinds, pixel budgets and adaptive-quality hysteresis.

Native Chrome passed a 20-second rendering/movement soak, ecology geometry and timing, the physical elevator round trip, and a five-mission movement-free journey with ordered installation, server-verified green ending and restart. A separate native browser check restored three installed cores and physically entered the river along the previously blocked connection without a district-lock event. Its ecology fixture verified eight survey-boundary pieces, no survey tree, and a separate watered sapling.

Run `npm test` and `npm run build`. The existing Playwright browser smoke test accepts `BASE_URL` for an already running game server. `PORT` can select a separate development server port. Screenshots show actual rendered gameplay. No publication or deployment was performed.
