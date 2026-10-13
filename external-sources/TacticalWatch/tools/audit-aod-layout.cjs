const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {dependency}=require('./dependencies.cjs');
module.exports=async function audit(output){
 const sharp=dependency('sharp'),cfg=JSON.parse(fs.readFileSync(path.join(output,'resources/config.json'))),layout=cfg.aodLayout;
 const solid=layout.protection==='solid-shift-3';assert(['solid-shift-3','row-cycle-3'].includes(layout.protection));let minY=Infinity,maxY=-Infinity;
 const source=fs.readFileSync(path.join(output,'source/ApprovedLayout.mc'),'utf8');
 async function font(key){const id=Number(source.match(new RegExp('"'+key+'"=>(\\d+)'))[1]),metrics=JSON.parse(fs.readFileSync(path.join(output,`resources/glyphs-${id}.json`))),atlas=await sharp(path.join(output,`resources/font-${id}.png`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const glyphs={};for(const [code,g]of Object.entries(metrics)){const ink=new Set();for(let y=0;y<g[3];y++)for(let x=0;x<g[2];x++)if(atlas.data[((y+g[1])*atlas.info.width+x+g[0])*4+3])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)ink.add((y+dy)*4096+x+dx+2048);glyphs[code]={g,ink};}return {metrics,glyphs};}
 const time=await font('aod');let roundArea=0;for(let y=0;y<454;y++)for(let x=0;x<454;x++)if(Math.hypot(x-227,y-227)<=227)roundArea++;
 let dataBound=0;
 for(let i=0;i<layout.fields.length;i++){
  const item=layout.fields[i],f=await font('aodField'+i);let density=0;
  const definition=fs.readdirSync(path.join(output,'resources')).filter(n=>/^field-.*\.json$/.test(n)).map(n=>JSON.parse(fs.readFileSync(path.join(output,'resources',n)))).find(f=>f.id===item.id);
  const chars=definition?.source==='Humidity'?'HUM 0123456789%.-~':definition?.source==='UV index'?'UV 0123456789.-~':definition?.source==='Feels-like temperature'?'0123456789°C°F .-~':definition?.source==='Date'&&cfg.dateFormat!=='written'?'0123456789/.-~':null;
  for(const [code,{g,ink}]of Object.entries(f.glyphs)){if(g[6]<=0||(chars&&!chars.includes(String.fromCodePoint(Number(code)))))continue;
   // Max over all row phases and horizontal subpixel placements, counting a halo.
   for(let phase=0;phase<3;phase++){let n=0;for(const pixel of ink){const y=Math.floor(pixel/4096);if(solid||((y+phase)%3+3)%3!==0)n++;}density=Math.max(density,n/g[6]);}}
  dataBound+=Math.ceil(item.maxWidth*density);
  const top=Math.min(...Object.values(f.metrics).map(g=>g[5]))-2,bottom=Math.max(...Object.values(f.metrics).map(g=>g[5]+g[3]))+2;
  minY=Math.min(minY,item.y+top);maxY=Math.max(maxY,item.y+bottom);
  for(const shift of solid?[-80,0,80]:[0])for(const x of [item.x-item.maxWidth/2-4,item.x+item.maxWidth/2+4])for(const y of [item.y+top+shift,item.y+bottom+shift])assert(Math.hypot(x-227,y-227)<227,'AOD field can clip: '+item.id);
 }
 let maximum=0;
 for(let minute=0;minute<1440;minute++){
  const h=Math.floor(minute/60),m=minute%60,text=String(cfg.format==='12'?(h%12||12):h).padStart(2,'0')+':'+String(m).padStart(2,'0')+(cfg.format==='12'?(h<12?'a':'p'):'');
  const width=[...text].reduce((n,c)=>n+time.metrics[c.codePointAt(0)][6],0);let x=layout.time.x-width/2;const pixels=new Set();
  for(const c of text){const {g,ink}=time.glyphs[c.codePointAt(0)];for(const pixel of ink){const yy=Math.floor(pixel/4096),xx=pixel-yy*4096-2048,px=Math.floor(x+g[4]+xx),py=Math.floor(layout.time.y+g[5]+yy);if(!solid&&((py%3)+3)%3===m%3)continue;if(solid){minY=Math.min(minY,py);maxY=Math.max(maxY,py);for(const shift of [-80,0,80])assert(Math.hypot(px-227,py+shift-227)<227,'Shifted AOD time clips');}assert(Math.hypot(px-227,py-227)<227,'AOD time clips');pixels.add(py*454+px);}x+=g[6];}
  maximum=Math.max(maximum,pixels.size+dataBound);
 }
 if(solid)assert(maxY-minY<160,'Solid AOD total height must be under 160 px to clear every pixel within three minutes');
 assert(maximum<roundArea*.1,`AOD worst-case ink bound ${(maximum/roundArea*100).toFixed(2)}% exceeds 10%`);
 const report={generationHash:require("./generate.cjs").sha(fs.readFileSync(path.join(output,"manifest.json"))),nativeSourcesHash:require("./build-receipt.cjs").sourceHash(),minutesChecked:1440,maximumLitPixelUpperBound:maximum,roundDisplayPixels:roundArea,maximumFraction:maximum/roundArea,dataBound,continuousPixelLimit:solid?'Whole layout shifts -80/0/+80 px; its complete vertical bounds are under 160 px, so the three frames share no lit pixel.':'Every physical pixel row is cleared once per three minute frames, independent of live values.',note:'Conservative glyph-ink bound with interpolation halo and arbitrary width-limited readings; not physical battery validation.'};
 fs.writeFileSync(path.join(output,'aod-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));return report;
};
