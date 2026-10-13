# Editor → native watch face

`Watch-Face-Designer.html` remains the original, editable, self-contained editor. Open it locally and use **Load design** to load `design/approved-layout.json`. Browser autosave and the HTML's embedded default are working drafts; they do not replace the approved baseline. Use **Save design** to export further changes.

The baseline and original HTML are never rewritten by generation. A newer export becomes the baseline only through an explicit approval/import. `AGENTS.md` records these rules for future work in this workspace.

## Commands

From the project folder in PowerShell:

```powershell
# Reproduce the current approved design and compile both variants.
.\tools\Update-Design.ps1

# Promote an export you have approved. Archives the previous baseline by SHA-256.
.\tools\Update-Design.ps1 -Design 'C:\path\watch-face-design.json' -Approve

# Choose a deterministic comparison time; preview date comes from the export.
.\tools\Update-Design.ps1 -Time '10:08' -Mode day -RunPreview

# Run the live Garmin-data build instead.
.\tools\Run-Simulator.ps1
```

`-Approve` is a deliberate CLI switch, not an extra approval dialog. Generation validates an approved candidate before promoting it. A compile failure is reported; it does not falsely mark the design as validated or silently restore an older design.

For an unapproved experiment, leave the active baseline and generated directory alone:

```powershell
node tools/generate.cjs --input 'C:\path\draft.json' --output '.test-output\draft'
```

Generation alone: `node tools/generate.cjs`. Compilation alone: `tools/Build-Watch.ps1`, with `-Preview` for the deterministic variant. No coordinates, colours, fonts, fixture dates, or settings need to be copied into Monkey C.

## Dependencies and offline operation

Node.js, Playwright, Chromium/Edge/Chrome, the Garmin Connect IQ SDK/device package, Java and your existing signing key are needed for generation/build. This workspace can use the installed Codex Node runtime dependencies. On another machine, run `npm install` once; use an installed Edge/Chrome or `npx playwright install chromium`. Package versions are pinned in `package.json`.

After setup, editor use and generation work offline. Generation opens the original HTML in a fresh browser context and blocks HTTP/HTTPS requests. It uses embedded fonts/artwork and never reads or changes the user's browser autosave. `WATCH_BROWSER` can point to a Chromium executable. There is no server or hosting requirement.

The build scripts find the current Garmin SDK from its SDK manager configuration. Overrides: `CONNECTIQ_SDK`, `JAVA_HOME`, `GARMIN_DEVELOPER_KEY`, or script arguments `-SdkPath`, `-JavaPath`, `-KeyPath`. An existing local `developer_key` is accepted as a fallback, never printed, generated, or replaced. It is ignored by Git.

## Ownership of files

| Path | Purpose |
| --- | --- |
| `Watch-Face-Designer.html` | Original editor; preserve all controls, editing, saving and preview features |
| `design/approved-layout.json` | Approved active settings; byte-for-byte export |
| `design/history/` | Previous approved exports, created on promotion |
| `tools/editor-bridge.js` | Adapter injected only into the generator's fresh browser; calls original editor rendering functions |
| `generated/source/ApprovedLayout.mc` | Generated references and small tables |
| `generated/resources/` | Generated per-field JSON, config, glyph metrics, PNG font/icon/hand/background assets |
| `generated/preview/` | Sample data and fixed clock, included only by `preview.jungle` |
| `profiles/live/` | Live build profile; no sample health/weather/state data |
| `source/` | Handwritten rendering, astronomy and Garmin data providers; regeneration never writes here |
| `generated/capabilities.json` | Per-option and per-source support audit; unmapped options stop import |
| `generated/comparison/` | Reference PNG, conditions, simulator capture, interactive overlay and difference report |
| `bin/` | Built PRGs, compiler/simulator logs and build provenance receipts |

Generated data is loaded on demand rather than embedded as a giant initializer, to stay within the target's 128 KB watch-face heap. Glyphs use one font metric table at a time. The initial astronomy pass runs separately from the drawing callback to stay within Garmin's watchdog budget. The Monkey C compiler uses classic dynamic checking (`-l 0`); JSON input validation and actual simulator runs are required alongside compilation.

## Comparison after every approved update

1. Run `Update-Design.ps1`. It regenerates and compiles `bin/TacticalWatch.prg` (live API data) and `bin/TacticalWatch-preview.prg` (simulated).
2. Run `Run-Simulator.ps1 -Preview`. The preview's date, time, seconds, mode and UTC offset are recorded in `generated/comparison/conditions.json`. Default time is 10:08:38; the original editor uses 38 seconds with Live disabled.
3. In the Garmin simulator choose **File → Save Screen Capture**. Save a new PNG after each build. It must be the 454 × 454 screen, not a screenshot of the desktop/bezel.
4. Run `node tools/compare.cjs 'C:\path\capture.png'` and open `generated/comparison/comparison.html`. Compare side by side and with the overlay slider. The difference image is amplified; metrics are diagnostics, not automatic design approval.
5. Inspect the live build too. Missing API data must show `--` or omit an unknown status, rather than reuse the editor's examples. Check additional modes enabled by the new export. Record remaining differences.

The comparison command rejects stale builds and captures older than the compiled PRG. Its report records the approved JSON, original HTML, native sources, generation and PRG hashes. The person capturing must still ensure the preview PRG is the one running; a PNG alone cannot prove that.

## Support and deliberate approximations

The exhaustive import-specific audit is `generated/capabilities.json`. These are the key cross-cutting limitations:

