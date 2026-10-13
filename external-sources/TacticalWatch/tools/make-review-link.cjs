const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),draft=fs.readFileSync(path.join(root,'design/readability-draft.json'),'utf8');
const encoded=Buffer.from(JSON.stringify(JSON.parse(draft))).toString('base64');
// Launcher only: the actual page remains the full original editor with its additive controls.
const html='<!doctype html><meta charset="utf-8"><title>Open readability draft</title><p>Opening the full local watch-face editor…</p><script>location.replace("Watch-Face-Designer.html#review="+encodeURIComponent('+JSON.stringify(encoded)+'));</script>';
fs.writeFileSync(path.join(root,'Review-Readability.html'),html);
