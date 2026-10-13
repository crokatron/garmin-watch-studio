const fs=require('node:fs');
const path=require('node:path');
const {sha}=require('./generate.cjs');
const root=path.resolve(__dirname,'..');
function sourceHash(){return sha(fs.readdirSync(path.join(root,'source')).sort().map(n=>fs.readFileSync(path.join(root,'source',n))).join('\n'));}
module.exports={sourceHash};
if(require.main===module){const name=process.argv[2];if(!['TacticalWatch','TacticalWatch-preview'].includes(name))throw Error('Invalid build name');const receipt={programHash:sha(fs.readFileSync(path.join(root,'bin',name+'.prg'))),nativeSourcesHash:sourceHash(),generationHash:sha(fs.readFileSync(path.join(root,'generated/manifest.json'))),builtAt:new Date().toISOString(),profile:name};fs.writeFileSync(path.join(root,'bin',name+'-receipt.json'),JSON.stringify(receipt,null,2)+'\n');}
