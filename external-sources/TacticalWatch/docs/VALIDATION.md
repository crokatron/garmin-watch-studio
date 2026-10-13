# Validation — 24 September 2026

The original editor and approved export are unchanged. Generation, native compilation, deterministic preview and live API rendering were exercised locally.

| Check | Result |
| --- | --- |
| Import/generation tests | `node --test tests/pipeline.test.cjs`: 2 tests passed, including deterministic output, invalid input rejection, source protection, preview isolation and changed-design assets |
| Live and preview compilation | Both successful with Connect IQ SDK 9.2.0 for `fenix9pro47mm` |
| Live simulator run | Rendered Garmin simulator API values; unavailable fields showed `--`; unknown statuses were omitted |
| Deterministic simulator run | Rendered the generated preview without runtime errors during inspection |
| Alternative design | An isolated hybrid draft compiled and ran with generated hands, a group border, changed font/position/colour and an omitted icon; the approved export was not changed |
| Physical watch | Not tested; sustained power use and AMOLED burn-in protection remain unvalidated |

## First-watch-test readiness

The user confirmed **fēnix 9 Pro 47 mm** as the physical target. Additional checks on the live PRG passed: low-power display became black, waking restored the live face, and an accelerated clock crossed midnight from 24 to 25 September with the date and astronomy redrawn and no reported runtime error. The simulator showed approximately **74.1 / 123.9 kB** at the inspected points; this is an observed reading, not a measured worst-case peak or a physical-device battery test.

The current live PRG hash is `fa66f3fb00d31395b378b9b5234ff0b9191b9df6e11fbcebbdd2f59fc6ec4827`. It is ready for a **first on-watch test**, with the documented limitations. Use [the installation guide](INSTALL-ON-WATCH.md). `node tools/package-watch.cjs` checks live-build, approved-input, generated-file and comparison provenance and creates a package under `dist/` containing only the live PRG, installation instructions and build identification. Packaging verifies consistency; it does not replace the simulator inspection or approve a design.

Both compiler logs contain warnings about no declared supported languages and scaling the existing 40 × 40 launcher icon to 65 × 65. There were no compilation errors.

## Visual comparison

The original editor and Garmin simulator were compared at **454 × 454**, **21 September 2026 (day 264), 10:08:38, UTC+4**, in **day mode**, with the same saved sample values. These are simulated conditions, not current watch measurements.

Open [the interactive comparison](../generated/comparison/comparison.html) for side-by-side images, a difference image and an opacity slider. [The static pair](../generated/comparison/side-by-side.png) shows the editor on the left and Garmin on the right. Exact conditions and build provenance are in [comparison.json](../generated/comparison/comparison.json).

Across the circular display, the mean absolute colour-channel error was **3.97 / 255**. **4.65%** of pixels differed by more than 32 in at least one channel. These measurements are diagnostic and do not constitute design approval.

Visual inspection corrected the native font baseline. Remaining visible differences include glyph spacing/weight and antialiasing, some icon/status sizing, and ring/curve rasterization. Broader unsupported options and approximations are listed in [the workflow support matrix](DESIGN-WORKFLOW.md) and the generated per-option capability report.

## Preserved input hashes

SHA-256 of `Watch-Face-Designer.html`:

```text
9294df942930496e7c48241b251ebec1e3fd4aabbfb19bf5d20272514414ed44
```

SHA-256 of `design/approved-layout.json`:

```text
048ff1d3c5b703b223000a9a7a560c03649d0c41dd089ab5156158209bd04f2d
```

Repeat the documented generate/build/capture/compare workflow after every approved design update. This record describes this build only.
