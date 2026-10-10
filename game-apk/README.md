# Mission 2050 — native offline mobile game

This directory contains a **real native Godot 4.4.1 3D game** for Android and iOS. It is **not Capacitor, a WebView, Flutter Web or an embedded website**. Godot renders the 3D geometry and simulates movement with its engine/physics on the phone. The game makes **no HTTP calls**, uses no CDN, and needs no backend. Local saves use Godot's `user://` private app directory.

## What is playable

- Explore all five Suryanagar districts from the existing web game's coordinates: microgrid/clinic, solar rooftops, rewilding, river restoration, and transport resilience.
- Follow animated 3D waypoint markers, complete environmental tasks and meaningful decision branches, and recover one coloured stone per district.
- Return to the roadside research compound, ride the **24 m animated elevator**, give each stone to Dr. Meera, and watch the reactor fill all five sockets.
- Drive an electric utility vehicle, collide with ground via CharacterBody3D, jump, switch chase/close/first-person cameras, sprint, inspect objectives, and recover from interrupted sessions with on-device progress.
- Native landscape touch HUD: analog movement pad, interaction, run, vehicle, camera, map, pause; desktop WASD/arrows, Shift, E, F, C, Space, Esc for development.
- No network permissions required; budget/resilience/final ending logic is computed locally.

This is a **working native gameplay foundation**, not yet an art/feature-perfect port of the larger web build. Models are lightweight procedural geometry and characters have procedural limb animation. Rooftop platforming, motion-captured hero rigs, cinematic facial VFX, and real-world device FPS validation are still incomplete. The two platforms share game logic; no Android-specific gameplay code is necessary.

## Build Android APK

The repository workflow `.github/workflows/android-native.yml` exports a **debug-signed, installable ARM64 APK** after changes under `game-apk/**`, and attaches it as the GitHub Actions artifact `mission2050-native-android-apk`. In GitHub: Actions → **Native Android APK** → latest successful run → Artifacts. No Google Play account or signing secret is needed to sideload this debug build. Android 7.0+ / ARM64 is targeted.

To build locally, install **Godot 4.4.1** and matching export templates, install the Android SDK/JDK and configure Android SDK paths in Godot Editor Settings, then from this directory:

```bash
godot --headless --editor --path . --quit
mkdir -p build
godot --headless --path . --export-debug Android build/Mission2050-debug.apk
```

For release distribution, use a private release-signing keystore and export-release; never commit keystores, credentials, or release passwords. Debug signatures cannot be used for Play Store shipping.

## iOS

Open this Godot project on **macOS**, install the matching iOS export templates, configure the iOS export preset with your real **Apple Developer Team ID** and bundle ID, then export an **Xcode project** and sign it in Xcode for a real iPhone. Godot's native iOS renderer shares this project's GDScript/gameplay; iOS cannot be packaged as an Android APK. An IPA has **not** been signed or built because no Apple signing identity/provisioning profile is present.

## Isolation from the browser game

All code is under `game-apk/`; native CI is separately scoped to that folder. The existing website/Vercel runtime is not used in the app and its assets are not downloaded. A desktop Godot editor can run the project directly for gameplay iteration.

### Known gaps / quality gate

Engine parse and headless scene startup are checked in CI before export. A successful APK export alone **does not establish real-device playability, consistent FPS, or parity with the browser art**. Test on at least one low-end and one high-end ARM64 phone, then assess GPU frametimes and crashes before a store release.
