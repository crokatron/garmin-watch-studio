# Live Studio

Studio 2 adds the compact solar ribbon and editable complication-style interaction preview. See [STUDIO-2.md](STUDIO-2.md) for the new controls, preview-only native build boundary, and browser tests. The existing editor and shared draft bridge below remain in use.

Run `node tools/studio-server.cjs` from this project, then open http://127.0.0.1:47831. The server listens only on this computer and serves an explicit HTML/API allowlist, not the project directory.

The simple workspace uses the original editor engine. Advanced controls opens the full editor against the same draft; Simple workspace returns to the focused layout. The original editor and approved baseline remain separate.

Describe changes in the existing Codex conversation. Codex can read the shared draft, write a proposal, and Studio picks it up within about two seconds. Alternatively, Ask AI saves a request and design locally; tell this conversation to apply the Studio request. The button cannot send a chat message or wake Codex. No API key is required.

## Assistant procedure

1. Read `.local-backup/studio-live/draft.json`, and `request.json` when asked to apply the Studio request. If no draft exists, use `design/approved-layout.json`.
2. Preserve unspecified settings. Write `proposal.json` in the same directory containing an object with `id` (unique string), `base` (exact current draft object), `design` (complete edited design) and `message` (brief description). Read the current draft immediately before preparing it. Write atomically using a temporary file and rename.
3. Verify the intended changes appear in `draft.json` after browser polling. The browser rejects proposals whose base differs from the current draft. Rebase against the latest draft with a new ID if needed.
4. Undo restores the previous draft. Save design downloads JSON. Applying a draft does not authorize baseline promotion or watch installation.

Use one live Studio editing tab to avoid competing autosaves. Offline use supports manual editing and export; live proposals require the server.

## Maintenance

Edit `studio/simple.js` and `studio/simple.css`, then run `node tools/build-studio.cjs`. With the server running and other Studio tabs closed, run `node tools/test-studio.cjs`. It checks modes, position/undo, Advanced round trip, field add/remove, independent AOD, AI requests and live proposals/undo, then restores bridge files.
