# Tactical Watch — first watch test

This package contains the **live Garmin-data build** for **fēnix 9 Pro 47 mm, 454 × 454, Connect IQ API 6.0 or newer**. The user confirmed this model. It is ready for a first physical-watch test after the recorded simulator checks. Battery endurance and physical-watch behavior still need that test.

## Install

1. Connect the watch to your Windows computer with its USB data cable. Open the watch's storage in File Explorer (it may appear as a portable device rather than a drive letter).
2. Copy **only `TacticalWatch.prg` from this package** into the watch's `GARMIN\APPS` folder. If a previous Tactical Watch file is present, keep a copy on the computer before replacing it. Do not copy the project, the HTML, JSON, signing key, or `TacticalWatch-preview.prg` onto the watch.
3. Wait for the copy to finish, safely disconnect, then select **Tactical Watch** from the watch-face selection menu.

Garmin documents direct PRG installation into `GARMIN/APPS` for device testing in its [developer guide](https://developer.garmin.com/downloads/connect-iq/wearable-programming-for-the-active-lifestyle.pdf). This is a local test installation; no hosting or store publication is involved.

## What to expect

- Time comes from the watch. Health, activity, weather and status values use Garmin APIs. Missing or stale readings show `--`; unknown status icons disappear.
- The screen is intentionally **black in low-power mode** and should return when awakened. An always-on face is not implemented in this build.
- Live compass/heading, GPS status, respiration and AQI are not implemented. Sun/moon positions use the design's saved coordinates and assume north-up. Sporting fixtures use the saved offline schedule.
- Some font spacing, icon sizing and curve antialiasing differ from the browser editor. See the project workflow support matrix for the full audit.

## First check on the watch

Confirm the time/date, let the display sleep and wake several times, leave and return to the face, and check that available HR/steps/weather update. Give cached weather time to arrive from your paired phone. Observe battery use during normal wear before treating this as the daily-use version.

If it shows an IQ error, freezes, fails to wake, or drains unusually quickly, switch back to a built-in face and report what happened. Keep any corresponding `GARMIN\APPS\LOGS\CIQ_LOG.YML` entry if present; share only the relevant crash entry. Avoid deleting other apps or their data.

The package's `build.json` identifies the exact PRG and approved design hashes. Subsequent approved design updates require regeneration, compilation and a fresh simulator comparison before packaging again.
