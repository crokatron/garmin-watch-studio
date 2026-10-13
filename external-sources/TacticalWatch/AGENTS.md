# Live design workflow

- For the new simple Studio, read `docs/STUDIO-LIVE.md`. Apply conversational design edits through the local draft/proposal bridge when running, so the open Studio updates directly. Preserve the approved baseline until explicitly promoted.

- Keep `Watch-Face-Designer.html` as the editable, offline companion. Preserve its functionality. If missing, ask for the latest original; never substitute a recreated editor.
- `design/approved-layout.json` is the active baseline. Only promote a newer export when the user supplies or approves it. Do not replace it with browser autosave or the editor's embedded defaults.
- Use `tools/Update-Design.ps1` to regenerate and compile. Handwritten Monkey C belongs in `source/`; generated code/assets belong in `generated/`. Never put implementation fixes into generated files.
- After an approved update, build the live and deterministic preview variants and compare the Garmin simulator with the editor at 454 × 454 under the saved comparison conditions. Report actual validation and remaining differences.
- Keep preview sensor/state values out of the live build. Unsupported and approximate options must be listed in `generated/capabilities.json` and the workflow documentation.
- Offline editing remains available. The user also requested independent NAS hosting at projects.mungoon.net. Do not expose or replace the developer signing key.
- Required direction behavior (user clarification, 25 September 2026): north must stay aligned with geographic north as the wrist rotates; sun and moon markers must counter-rotate using the same current heading. The north-up rendering in the first watch-test build does not satisfy this requirement. Do not describe it as implemented, or substitute cached/simulated heading for verified live orientation. See docs/COMPASS-FEASIBILITY.md before changing the app architecture.

## NAS live version

After completed, validated editor changes, run `C:/Users/lamon/Desktop/AI TOOLS/NAS/projects-host/Publish-Projects.ps1` and verify the hosted version. Read that directory's README.md first. The publisher rebuilds Studio from these sources and never includes the Garmin signing key or SDK.

For changes to the live NAS design, read its current `/garmin/api/draft` and ETag first, then save with If-Match. Do not push a stale local bridge draft over the NAS draft. `/garmin/api/request` contains requests saved by the hosted Ask AI panel. Keep approved baseline promotion and actual watch builds separate from editor hosting.
