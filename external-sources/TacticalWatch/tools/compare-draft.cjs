// Review-only comparison. Does not approve, promote or package a design.
const fs=require('node:fs'),path=require('node:path');
const {dependency}=require('./dependencies.cjs');
const {sha}=require('./generate.cjs');
const {sourceHash}=require('./build-receipt.cjs');
async function main(){
  const root=path.resolve(__dirname,'..'),out=path.join(root,'.test-output/readability'),dir=path.join(out,'comparison'),sharp=dependency('sharp');
  const names=['editor-preview.png','simulator-draft.png','editor-night.png','editor-aod.png'];
  for(const name of names){const m=await sharp(path.join(dir,name)).metadata();if(m.width!==454||m.height!==454)throw Error('Expected unscaled 454 × 454 capture: '+name);}
  if(fs.statSync(path.join(dir,names[1])).mtimeMs<fs.statSync(path.join(out,'preview.prg')).mtimeMs)throw Error('Capture predates preview build');
  const conditions=JSON.parse(fs.readFileSync(path.join(dir,'conditions.json')));
  if(conditions.designHash!==sha(fs.readFileSync(path.join(root,'design/readability-draft.json'))))throw Error('Draft has changed; rebuild and recapture');
  const [a,b]=await Promise.all(names.slice(0,2).map(name=>sharp(path.join(dir,name)).flatten({background:'#000'}).removeAlpha().raw().toBuffer()));
  let sum=0,count=0,changed=0;
  for(let y=0;y<454;y++)for(let x=0;x<454;x++){if(Math.hypot(x-227,y-227)>227)continue;const i=(y*454+x)*3;let max=0;for(let c=0;c<3;c++){const delta=Math.abs(a[i+c]-b[i+c]);sum+=delta;max=Math.max(max,delta);}count++;if(max>32)changed++;}
  await sharp({create:{width:908,height:454,channels:3,background:'#000'}}).composite(names.slice(0,2).map((name,i)=>({input:path.join(dir,name),left:i*454,top:0}))).png().toFile(path.join(dir,'side-by-side.png'));
  await sharp({create:{width:1362,height:454,channels:3,background:'#000'}}).composite([names[0],names[2],names[3]].map((name,i)=>({input:path.join(dir,name),left:i*454,top:0}))).png().toFile(path.join(dir,'review-modes.png'));
  const report={draft:true,approved:false,...conditions,programHash:sha(fs.readFileSync(path.join(out,'preview.prg'))),nativeSourcesHash:sourceHash(),simulatorImageHash:sha(fs.readFileSync(path.join(dir,names[1]))),meanChannelError:sum/count/3,changedFraction:changed/count,note:'Day capture from preview simulator; night and AOD images from editor. Simulator AOD also inspected interactively. Diagnostic comparison is not approval or hardware validation.'};
  fs.writeFileSync(path.join(dir,'draft-comparison.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
