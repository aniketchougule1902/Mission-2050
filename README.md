# Mission 2050 - Adventure V3
 
Play Asha's five-level climate adventure across Suryanagar. Recover a stone in each district, return to the research entrance, descend 24 metres by animated elevator, and hand the stone to Dr. Meera. She carries it around the reactor, fits it into its magnetic socket, and activates the next district.

## Play on this computer

Double-click **Start Game.cmd**, leave the window open, and visit http://127.0.0.1:4185 in Chrome or Edge. With Node 20+ installed, `npm run dev` does the same. No dependency installation is required. Enter City starts music; headphones make the different stone motifs clearer.

WASD/arrows move; Shift runs; Space jumps or brakes; drag rotates the camera; mouse wheel changes distance; C cycles chase/wide/first-person; hold E near a task to work; Q scans; F enters/exits the utility vehicle; M opens the map; Esc pauses. Touch direction taps move briefly; hold for continuous movement. Touch E starts the current nearby action. Release between actions.

Follow the gold breadcrumbs and direction arrow. The checklist explains each milestone; the centre prompt explains the nearby task. A collected stone must be installed underground before the next district opens. The elevator can be used in both directions. In the lab, leave the cabin and walk forward to Meera. Five installed stones allow final activation. Progress saves locally; New Adventure resets it. Shade and the lab reduce heat. Exhaustion returns you to the research entrance and preserves task progress.

Settings offers High/Low detail distance, volume, and a labelled movement-free accessibility fallback. English is complete. Hindi is partial with English fallback; Arabic is a partial RTL preview; Expanded Text tests long labels.

## Vercel

Run `npm test` and `npm run build`. Import this folder's repository into Vercel. Framework: **Other**. Build: **npm run build**. Output: **dist**. Node: **20+**. Keep `vercel.json`, `api`, `public` and `src`. No environment variables/database are required. The final verdict is recomputed by `/api/verdict`; API failure uses a labelled local verdict. No runtime CDN or remotely loaded game assets.

The connected Vercel project is `mission-2050`. Production uses `master` and previews are built from `main`. The [Mission 2050 CI/CD](.github/workflows/ci.yml) workflow runs unit tests, verifies deployable assets, and uses Chromium to test real WebGL rendering, movement, and the complete five-level accessibility journey. **Only a passing push to `main` automatically fast-forwards `master`**, which triggers Vercel's existing Git integration to publish production. No Vercel API token is required for this branch-gated workflow. Avoid pushing directly to `master`, because Vercel would deploy those changes without the `main` gate. Check the GitHub Actions run and Vercel deployment status after releasing.

Other computers need Node 20+ for the local launcher. Opening index.html directly does not work.

## V3 presentation

The 600-metre city has detailed procedural buildings with balconies, recessed windows, storefronts and rooftop equipment, photographed PBR surfaces, scanned trees/lamps/barriers, roads and moving traffic. The character uses one compatible native skeleton and its own animations. City directional/contact shadows are authored geometry to avoid an expensive real-time shadow pass. The underground reactor has layered metalwork, coolant pipes, glass containment, moving rings and five persistent stone sockets. A GLB export is included in public/models/ECO_CORE.glb.

This is a playable browser prototype with representative character assets and procedural buildings/vehicles. Bespoke realistic Asha/Meera, cinematic facial acting, GTA-level authored city art, and production device/playtest verification remain further production work. Live FPS depends on hardware. There are no accounts, multiplayer or purchases.

See GAME_DESIGN.md, ARCHITECTURE.md, VALIDATION.md and CREDITS.md. Environmental and budget figures are fictional teaching units. Saans koi score nahi.

## Roadside security update (3.0.1)

The research entrance and its entire underground lab are relocated to the block beside the main road, with elevator centre at x24,z32. Fencing leaves a clear pedestrian entrance; two security guards stand at the compound entrance and four surround the reactor. Parking and spawn are off the traffic lanes. Main-road traffic uses straight lane paths, heading derived from travel direction and corrected forward wheel rotation, without the old lab avoidance detour. Maps, proximity tasks, containment collision, cinematic cameras, stone effects and elevator shaft all share the translated research location. Older underground saves migrate once and retain progress.
