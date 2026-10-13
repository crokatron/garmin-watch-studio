# Bold AOD and hold-to-refresh — 25 September 2026

Installed the requested refinement from the current approved design. The previous design is archived in design/history. The full offline editor and Review-Readability.html contain the matching design.

AOD now uses weight 700 instead of 500, a 54 px time instead of 48 px, 20 px readings instead of 18 px, and colour #8fcfa4. All five readings remain. Solid-shift-3 removes row blanking and shifts the complete layout by -80, 0, +80 px over three consecutive minute frames. The editor's editable AOD view shows base positions; a clean preview shows the current minute offset. The three complete vertical bounds have no common intersection, so arbitrary changing text cannot keep a pixel continuously lit across all three frames. Width limits still apply; excess text is marked with ~.

The on-face HOLD REFRESH control uses WatchFaceDelegate.onPress, Garmin's touch-and-hold event. While awake it rereads available Garmin data, invalidates the daily astronomy cache, and requests rendering. Requests within two seconds are coalesced. It does not start GPS, a compass sensor, a background recording or a network weather request. For ten seconds the button shows NO HEADING if no qualified heading is available, or DATA REREAD otherwise. It is absent and inactive in AOD. The editor Time panel can enable and position it; geometry is exported and generated, not hardcoded in the renderer.

The physical watch has not provided visible direction markers according to the user. This update does not claim to fix the platform heading restriction. North, sun and moon azimuth markers remain hidden without qualifying changing heading. Calculations use saved Dubai coordinates. Preview headings and readings remain simulated and isolated from the live package.

Validation: both profiles compile; five editor/import tests and four Monkey C tests pass, including refresh hit area, sleeping/disabled rejection and throttling. The 454 x 454 daytime comparison has mean channel error 3.84/255 and changed fraction 4.48%; font spacing, border and ring rasterization differ. Native AOD and live-data rendering were visually inspected without runtime errors. Native unit tests verify refresh handling; the physical touch-and-hold gesture remains to be tried by the user.

AOD audit checks 1,440 clock values, glyph interpolation halos, all three shifted boundaries, and conservative width-bounded live text. Numeric weather/date sources use their actual permitted character sets; other sources use the complete generated alphabet. Maximum lit-pixel upper bound is 15,658 / 161,835 = 9.68%. This is a rendering bound, not battery-life measurement. The package requires a matching audit and simulator comparison.

Live program SHA-256: dbbc91e04ff69e4165af45a26bac965e0299741edda4f1fb0fb0caa8b9108606 (390700 bytes).
Transferred to fenix 9 Pro - 47mm / Internal Storage / GARMIN / Apps / TacticalWatch.prg. Device readback hash matches exactly. Receipt: .local-backup/watch-install/20260925-010419/installation.json. Disconnect USB to activate.

Reference: https://developer.garmin.com/connect-iq/api-docs/Toybox/WatchUi/WatchFaceDelegate.html#onPress-instance_function

## Larger refresh touch target — 25 September 2026
The native refresh hit area now extends 24 pixels beyond each side of the visible button. At the approved size this is 212 × 82 pixels, compared with the visible 164 × 34 outline. The editor geometry and approved design are unchanged. Touch and hold while awake; a quick tap still does not invoke this action.

All four native tests passed, including expanded hit boundaries, rejected points outside the target, sleep, disabled control and repeat throttling. Live and preview builds compiled. The fresh 454 × 454 simulator comparison retained the previous visual error metrics (mean channel error 3.83846; changed fraction 0.044811). AOD audit remains 9.6753% maximum lit-pixel bound. These tests do not establish physical touchscreen event delivery.

Ready package: dist/watch-test-fenix9pro47mm-0b3a3710ab14. Installation was attempted but did not complete; no present WPD device was found. This update is not yet verified on the watch.
