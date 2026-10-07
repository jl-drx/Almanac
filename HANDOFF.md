# Almanac — cloud development handover

Paused at the user's request on 7 October 2026. Do not mistake this handover for a finished museum implementation.

## The user's brief and authority

Build distinctive, gamified educational experiences for children aged **8–12**, running smoothly in the web browser across a broad range of hardware. Subjects include space, history, weather/geography and biology. Learning should happen through meaningful interaction: piloting, travelling through time, experimenting, exploring.

The user is creative director and executive. The agent owns architectural, operational and technical decisions and should execute autonomously within that brief. Kurzgesagt is a reference for coherent, geometric educational art, but the desired visual language is cleaner and original.

The user explicitly permits using relevant plugins and applications as appropriate, including Blender to make models if useful. This is permission to choose a suitable pipeline, not a requirement to use 3D or Blender. Keep browser asset size, draw calls, memory, accessibility and low-end-device performance in mind.

## Critical creative correction — supersedes the initial design

The user called the first build an “okay first draft” and clarified:

> “something completely unique, no in-line headers or descriptions like a normal webpage, the entire webpage view, except for the header, should be the experience. we want the entire thing to be one huge world, almost like stepping into a museum of the future but in your browser.”

**The world is the interface.** Do not continue refining a normal landing page, hero, topic cards or marketing copy. Keep only a minimal header outside a continuous immersive world. Make subjects places within the museum; use spatial navigation, objects, exhibits and contextual interaction. Explanations can appear as a result of approaching/using exhibits. The initial visual design is not approved as the final direction.

## What exists

The working first prototype is a dependency-free static app in `dist/`:

- `index.html`, `styles.css`: original landing page and modal interfaces. These still render the first draft and need replacing for the corrected museum direction.
- `app.js`: application state, discovery experiments, feedback, progress and notebook UI.
- `engine.js`: Canvas 2D spacecraft flight with keyboard/touch, assisted travel, pause and visibility lifecycle.
- `art.js`: original SVG geometric illustrations for planets, a spacecraft and subject previews.
- `content.js`: three space discoveries, NASA references, versioned browser-local storage, gravity and day/night maths.
- `museum.js`: **new, unfinished, unintegrated renderer**. It is NOT imported or used by the live page. It sketches a connected oblique sculpture garden with an Orbitarium, Time Gallery, Weather Works and Living Room, a visitor, camera pan/zoom, exhibit hotspots and cached vector scenery. Treat it as an experiment that can be adapted or replaced, not an accepted design.

The working space loop is Earth → Moon → Mars: rotate Earth to see day/night, compare equal-take-off-speed jumps under different gravity, and change the oxidation level of an iron-rich rock. Each includes an explanatory question, helpful retries, and a field-note entry. An optional flight scene links the experiments. Progress stays in localStorage; no user accounts, app analytics or backend.

## Integration still needed

`museum.js` expects a canvas, a hotspot layer and callbacks (`onEnter`, `onArea`, optional `onReady`), plus DOM IDs `walk-hint`, `zoom-value`, and `nearby-exhibit`. None of its required museum UI has been integrated. It includes configurable scene states for history/weather/life but those exhibits have no implemented learning UI or verified educational content yet.

Next work should replace the page with the museum, wire camera/walking/exhibit navigation, reuse or improve the space experiments, and design coherent interactions for the other galleries. Revisit the top-level product architecture and rendering method if a better implementation serves the brief. The user explicitly stopped the local work to continue in a cloud environment; do not assume the unfinished renderer has been visually reviewed.

## Running and verification

Node.js 20+; no dependency installation required.

```sh
npm run dev    # http://127.0.0.1:4173
npm run check
npm test
node --check dist/museum.js
```

Use the cloud environment's supported preview/forwarding route. The static server in `scripts/serve.mjs` currently binds loopback port 4173; adapt if the environment requires it.

Nine Node tests passed for the first prototype: storage corruption/unavailability/persistence, jump/day-night maths, flight-loop pause/visibility behavior, assisted travel on desktop/phone/short landscape, keyboard movement and pixel-density caps. Browser checks in desktop Chromium covered all three discoveries, wrong-answer feedback, reload persistence, pause, calm mode, 390×844 portrait and 667×375 landscape. A landscape Moon-navigation boundary bug was found and fixed.

`museum.js` has only been syntax checked. It has not been integrated, browser tested, performance tested or covered by these tests. There is no verified Safari/Firefox or physical low-end-device performance result. The approximately 63 KB original asset total is superseded by the addition of the unfinished renderer; remeasure the new implementation.

The previous performance direction was Canvas 2D + SVG + native DOM, capped pixel density, cached images, bounded objects, no remote fonts or heavy dependencies, and suspended animation when hidden/paused. The museum draft caches its static world and draws on demand, but this needs profiling and lifecycle review.

## Hosting and source status

A private, unpublished Sites project was registered:

- Project ID: `appgprj_6ac6176a4a188191b2af6cf345bb335c`
- Slug: `almanac-little-expeditions`
- Expected URL: `https://almanac-little-expeditions.drx9.chatgpt.site`
- Manifest: `.openai/hosting.json`, static directory `dist`

**No deployment succeeded and no live hosted URL has been verified.** Do not present that expected URL as a working preview. A Sites source workflow created local Git history but failed during remote synchronization with a Windows/WSL shell error: `execvpe(/bin/bash) failed: No such file or directory`. Do not assume the Sites source push succeeded. This is separate from the GitHub handover below.

If using Sites again, reuse this project ID rather than creating another Site, obtain a fresh short-lived credential through the native tool, follow the installed skill and verify publication. No credentials are included in the archive. Respect the current owner-private audience unless the user changes it. Using a different cloud preview/development mechanism is fine.

## Handover artifacts

The user requested committing this work to **https://github.com/jl-drx/Almanac**, on `main`. That repository was inspected and was empty before the handover. The project files belong at its root; start cloud development there and read this document first. GitHub is the intended continuation source; the ZIP is a fallback transfer artifact.

The ZIP contains source, scripts, tests, hosting identity and this document. It excludes `.git`, output artifacts and credentials. The local preview server was stopped when work was paused. The original project subdirectory was `sites/almanac` within the Almanac workspace.

Prioritise an immersive spatial prototype the user can judge creatively before expanding content or infrastructure. Make performance claims from measurements, and keep the distinction between decorative model, scientific simulation and real scale clear.
