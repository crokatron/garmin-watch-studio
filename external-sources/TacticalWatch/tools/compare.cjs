const fs=require('node:fs');
const path=require('node:path');
const {dependency}=require('./dependencies.cjs');
const {sha}=require('./generate.cjs');
const {sourceHash}=require('./build-receipt.cjs');
async function compare(simulatorFile){
  const root=path.resolve(__dirname,'..'),dir=path.join(root,'generated/comparison');
  const reference=path.join(dir,'editor-preview.png'),conditions=JSON.parse(fs.readFileSync(path.join(dir,'conditions.json')));
  const receiptPath=path.join(root,'bin/TacticalWatch-preview-receipt.json');
  if(!fs.existsSync(receiptPath))throw Error('Build the current preview with Build-Watch.ps1 -Preview first.');
  const receipt=JSON.parse(fs.readFileSync(receiptPath));
  if(receipt.nativeSourcesHash!==sourceHash()||receipt.generationHash!==sha(fs.readFileSync(path.join(root,'generated/manifest.json'))))throw Error('The preview build is stale; regenerate/build before capturing it.');
  if(fs.statSync(simulatorFile).mtimeMs<fs.statSync(path.join(root,'bin/TacticalWatch-preview.prg')).mtimeMs)throw Error('This capture predates the current preview build. Run the new preview and save a new screen capture.');
  const sharp=dependency('sharp');
  const metadata=await sharp(simulatorFile).metadata();
  if(metadata.width!==454||metadata.height!==454)throw Error('Use Garmin File > Save Screen Capture (454 × 454 face), not a desktop screenshot. No automatic resizing/cropping is performed.');
  const [a,b]=await Promise.all([sharp(reference).flatten({background:'#000000'}).removeAlpha().raw().toBuffer(),sharp(simulatorFile).flatten({background:'#000000'}).removeAlpha().raw().toBuffer()]);
  const diff=Buffer.alloc(a.length);let sum=0,changed=0,count=0;
  for(let y=0;y<454;y++)for(let x=0;x<454;x++){
    const index=(y*454+x)*3;if(Math.hypot(x-227,y-227)>227)continue;
    let max=0;for(let c=0;c<3;c++){const delta=Math.abs(a[index+c]-b[index+c]);sum+=delta;max=Math.max(max,delta);diff[index+c]=Math.min(255,delta*3);}count++;if(max>32)changed++;
  }
  await sharp(diff,{raw:{width:454,height:454,channels:3}}).png().toFile(path.join(dir,'difference.png'));
  const target=path.join(dir,'simulator-preview.png');if(path.resolve(simulatorFile)!==target)fs.copyFileSync(simulatorFile,target);
  await sharp({create:{width:908,height:454,channels:3,background:'#000000'}}).composite([{input:reference,left:0,top:0},{input:target,left:454,top:0}]).png().toFile(path.join(dir,'side-by-side.png'));
  const report={...conditions,...receipt,simulatorImageHash:sha(fs.readFileSync(target)),meanChannelError:sum/count/3,changedPixelsOver32:changed,comparedPixels:count,changedFraction:changed/count,verdict:'Visual review required; antialiasing, glyph spacing and compositing differ. These metrics are not an automatic approval.'};
  fs.writeFileSync(path.join(dir,'comparison.json'),JSON.stringify(report,null,2)+'\n');
  const data=name=>'data:image/png;base64,'+fs.readFileSync(path.join(dir,name)).toString('base64');
  fs.writeFileSync(path.join(dir,'comparison.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Editor / Garmin comparison</title><style>body{background:#121519;color:#ddd;font:16px system-ui;margin:28px}section{display:flex;flex-wrap:wrap;gap:24px}figure{margin:0}img{width:454px;height:454px}figcaption{margin:10px 0}p{max-width:1000px}label{display:block;margin:20px 0}.overlay{position:relative;width:454px;height:454px}.overlay img{position:absolute;left:0;top:0}</style><h1>Editor / Garmin simulator</h1><p><strong>SIMULATED PREVIEW</strong> · ${conditions.resolution} × ${conditions.resolution} · ${conditions.year}, day ${conditions.day} · ${conditions.time}:38 · UTC${conditions.utcOffset>=0?'+':''}${conditions.utcOffset} · ${conditions.mode}. Health, weather and status values are samples.</p><section><figure><img src="${data('editor-preview.png')}"><figcaption>Original editor</figcaption></figure><figure><img src="${data('simulator-preview.png')}"><figcaption>Garmin simulator · native renderer</figcaption></figure><figure><img src="${data('difference.png')}"><figcaption>Absolute difference, amplified 3×</figcaption></figure></section><label>Overlay opacity <input type="range" min="0" max="1" step=".01" value=".5" oninput="document.getElementById('native').style.opacity=this.value"></label><div class="overlay"><img src="${data('editor-preview.png')}"><img id="native" style="opacity:.5" src="${data('simulator-preview.png')}"></div><p>Mean channel error: ${report.meanChannelError.toFixed(2)} / 255. Pixels differing by more than 32 in a channel: ${(report.changedFraction*100).toFixed(2)}%. These are diagnostic measurements, not a fidelity approval. See the workflow limitations.</p><p>Approved design SHA-256: ${conditions.designHash}</p></html>`);
  console.log(JSON.stringify({meanChannelError:report.meanChannelError,changedFraction:report.changedFraction,report:path.join(dir,'comparison.html')},null,2));return report;
}
module.exports={compare};
if(require.main===module)compare(path.resolve(process.argv[2]||'generated/comparison/simulator-preview.png')).catch(e=>{console.error(e);process.exitCode=1;});
