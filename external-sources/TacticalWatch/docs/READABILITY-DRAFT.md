# Approved readability update — installed 25 September 2026

The latest user export, watch-face-design (1).json, is preserved as design/user-reference-final-2026-09-25.json. The user authorised refinement, testing and upload. The refined result is now design/approved-layout.json; the previous baseline is archived under design/history. Review-Readability.html opens the matching full editable studio.

The AOD date, match and time are centred. Humidity, UV and feels-like temperature share an aligned row. AOD uses its saved coordinates and sizes; text is constrained to saved maxWidth and marked with ~ if shortened. Feels-like omits the FEELS prefix in AOD. Every third pixel row is cleared, cycling each minute, so stationary pixels are not continuously lit. This pattern is visible in the studio and on watch. No AOD icons are rendered. Normal day/night field positions remain independent.

## Validation and transfer

Both live and deterministic preview profiles compile. Five editor/import tests pass. Three native Monkey C tests pass: north/sky counter-rotation, missing/frozen/wake heading handling, and solar/lunar progression over time. Native testing found and fixed an unavailable Math.abs call in the heading path.

The current 454 x 454 day comparison at 10:08:38 has mean channel error 3.11/255 and 3.65% of pixels differing by more than 32 in a channel. Remaining differences are primarily glyph spacing, ring rasterization and the battery-days icon. The simulator displays the five-field AOD without runtime errors; live API rendering and automatic night colours were also inspected. Preview memory is about 82.6/123.9 kB. Existing launcher scaling and language warnings remain.

The AOD audit checks all 1,440 clock values and conservatively bounds arbitrary width-limited data text, including interpolation: maximum 9.04% lit circular-display area. Each physical pixel row is cleared once per three minute frames. This does not establish physical battery endurance or long-term panel behaviour. Update-Design.ps1 now requires an AOD audit before compiling; packaging requires the current matching audit.

Live program SHA-256: fc2057c4ef834284b17de0ce5bd4d7bf434f2d8a547aa8c11fe2132d97f85cd1 (389244 bytes).

Copied to fenix 9 Pro - 47mm / Internal Storage / GARMIN / Apps / TacticalWatch.prg. Device readback SHA-256 matches exactly. Receipt: .local-backup/watch-install/20260925-005037/installation.json. Disconnect USB and select the face to activate it. The simulated preview was not installed.

## Compass limitation

The north arrow and both azimuth markers share heading compensation. Native tests confirm the mathematics; this is not a verified hardware compass fix. Garmin may not supply changing passive heading outside an activity. In that case, pointers are hidden rather than presenting a stale direction. The user disabled numeric heading, so no HDG -- label appears. Physical wrist rotation must still be checked. Sky calculations use saved Dubai coordinates; the markers represent horizontal azimuth, not elevation. No separate app or hidden activity recording was added.

Superseded by the installed bold AOD / refresh refinement documented in docs/REFRESH-AND-SOLID-AOD.md.
