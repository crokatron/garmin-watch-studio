# Studio 2 interaction preview

Open `Watch-Face-Studio.html` directly for a self-contained offline workspace, or run `node tools/studio-server.cjs` and open http://127.0.0.1:47831 for the existing local Codex draft bridge. No remote assets or browser API key are required. Use one live editing tab at a time.

The default preview is saved in `design/studio2-preview.json`. It extends the existing design with a versioned `studio2` object; original field geometry, groups, independent AOD layout and native watch options are retained. `design/approved-layout.json`, `Watch-Face-Designer.html` and handwritten Monkey C remain unchanged. The previous Studio is backed up under `.local-backup/studio2-before/`.

## Using the preview

- Use current time starts the clock and updates the date and solar calculations in the selected UTC offset (Dubai: UTC+4). Pause clock freezes the preview; editing Preview time also stops the live clock. The clock handles midnight and year changes. Health values remain samples.
- Select Solar ribbon, Notifications, Sleep Score, Health or Refresh from Layers or directly on the face. The same inspector edits the visible control, placement, radius/rotation, action, padded target and Day/Night/AOD visibility.
- The ribbon defaults to a 120-degree lower arc, radius 207, and 4 native pixels thick. Dawn/dusk are nautical (-12 degrees) from the existing approximate astronomy engine. Golden intervals use the saved minutes on either side of sunrise/sunset. Sunrise/set ticks and the current-sun marker follow the timeline. On-watch DAWN, RISE, SET and DUSK labels show their times; labels can be hidden or resized in the ribbon inspector. The inspector and expandable Solar times section list exact start/end times for all five coloured intervals. Outside the solar period it dims and can show a next-dawn endpoint. Missing polar events produce a neutral dotted arc, with an explicit explanation.
- Quarter marks are the default bezel information. Optional minute ticks leave a gap over the ribbon. Optional small cardinals use simulated preview heading. Reliable continuous physical compass orientation remains unverified; see COMPASS-FEASIBILITY.md. The old 24-hour scale, lunar ring and large azimuth markers are superseded only while Studio 2 is enabled.
- Notifications has a bell and sample count; Sleep Score has a moon and sample score; Health supports HR, Body Battery, Stress, Sleep Score, Recovery and Training Status. Source, icon, value, visual style and hold action are independently editable. The existing Refresh control becomes a compact refresh icon.
- Target width/height are the maximum of the configured minimum and visible dimensions plus twice the padding. Target overlays and hit testing share one geometry function, including rotation and ellipse shape. Targets are clipped by the watch screen. When targets overlap, the nearest control centre wins; controls take priority over the ribbon. The ribbon target is the visible arc expanded by padding in both radial directions, with flat ends.
- Test holds pauses dragging. Press for 650 ms anywhere inside a control's target to see a labelled action preview; moving more than 5 native pixels cancels the hold. This is a Studio test duration, not a claim about Garmin's hold timing. AOD actions remain inactive even when a control is visible.
- Save design, Open design, import preview / Keep / Discard, Undo, clean PNG export, independent AOD editing, and Advanced controls are retained. PNG export removes all selection and hold-target overlays.
- Ask AI stores the instruction, selected layer, preview mode and complete design in the existing local request bridge; offline it downloads a request file. It does not automatically send a message or run a model. Tell the current Codex conversation to apply the Studio request. No API key is placed in HTML.

## Device capability boundary

This deliverable implements a **Studio preview**, not new native complication subscriptions or watch launch handlers. Documented Garmin complication types include notifications (17), heart rate (18), recovery time (21), stress (22), Body Battery (23), training status (26), and Sleep Score (42, API 6.0.2). Earlier listed types use API 4.2.0. A native implementation must check actual device complication availability and handle missing values or launch failures.

Garmin documents touch-and-hold through WatchFaceDelegate.onPress and complication navigation through Complications.exitTo. No public Wallet complication or documented watch-face Wallet launch route was found. Wallet is visible as a dashed, grey, crossed-wallet button near 12 o’clock. It remains unavailable: selecting it opens layout controls and an explanation; a test hold explains why it cannot launch. It has no invented ID or launch action. Use the device's native Wallet shortcut. This is a documented-API limitation, not a legal opinion.

Sources checked 29 September 2026:

- [Garmin Complications reference](https://developer.garmin.com/connect-iq/api-docs/Toybox/Complications.html)
- [Garmin WatchFaceDelegate reference](https://developer.garmin.com/connect-iq/api-docs/Toybox/WatchUi/WatchFaceDelegate.html)

The native generator explicitly rejects enabled Studio 2 drafts instead of silently dropping their new features. The approved live/preview pipeline remains usable. A Studio 2 entry is included in generated/capabilities.json. Native AOD burn-in and power validation would be required for a later native port; Studio sample values never become live sensor readings.

## Maintenance and validation

Edit `studio/interaction-model.js`, `studio/interaction-view.js`, `studio/simple.js` and `studio/simple.css`; regenerate the self-contained HTML with `node tools/build-studio.cjs`. The build embeds `design/studio2-preview.json` when present, otherwise the approved layout. Browser autosave has its own Studio 2 key. The server still uses the current shared draft; apply conversational changes with the exact-base proposal procedure in STUDIO-LIVE.md.

Validated:

- `node --test tests/pipeline.test.cjs tests/readability.test.cjs tests/aod-studio.test.cjs tests/studio2-model.test.cjs`
- `node tools/test-studio.cjs` (with other live Studio editing tabs closed)
- `node tools/test-studio2.cjs` (isolated offline browser; no HTTP requests)
- `tools/Update-Design.ps1` against the existing approved baseline: live and deterministic preview both BUILD SUCCESSFUL. Existing warnings: no manifest language declarations; 40px launcher icon scaled to the device's 65px size.
- Existing approved AOD audit checked 1,440 minutes: conservative maximum lit-pixel fraction 9.6753%, under 10%. This does not audit hypothetical native Studio 2 controls.
- Studio 2 browser checks cover rotated expanded targets, action selection, short/cancelled holds, drag/undo, all health sources, missing data, independent mode visibility, AOD no-launch, visible Wallet with no launcher, solar boundary time references, clock midnight/year rollover and pause/manual-time behavior, solar night handling, JSON round trip, clean renders, retained AI text and 390px mobile layout.

No watch installation or baseline promotion was performed. Simulator comparison of the new Studio 2 design is not applicable until its native renderer exists.
