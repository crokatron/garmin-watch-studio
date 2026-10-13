# Tactical Watch — live editor companion

The original `Watch-Face-Designer.html` remains editable and offline-capable. `design/approved-layout.json` is the active approved export. Regeneration never changes either file or handwritten Monkey C code.

Open the editor locally, load the approved JSON, continue editing, and export using **Save design**. From this folder:

```powershell
# Regenerate the approved baseline and compile live + preview builds.
.\tools\Update-Design.ps1

# Apply an explicitly approved newer export; archive the old baseline.
.\tools\Update-Design.ps1 -Design 'C:\path\watch-face-design.json' -Approve

# Run the deterministic, simulated comparison build.
.\tools\Run-Simulator.ps1 -Preview
```

Save a fresh Garmin simulator screen capture, then compare it with the editor:

```powershell
node tools/compare.cjs 'C:\path\capture.png'
```

Open `generated/comparison/comparison.html` for side-by-side images and an overlay. Live-data build: `bin/TacticalWatch.prg`. Simulated preview: `bin/TacticalWatch-preview.prg`.

Target: **fenix9pro47mm, 454 × 454, minimum API 6.0.0**. The original application ID is retained. Generated layouts/assets live in `generated/`; implementation lives in `source/`.

Read [the workflow, setup and support matrix](docs/DESIGN-WORKFLOW.md) and `generated/capabilities.json` before interpreting simulator data. Current limitations include dark low-power mode, no live compass/GPS status, unavailable respiration/AQI, fixed group envelopes and approximate glyph spacing/compositing. Offline fixtures are not live feeds.

Tests: `node --test tests/pipeline.test.cjs`. Compilation and simulator comparison are required after each approved design update. Hardware/power validation remains separate.

See [the recorded validation](docs/VALIDATION.md) for the current build and comparison results.

For a first physical-watch test, run `node tools/package-watch.cjs` after validation, then follow [the installation guide](docs/INSTALL-ON-WATCH.md). The package contains the live PRG only.
