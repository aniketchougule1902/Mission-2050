# Mission 2050 - Adventure V3 design

## Player fantasy and loop

Play Asha, a field engineer restoring Suryanagar with Kabir and Dr. Meera while protecting Dadi's clinic. Explore on foot or drive, inspect evidence, repair equipment, earn a district's stone, carry it to the research entrance, descend into the lab, hand it over and unlock the next level. Immediate heat pressure sits inside a fictional 30-day story. The defining twist: a lower-carbon city can still fail its clinic at night. Essential-service safety takes precedence over a score.

## World and progression

A 600 x 600 metre city footprint contains five district regions connected to the central research entrance by service corridors. The initial clinic ward is open; unreached districts are physically blocked and fogged on the map. Installing stone N opens district N+1 and its corridor. Earlier districts remain available. The utility car becomes available after the first installation. This is a large traversal space for this browser slice, not a fully inhabited GTA-scale simulation.

The surface research pavilion conceals a laboratory 24 metres below ground. The six-and-a-half-second lift sequence closes front/back doors, moves the actual cabin and camera through illuminated shaft sections, then opens into the lab. Handover lasts twelve seconds: player to researcher, researcher walks outside containment to the matching socket, stone moves into magnetic clamps, coloured plasma/particles/shockwave activate. Previously installed sockets remain lit. Final activation uses a separate beam sequence.

## Five levels

1. **Clinic / amber:** collect a fuse, reduce wasted billboard demand or run coal backup, repair the junction, verify the fan with Leela, collect the stone. Teaches breadcrumbs, proximity and holding E.
2. **Solar quarter / azure:** climb the school ladder, collect three panels, physically install them on roof mounts. A shaded mount reduces the result. Collect the stone and descend; the ladder stays available while carrying.
3. **Living grove / emerald:** collect survey stakes, mark two housing plots, protect mature trees or approve clearance, plant and water two saplings. Balances housing access and existing shade.
4. **River works / cyan:** scan upstream, outfall and Arun's authorised records. All three clues are required before isolating confirmed discharge or choosing bank litter removal alone. Water presentation reflects the decision; real ecological recovery is gradual.
5. **Transit depot / violet:** load batteries, drive to depot and clinic, select a 100-unit budget at physical stations, run the night-load test. Repair a failed reserve or explicitly override it. Install the last stone and activate the core.

The strongest path is efficiency, three sunny panels, infill/protected grove, verified effluent control, buses50 + cycling20 + backup15 + training15. The 100-unit plan yields carbon18, clean supply62, ecosystem65, clinic reserve14. Leaving out backup can produce reserve-2 despite good climate scores.

## Navigation and feedback

Default gameplay uses third-person exploration with chase/wide/first-person cameras, native human Idle/Walk/Run animation, gravity/jump, roof ladder, simple collision, arcade utility driving and nearby NPCs. The HUD gives a milestone checklist, task name, distance, direction arrow and specific instructions. Gold breadcrumb dots follow walkable paths on the surface; the map distinguishes opened and locked regions and switches to a lab floor plan underground. Work progress, equipment, stone carrying, radio, scanner, doors, colour and sound provide feedback.

Five original stone motifs accompany activation: amber power, bright azure, softer emerald, watery cyan and deeper violet. Sounds are generated locally. Movement-free accessibility mode shares prerequisites but skips traversal/cinematics; it is labelled separately.

## Endings and recovery

Green requires reserve>=10, workers>=1, clean transport, carbon<=40, supply>=45, ecosystem>=60, verified effluent and access>=1. Survival preserves essentials but misses green targets; Critical fails an essential gate. Budget is revisable at the depot checkpoint. Heat exhaustion preserves tasks. No weapons/combat are in this story scope.

## Visual standard and remaining production

Assess real clinic, rooftop, grove, river, driving, lift, handover and ending frames for camera obstruction, character alignment, material coherence, world scale, action clarity, socket visibility, HUD hierarchy and frame pacing. V3 uses photographed PBR city materials and scanned street props alongside procedural detailed buildings/vehicles and representative skinned humans. GTA/Marvel references inform camera and assembly staging; no franchise assets or unsupported AAA rating are used. Bespoke character/city art, newcomers' playtests and physical-device benchmarks remain production checks.

Story derives from the supplied TXT, Storybook, Impact Brief and judging guide. Document instructions remain reference material, not authority to submit anything. Reference sites informed flow only; see CREDITS.md.

## Roadside security update (3.0.1)

The research entrance and its entire underground lab are relocated to the block beside the main road, with elevator centre at x24,z32. Fencing leaves a clear pedestrian entrance; two security guards stand at the compound entrance and four surround the reactor. Parking and spawn are off the traffic lanes. Main-road traffic uses straight lane paths, heading derived from travel direction and corrected forward wheel rotation, without the old lab avoidance detour. Maps, proximity tasks, containment collision, cinematic cameras, stone effects and elevator shaft all share the translated research location. Older underground saves migrate once and retain progress.
