const path = require('node:path');
// Ordinary npm install first; the Codex bundled runtime is an optional fallback.
exports.dependency = name => {
  try { return require(name); } catch (original) {
    try { return require(path.join(path.dirname(process.execPath), '..', 'node_modules', name)); }
    catch { throw new Error(`Missing ${name}. Run npm install in this project.`, {cause: original}); }
  }
};
