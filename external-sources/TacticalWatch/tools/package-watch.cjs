const fs = require('node:fs');
const path = require('node:path');
const {sha} = require('./generate.cjs');
const {sourceHash} = require('./build-receipt.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name));
const receipt = JSON.parse(read('bin/TacticalWatch-receipt.json'));
const generation = JSON.parse(read('generated/manifest.json'));
const program = read('bin/TacticalWatch.prg');
if (receipt.profile !== 'TacticalWatch' || receipt.programHash !== sha(program) ||
    receipt.nativeSourcesHash !== sourceHash() || receipt.generationHash !== sha(read('generated/manifest.json'))) {
  throw Error('The live build is stale or changed. Run tools/Update-Design.ps1 and repeat simulator validation.');
}
if (generation.designHash !== sha(read('design/approved-layout.json')) || generation.editorHash !== sha(read('Watch-Face-Designer.html'))) {
  throw Error('The approved design or editor changed after generation.');
}
for (const [name, hash] of Object.entries(generation.files)) {
  const file = path.resolve(root, 'generated', name);
  if (!file.startsWith(path.join(root, 'generated') + path.sep) || sha(fs.readFileSync(file)) !== hash) {
    throw Error('Changed generated artifact: ' + name);
  }
}
const comparison = JSON.parse(read('generated/comparison/comparison.json'));
if (comparison.nativeSourcesHash !== receipt.nativeSourcesHash || comparison.generationHash !== receipt.generationHash) {
  throw Error('The simulator/editor comparison does not match this build.');
}
if (!/const preview\s*=\s*false/.test(read('profiles/live/RuntimeProfile.mc').toString()) ||
    !read('monkey.jungle').toString().includes('profiles/live') || read('monkey.jungle').toString().includes('generated/preview')) {
  throw Error('Unexpected live build configuration.');
}
const cfg=JSON.parse(read('generated/resources/config.json'));
if(cfg.aodLayout){const audit=JSON.parse(read('generated/aod-validation.json'));if(audit.generationHash!==receipt.generationHash||audit.nativeSourcesHash!==receipt.nativeSourcesHash||audit.maximumFraction>=0.1)throw Error('Current AOD audit required before packaging.');}
const destination = path.join(root, 'dist', 'watch-test-fenix9pro47mm-' + receipt.programHash.slice(0,12));
fs.mkdirSync(destination, {recursive:true});
fs.writeFileSync(path.join(destination, 'TacticalWatch.prg'), program);
fs.copyFileSync(path.join(root, 'docs/INSTALL-ON-WATCH.md'), path.join(destination, 'INSTALL.md'));
fs.writeFileSync(path.join(destination, 'build.json'), JSON.stringify({
  ...receipt, target:'fenix9pro47mm', resolution:454, minimumApi:'6.0.0',
  designHash:generation.designHash, editorHash:generation.editorHash,
  readiness:'First physical-watch test; battery endurance and hardware behavior are not yet validated.'
}, null, 2) + '\n');
if (sha(fs.readFileSync(path.join(destination, 'TacticalWatch.prg'))) !== receipt.programHash) throw Error('Package verification failed.');
console.log(destination);
