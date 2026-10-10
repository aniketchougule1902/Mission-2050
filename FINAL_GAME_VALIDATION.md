# Scenery restoration and full game verification

The earlier optimization reserved too much land around connecting roads and hid tree groups too early. It reduced the original 73 residential lots to 57. This revision restores **73 residential buildings**, retains the clinic, school, industrial works, depot and research campus, and renders **85 trees**: the original 28 grove trees and 32 street trees, plus 25 avenue trees.

Buildings use their actual footprint for road clearance and move into safe block positions where necessary. Street trees avoid building footprints. The world, minimap and full map share these placements. Distant scanned trees switch to lightweight canopies; pending or failed detailed-tree loads retain those canopies. Scenery stays present while geometry remains batched and culled.

## Flow fixes

- District 4 and its complete approach open after the third installation; district 5 stays locked until the fourth.
- Navigation checks the space between grid nodes, preventing breadcrumbs from crossing thin fences.
- Housing surveys place stakes and boundary tape. Sapling planting and watering remain separate actions, with a canopy gap and a short work stance that keeps Asha beside the sapling.
- Ecology work pauses with menus and prevents walking, jumping, climbing and vehicle switching during the animation.
- Saves retain the car position, heading and driving state. Older saves remain usable. Restart resets the car to parking, and delivered cargo clears from its visible load.

## Completed verification

| Check | Evidence |
| --- | --- |
| Automated checks | **69 passed**, including mission prerequisites, deterministic endings, traffic contacts, vehicle save validation, scenery clearance, corridor continuity and thin-fence navigation. |
| Production | Build and staged/unstaged whitespace checks passed. |
| Physical mission journey | **49 actions** completed through real movement, proximity input, ladder, driving, elevator and researcher sequences, with normal saves and checkpoint restores between sessions. No movement-free fallback was used for these actions. |
| Clinic and rooftop | Fuse, efficiency repair, clinic confirmation, first installation, roof ladder, three sunny panels, collection, descent and second installation passed. |
| Grove and river | Two surveys, protection, two watered saplings, survey pause/resume, third installation, save/reload, actual river entry, all three scans, valve isolation and fourth installation passed. |
| Transit and safety | Actual depot and clinic vehicle deliveries passed. The plan without backup produced critical reserve **−2**; adding backup and retesting produced green reserve **14**. |
| Ending | Fifth installation and activation passed. POST `/api/verdict` returned **200**, green, reserve 14, carbon 18, clean supply 62 and ecosystem 65; all service checks passed. Restart cleared the mission. |
| Vehicle persistence | Physically drove from parking to z≈42.99, saved while driving, reloaded with the same position/heading/driving state, exited and restarted. Car returned to [14,0,34]. |
| Rendering | Native models, six guards, eight traffic vehicles, 20-second movement/render soak, ecology geometry/timing and physical elevator round trip passed. Final journey recorded **zero browser errors and zero missing assets**. |
| Interface | Full-map zoom and restored scenery, three graphics modes, 390×844 emulated phone touch movement and expanded labels passed. No horizontal overflow. |
| Accessibility | Separate five-mission movement-free journey, ordered installations, green server verdict and restart passed without model downloads. |

The physical journey's final state and API response are recorded in `outputs/scenery-final/result.json`; every completed action is recorded in `journey.json`. `vehicle-save.json` and `profiles-touch.json` record the supplementary checks. PNG evidence includes the city, roof, survey, sapling, map, river, vehicle and green ending.

## Final hardware sample

Installed Chrome, native ANGLE/D3D11 on **AMD Radeon 740M**, 1280×720, Balanced, pixel ratio 1. The stationary city view warmed for 12 seconds, followed by a 10-second animation-frame sample with other test browsers closed.

| Measurement | Result |
| --- | ---: |
| Frames in 10 seconds | 1,388 |
| Average FPS | **138.8** |
| Median frame interval | 6.9 ms |
| 95th-percentile frame interval | 7.1 ms |
| Draw calls | 292 |
| Visible triangles | 172,870 |
| Browser errors | 0 |

Raw data is in `outputs/scenery-final/performance.json`. This meets the 90 FPS target in the measured warmed city sample. Cold loading, every camera angle, physical-phone thermals and other devices are separate performance conditions; the physical journey verifies functionality rather than a universal frame-rate guarantee.

## Reproduction

Run `npm test`, `npm run build`, and `npm run dev`. With Playwright available, `tests/browser-smoke.mjs` covers rendering and accessibility. `tests/browser-physical-journey.mjs` runs the physical journey against `BASE_URL`; `RESUME_SAVE` optionally continues an unmodified checkpoint produced by that journey. `tests/browser-vehicle-save.mjs` checks real driving/save/reload/restart from a journey checkpoint. `PLAYWRIGHT_MODULE`, `CHROME_PATH` and `NATIVE_GPU=1` select an available local Playwright module and installed native Chrome.

No deployment or publication was performed. Refresh the existing game to load the changes while retaining its saved mission.
