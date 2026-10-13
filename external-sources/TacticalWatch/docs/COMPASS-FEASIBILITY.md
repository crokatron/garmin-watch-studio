# Required compass behavior and platform findings

The user clarified on 25 September 2026 that the north pointer must remain pointed toward north and the sun/moon markers must remain aligned with the sky as the wrist rotates. The first physical-watch build does **not** meet this requirement: its live sky markers assume north-up and its live north needle is omitted.

For an upright, level display, a true-north heading is needed on every active orientation update. The screen bearing is `(true bearing - watch heading + 360) mod 360`; north uses true bearing zero, and the sun/moon use their calculated azimuths. At a 90-degree east heading, north belongs on the left of the screen. The arrow geometry must rotate too, not just its centre. A circular azimuth marker indicates horizontal direction, not the body's altitude in the sky. Calculations currently use the approved export's saved Dubai coordinates, not a current GPS fix.

## Verified constraints

- In installed Connect IQ SDK 9.2.0, `bin/api.mir` declares `Toybox.Sensor` with `disableWatchFace = true` (line 26196 in this installation). Sensor events therefore cannot simply be enabled in this foreground watch-face project.
- `Activity.getActivityInfo().currentHeading` exists and is documented as a true-north heading, but the returned activity values can be null. Its existence does not establish continuous compass sampling by a watch face. [Garmin API reference](https://developer.garmin.com/connect-iq/api-docs/Toybox/Activity/Info.html#currentHeading-var).
- A [Garmin-acknowledged issue](https://forums.garmin.com/developer/connect-iq/i/bug-reports/make-the-magnetometer-compass-data-available-to-watch-faces-without-starting-an-activity) reports that watch-face heading updates occur during an activity or briefly after opening the compass. This is evidence against relying on that value for an always-correct pointer; it is not a hardware test of this user's fēnix 9 firmware.
- A simulator heading can be driven by simulated activity data even when the physical watch does not continuously supply it. A successful simulator rotation alone cannot validate the requirement on hardware.

## Implementation decision

Do not ship an arrow driven by an unverified cached heading and label it as a reliable compass. The supported sensor API is available to an interactive watch app, making a separate compass/sky companion view a viable architecture to investigate. That would need the user to open it and still requires sensor, calibration and orientation testing on the physical watch. It is not equivalent to an ordinary watch face.

The user requested a solution within the ordinary watch face. The readability draft therefore includes an **experimental passive-heading option**, without a separate app or hidden activity recording. It reads `Activity.getActivityInfo().currentHeading` only while awake. A value must change before it is displayed; unchanged values expire after 15 seconds. Sleep clears the qualification. This heuristic cannot establish sensor freshness or distinguish a stationary wrist from frozen firmware data.

When qualified, the label uses `~` and the north arrow geometry, arrow location and sky azimuth markers counter-rotate by the same heading. When unavailable, the label reads `HDG --` and directional pointers are hidden. North-up remains an explicit diagram option. The simulator uses a separately labelled simulated heading and cannot verify physical tracking.

This is a best-effort experiment, **not fulfillment of the always-aligned compass requirement**. Physical testing must confirm whether the user's firmware supplies changing heading without opening another app. If it does not, this watch-face API offers no verified workaround that meets the requirement. The approved JSON and installed build remain unchanged until design review and installation.

25 September follow-up: the user reports that no direction markers appear on the physical watch. A touch-and-hold data-refresh button is now installed, but cannot activate the compass sensor. Missing heading remains explicitly reported; no reliable continuous wrist tracking has been established. See REFRESH-AND-SOLID-AOD.md.
