# Garmin Watch Studio

Design a watch face visually, preview its information hierarchy and preserve the design as JSON. Studio 2 provides the editing workspace; the accompanying Monkey C source and build tools translate supported designs into a watch application. A browser preview is not proof that every simulated field or hold interaction is available on the physical watch.

**Private preview · not published.**

[Open the visual manual](docs/USER-MANUAL.md) · [Download the self-contained demo](demo.html) · [Release notes](CHANGELOG.md)

Download `demo.html` using GitHub’s Download raw file control, then open it in your browser. GitHub displays HTML source; it does not run the demo on this page. The demo is an offline simulation with fictional data and makes no network requests.

## See it

### Actual tool · controls at a glance

Actual application screenshot. Numbered boxes point to the controls described below. 

![Garmin Watch Studio — numbered controls](docs/images/guide-1.jpg)

1. **Arrange the face.** Select and drag a field. The readings here are samples, not live watch measurements.
2. **Preview another time.** Check layout readability and the solar ribbon against a fixed time.
3. **Save the editable design.** Save design keeps JSON; Export image creates only a picture.

### Try the working offline example

Screenshot of this project’s interactive demo. Side-by-side services are explicitly simulated.

![Garmin Watch Studio — numbered controls](docs/images/guide-2.jpg)

1. **Compare a display mode.** Switch Day, Night and Always-on in the fictional face.
2. **Simplify the information.** Show or hide sample fields to see their visual effect.
3. **Review the watch face.** Colours and fields update locally. No watch build is sent.

## What this tool does

| Feature | What it lets you do | Where |
| --- | --- | --- |
| Layers and fields | Select, show/hide and position time, date, health, battery, weather and custom information. | Editor |
| Day / Night / Always-on | Compare colour treatments and the separate low-power layout. | Editor |
| Interactions | Preview configured hold targets and see unavailable interactions explicitly. | Editor |
| Solar display | Preview dawn, sunrise, sunset, dusk and other sky fields against a chosen time. | Editor |
| Portable designs | Open/save JSON and export an image; Undo and guides help arrange elements. | Editor |
| Watch build and comparison | Generate supported assets, compile live/preview applications and compare simulator captures. | Build pipeline |

## A first useful workflow

### Arrange a readable face

1. Open Watch-Face-Studio.html and choose Day. Use a fixed Preview time so changing time does not distract from spacing.
2. Choose a field in Layers or click it on the canvas. Drag it into position; Control/Command-click selects several and Alt-click selects underneath overlapping elements.
3. Use Add a field for another data item and Show guides for alignment. Hide unused fields rather than crowding the face.
4. Check Night and Always-on. Day and Night share positions, while the always-on layout needs its own readability review.

## Saving and outputs

The offline editor uses JSON exports; the hosted editor can use a shared NAS draft. Generated watch assets, SDKs and signing credentials are deliberately not backed up here. A complete build needs a configured Garmin environment and an approved design.

## Running the actual tool

Serve the repository locally and open external-sources/TacticalWatch/Watch-Face-Studio.html.

The demo has no prerequisites; the real tool may need the services described in the manual and retained source notes.

## Current boundaries

Target and API assumptions are recorded in the source README. No new simulator or physical-watch build was run in this documentation update. Public redistribution also needs a review of bundled assets and installation-specific references.

## Licence and sharing

MIT applies to original project contributions. Bundled/upstream software and assets retain their own terms; see [third-party notes](THIRD-PARTY.md). Keep this repository private until its own [release checklist](RELEASE-CHECKLIST.md) is complete and the owner authorises publication.
