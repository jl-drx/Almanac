# Almanac

An illustrated browser learning playground for ages 8–12. The first playable expedition connects Earth, the Moon, and Mars through free flight, assisted travel, interactive experiments, gentle explanatory questions, and a persistent field notebook.

## Run

Requires Node.js 20 or newer. No packages to install.

```sh
npm run dev
npm run check
npm test
```

Preview: http://127.0.0.1:4173. Deploy the contents of `dist/` to a static host. The Sites identity and static output are in `.openai/hosting.json`.

## Architectural decisions

- Native JavaScript modules, HTML, and CSS. No framework, build step, game-engine dependency, or remote font. These keep the first load small and maintenance straightforward.
- Canvas 2D for the flight scene; SVG for original illustrations and experiments; native DOM for all controls and reading. Canvas is an enhancement, with destination buttons offering an accessible navigation path.
- `engine.js` owns flight, drawing, input and lifecycle. `art.js` owns the visual vocabulary. `content.js` owns science references, destination data, persistence and experiment maths. `app.js` connects navigation and discovery interactions.
- Frame-rate-independent motion, capped time steps, predecoded planet images, bounded star counts, capped pixel density, and no canvas readbacks. The flight loop stops when paused, when a discovery is open, when the document is hidden, and at base camp.
- Calm mode follows the operating system's reduced-motion preference initially, uses a 1× render scale, and shows jump outcomes without animation. Flight remains directly controllable.
- Static hosting. No server, account system, database, tracking, payments, or collection of children's personal information. Only completed discovery IDs are stored on this browser. Storage failures degrade to session-only progress.

## Creative rules

Warm paper outside the expedition; deep blue inside it. Moss, sea glass, amber, and clay accents. Clear geometry, recognisable silhouettes, restrained shading, and generous empty space. The illustration system is original and editable as vector code. Avoid detailed textures, heavy filters in the game loop, particle spectacle, and visual noise.

Learning loop: **wonder → try → notice → explain → keep a discovery**. Mistakes offer clues, not penalties. Future expeditions should teach through an action, not merely put a quiz after an animation.

## Scientific boundaries

The space scene is an illustrated map, not an orbital simulation. Size, distance, flight and travel time are intentionally stylised and labelled. Earth rotation uses a simplified polar view. The jump uses equal take-off speed, constant surface gravity (Earth 9.81 m/s², Moon 1.62 m/s²), and no drag. Rust is a colour-change model, not a chemistry or timing simulation.

References checked on 7 October 2026:

- [NASA Space Place: Earth's rotation and tilt](https://spaceplace.nasa.gov/seasons/en/)
- [NASA Science: Moon facts](https://science.nasa.gov/moon/facts/)
- [NASA Science: Mars facts](https://science.nasa.gov/mars/facts/)

## Performance targets and validation

Initial prototype budget: under 100 KB of uncompressed app assets; no external asset requests; target 60 fps on typical hardware and a usable 30 fps on older devices. These frame-rate figures are targets, not a certification. Real iOS Safari, Android devices, and low-end Chromebook profiling remain necessary before a broad release.

Verified in the desktop app's Chromium browser: full three-stop completion, wrong-answer feedback, experiment gates, progress after reload, pause/resume, calm mode, desktop layout, and a 390×844 phone viewport. No browser errors or warnings were recorded during those flows. Node tests cover corrupted/blocked storage, persistence, experiment maths, flight navigation and loop lifecycle.

## Product scope and next decisions

Space is playable. History, weather/geography, and biology are deliberately labelled future concepts. No artificial loading or unfinished buttons imply they are playable.

Next: creative review of the art and feeling of flight; short supervised playtests with the intended age range; device profiling; then build one deeper expedition around a stronger physical interaction. Historical expeditions will need their own source review and contextual art direction. Introduce more infrastructure only when the next experience needs it.
