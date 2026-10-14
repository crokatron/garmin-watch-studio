# Garmin Watch Studio: start here

**Continuing this tool? Read [the detailed handover](HANDOVER.md).** For pictures and operation, use the [manual](USER-MANUAL.md) and [offline demo](../demo.html).

Visual watch-face layers and previews, with a generated Monkey C workflow and simulator comparison. Preview values and supported live watch fields must remain distinguishable.

**Start with:** Arrange a readable face. Open Watch-Face-Studio.html and choose Day. Use a fixed Preview time so changing time does not distract from spacing.

**Source:** this is a private source checkpoint, not a live-system mirror. Check [the source manifest](../SOURCE-MANIFEST.json) and current working files before merging.

**Keep your work safe:** The offline editor uses JSON exports; the hosted editor can use a shared NAS draft. Generated watch assets, SDKs and signing credentials are deliberately not backed up here. A complete build needs a configured Garmin environment and an approved design.

**Next maintainer action:** Recover the approved design and configured Garmin environment before full pipeline/build tests. Verify the documented fenix9pro47mm/API target against the intended hardware; run simulator comparisons and a separate hardware/power test after authorised design changes.

**Status:** private upload verified on 14 October 2026. These guides accompany the source package. Live runtime, data backups and full recovery were not retested. Public sharing was authorised on 14 October 2026; the NAS backup remains private.
