# Garmin Watch Studio: maintainer handover

[One-screen summary](START-HERE.md) · [User manual](USER-MANUAL.md) · [Feature overview](../README.md) · [Recorded validation](../VALIDATION.md)

## Purpose and behaviour to preserve

Design a watch face visually, preview its information hierarchy and preserve the design as JSON. Studio 2 provides the editing workspace; the accompanying Monkey C source and build tools translate supported designs into a watch application. A browser preview is not proof that every simulated field or hold interaction is available on the physical watch.

- **Layers and fields:** Select, show/hide and position time, date, health, battery, weather and custom information. (Editor.)
- **Day / Night / Always-on:** Compare colour treatments and the separate low-power layout. (Editor.)
- **Interactions:** Preview configured hold targets and see unavailable interactions explicitly. (Editor.)
- **Solar display:** Preview dawn, sunrise, sunset, dusk and other sky fields against a chosen time. (Editor.)
- **Portable designs:** Open/save JSON and export an image; Undo and guides help arrange elements. (Editor.)
- **Watch build and comparison:** Generate supported assets, compile live/preview applications and compare simulator captures. (Build pipeline.)

The [demo](../demo.html) is a smaller, labelled simulation with fictional data. It explains cause and effect without the real service; it is not evidence of a working production installation. Numbered screenshots in the user manual distinguish actual-app captures from demo captures.

## Files and sources of truth

| Actual package path | Maintainer role |
| --- | --- |
| [external-sources/TacticalWatch/README.md](../external-sources/TacticalWatch/README.md) | Original workflow and target assumptions |
| [external-sources/TacticalWatch/source](../external-sources/TacticalWatch/source) | Watch implementation |
| [external-sources/TacticalWatch/tools](../external-sources/TacticalWatch/tools) | Generation, compilation and comparison helpers |
| [external-sources/TacticalWatch/tests](../external-sources/TacticalWatch/tests) | Editor/model and pipeline checks |
| [demo-source](../demo-source) | Editable demo HTML/CSS/runtime and embedded screenshot tour |
| [SOURCE-MANIFEST.json](../SOURCE-MANIFEST.json) | Original copied-source paths and SHA-256 checkpoint values |

The original working source is under C:/Users/lamon/Desktop/AI TOOLS/NAS for NAS modules; adjacent CAD/watch source locations are recorded by the full backup’s reviewed source manifest. This package contains only the explicitly copied source, not an automatic mirror. The main private nas-projects backup retains the broader shared host context.

## Setup, run and tests

Run commands from this repository root unless a `cd` is shown. Use a disposable checkout and fictional data for first setup. Dependencies, SDKs, signing material and personal data are not bundled. The following are continuation instructions grounded in the retained source, **not commands executed or newly certified by this handover**.

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

/external-sources/TacticalWatch/Watch-Face-Studio.html

Selected project check:

```powershell
cd external-sources/TacticalWatch
node --test tests/studio2-model.test.cjs
```

For the documentation demo alone, serve this repository on loopback with `python -m http.server 8765 --bind 127.0.0.1` and open `/demo.html`. Choose a free port if another preview is running. JavaScript syntax can be checked with `node --check demo-source/runtime.js`. `python demo-source/rebuild.py` rewrites demo.html, so run it only in a disposable checkout or an authorised demo-editing session. A local server cannot provide missing HA/CAD/NAS functions. Inspect browser tests for installed dependencies, fixture requirements and network targets before running them with the approved browser tooling.

## Data, configuration and backup boundaries

The approved design, SDK, developer key, generated assets and watch binaries are separate recovery inputs. The source README references an approved design that was intentionally excluded from the source-only export. Do not invent it or regenerate over a baseline.

The offline editor uses JSON exports; the hosted editor can use a shared NAS draft. Generated watch assets, SDKs and signing credentials are deliberately not backed up here. A complete build needs a configured Garmin environment and an approved design.

Git preserves reviewed source and documentation. It does not copy browser storage, application databases, uploaded models/photos, accepted device settings, SDKs or credentials. Maintain independent recovery copies of the data identified above, including matching configuration and asset versions. Never add real secrets to examples, issues or logs. Private source copies on GitHub are not proof of a complete NAS/offsite data backup.

## Current verification and Git state

Before these documentation edits on 14 October 2026, this package was clean on branch `main` at `7940681be3c51a1d8328e4de529ef2a28e042f23` and its private upload was verified. All 104 manifest-listed source entries matched their stored checksums before editing. The upload follow-up has completed all 17 repositories and is paused; it does not run this tool or back up its live data.

These handover pages and README links accompany the source package. Preserve them when continuing; stage only reviewed changes. Recheck current `git status --short --branch` and `git diff` before starting. No project-specific background schedule was inspected or changed in this documentation pass. Any service schedules in older notes are historical claims to verify in the actual deployment.

Earlier package checks and limits are recorded in [VALIDATION.md](../VALIDATION.md). This handover adds documentation/link/whitespace/secret and source-preservation checks only. No current NAS release, real hardware state, fresh installation, complete data restoration or offsite-backup freshness was verified here.

## Recovery approach

1. Preserve the current installation/data before changing it. Identify the exact code commit and data snapshot required; do not assume this package matches the running service.
2. Recover source into a new folder. Verify the source manifest and restore the project-specific configuration/assets described above separately. Recreate dependencies from the retained project files and guides.
3. Restore user data into an isolated instance or clean test browser. Check a representative editable record, associated files and save/reload behaviour, then compare to the original. Do not test recovery by overwriting production.
4. Record what actually restored and what remains missing. A demo opening or a passing syntax check is not a production recovery drill. Real deployment/device actions need the existing authorised workflow.

## Known limits and next work

Target and API assumptions are recorded in the source README. No new simulator or physical-watch build was run in this documentation update. Public redistribution also needs a review of bundled assets and installation-specific references.

**Priority:** Recover the approved design and configured Garmin environment before full pipeline/build tests. Verify the documented fenix9pro47mm/API target against the intended hardware; run simulator comparisons and a separate hardware/power test after authorised design changes.

Common symptoms to check for this tool:

- Could not load shared draft in a local preview: use Open design for a local JSON or the authenticated hosted editor for NAS saving.
- Field works in preview but not on watch: check the capability matrix and target APIs.
- Changed design not in PRG: regenerate and compile the selected design rather than copying an older binary.

Keep [the release checklist](../RELEASE-CHECKLIST.md) and [third-party notes](../THIRD-PARTY.md) with the package. Original contributions use MIT; bundled/upstream code and assets keep their own licences. Public publication is a separate decision; preparing documentation is not permission to publish.