| Editor feature | Native behavior |
| --- | --- |
| Groups, table frames, quadrant symmetry, dividers | The original editor resolves these into day/night backgrounds. Membership, saved geometry, border visibility and dividers are preserved. `border:false` also suppresses dividers, matching this editor. Envelopes use the editor's preview text bounds and do not reflow around changing real values. |
| Text, selected font/weight/size/colour, curved/reversed text, wrap and rotation | Glyph atlases use the fonts as rendered by the offline editor. Native character placement approximates browser shaping: no kerning/ligatures, complex-script shaping, or automatic expansion for new runtime characters outside the generated alphabet. Missing glyphs render `?`. Antialiasing differs. |
| Bubbles and panels | Curved standalone bubbles resize to runtime text; grouped fields follow editor group suppression. Straight fields use the editor's panel behavior (its `bubble` toggle does not draw a standalone straight bubble). Rotated straight panels remain axis-aligned on watch; text/icons rotate correctly. |
| Icons | Artwork comes directly from the editor; choice, none/value/name modes, scale, gap, rotation and follow-radius are imported. Weather artwork remains the editor's generic weather icon, while live condition text changes. |
| Analogue, hybrid and digital time | Device time in live build, selected 12/24 format, split digital gap, AM/PM and generated hand styles/colours/inlays/borders/pivot. Hand textures are rotated on device. |
| Seconds | Selected perimeter shape or second hand; off/high-power rules honored. Drawn during active Garmin updates. `gesture` and `always` cannot force continuous seconds during low-power mode. |
| Solar/lunar rings and markers | Saved coordinates, not GPS. Local watch day in live mode; export UTC offset in deterministic preview. Same low-precision astronomy model; 30-minute search brackets refined to about two seconds to fit the watchdog (editor uses finer brackets). Very brief polar events may be missed. Golden bands use configured minutes around events. Patterns, sizes, colours, order and event ticks supported. Raster/compositing precision differs. |
| Manual sky | Manual dawn/rise/set/dusk times can be used. Manually simulated sun/moon bearings and phases are not represented as real observations on the live watch. Live astronomical markers require auto-sky. |
| Compass/north/heading/GPS | `northUp` is a diagram. Experimental `available` mode reads passive activity heading while awake and counter-rotates north/sky pointers; values must change and expire after 15 seconds unchanged. Missing heading shows `HDG --` and hides directional pointers. No verified continuous hardware compass provider or current GPS fix. See COMPASS-FEASIBILITY.md. |
| Status icons | Garmin battery, estimated days, notifications, phone, alarms and guarded device settings; Wi-Fi/LTE from `connectionInfo` when available. Unknown states omitted. Pressure trend and GPS remain unavailable. Row/column/grid, order, gaps, positions and inactive dim/hide are imported. Battery-days text uses an 8 px atlas rather than the editor's continuous fit-to-box sizing. |
| Night and sleep | Always/never/automatic night colours supported; automatic uses local solar events. Editor's manual night tab is a comparison selection; live manual mode defaults to day. Configured sleep-saving interval blanks the display. |
| AOD | Enabled by aodTimeOnly. Custom aodLayout imports independent time/readings positions, sizes and maxWidth; no icons, and long values end with ~. row-cycle-3 clears every third pixel row with a changing minute phase. Native builds require the per-design pixel budget audit. Legacy fixed-slot layouts remain supported. Watch AOD settings and system sleep settings still apply. Physical endurance validation is pending. |
| Wheelchair | Push providers not implemented; affected live fields show `--`. |
| Editing metadata | Grid, snap, palettes, default sizes and symmetry controls act in the editor. Resolved per-element geometry/style is generated; there is no watch-side design editor or Connect IQ settings UI yet. |

Live health/environment values come from Garmin APIs, including cached weather and sensor history. HR older than 10 minutes, elevation older than one hour, weather older than three hours and SpO₂ older than 24 hours are rejected. SpO₂ is historical, not a continuous measurement. Respiration and AQI have no implemented live source and show `--`. Other unsupported sources are called out individually by the audit and show `--`.

Live sport fixtures refresh hourly through Garmin Connect and retain a persistent offline cache. Expired events roll over to the next future fixture. Studio's saved events remain preview data and initial fallback. See [automatic schedules](AUTOMATIC-SCHEDULES.md) for connectivity, refresh timing and feed limitations.

The preview PRG intentionally uses sample health/weather/status data, including values for unsupported live features, to compare appearance. Its filename, launcher label, console message and comparison report identify it as simulated. Do not sideload the preview PRG. Even the live-data PRG receives simulator-generated API values when run in the simulator; those are not physical-watch measurements.

## Validation

Run `node --test tests/pipeline.test.cjs`. Tests reject invalid/dangling exports, check byte-identical regeneration, verify imports change native assets, protect the approved JSON/editor/handwritten source hashes, and check sample-data isolation. They do not substitute for Garmin compilation or visual comparison.

The original editor embeds font/artwork licensing notices. Keep them with the editor and derived assets. No public release, hardware burn-in validation, sustained battery profiling or Connect IQ Store distribution is implied by a successful simulator run.

API references: [graphics](https://developer.garmin.com/connect-iq/core-topics/graphics/), [bitmap transforms](https://developer.garmin.com/connect-iq/api-docs/Toybox/Graphics/Dc.html), [resource data](https://developer.garmin.com/connect-iq/core-topics/resources/), [device settings](https://developer.garmin.com/connect-iq/api-docs/Toybox/System/DeviceSettings.html).

Solid AOD and refresh update: see docs/REFRESH-AND-SOLID-AOD.md. aodLayout.protection=solid-shift-3 uses solid bold text and whole-layout vertical movement, replacing the legacy row-cycle-3 pattern for the current approved design. Refresh control geometry is exported in refreshControl. Touch and hold rereads available data; it cannot activate compass hardware.
