const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {dependency}=require('./dependencies.cjs');
async function check(output=path.resolve(__dirname,'../.test-output/readability')){
  const sharp=dependency('sharp'),cfg=JSON.parse(fs.readFileSync(path.join(output,'resources/config.json')));
  if(!cfg.aodTimeOnly){console.log('AOD disabled: pixel audit not required');return;}
  if(cfg.aodLayout)return require('./audit-aod-layout.cjs')(output);
  const source=fs.readFileSync(path.join(output,'source/ApprovedLayout.mc'),'utf8'),font=Number(source.match(/"aod"=>(\d+)/)[1]);
  const metrics=JSON.parse(fs.readFileSync(path.join(output,`resources/glyphs-${font}.json`)));
  const atlas=await sharp(path.join(output,`resources/font-${font}.png`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const ink={};
  for(const [code,g] of Object.entries(metrics)){
    ink[code]=[];
    for(let y=0;y<g[3];y++)for(let x=0;x<g[2];x++)if(atlas.data[((y+g[1])*atlas.info.width+x+g[0])*4+3]>0)ink[code].push([x,y]);
  }
  let area=0;for(let y=0;y<454;y++)for(let x=0;x<454;x++)if(Math.hypot(x-227,y-227)<=227)area++;
  const ids=cfg.aodFieldIds||[],dataFont=Number(source.match(/"aodData"=>(\d+)/)[1]);
  const dataMetrics=JSON.parse(fs.readFileSync(path.join(output,`resources/glyphs-${dataFont}.json`)));
  const top=Math.floor(Math.min(...Object.values(dataMetrics).map(g=>g[5])))-1,bottom=Math.ceil(Math.max(...Object.values(dataMetrics).map(g=>g[5]+g[3])))+1;
  let maxLit=0,history=[];
  for(let total=0;total<1440;total++){
    const h=Math.floor(total/60),m=total%60;
    const text=String(cfg.format==='12'?(h%12||12):h).padStart(2,'0')+':'+String(m).padStart(2,'0')+(cfg.format==='12'?(h<12?'a':'p'):'');
    const p=cfg.aodPositions[m%3],chars=[...text],width=chars.reduce((n,c)=>n+metrics[c.codePointAt(0)][6],0),mask=new Set();let advance=-width/2;
    for(const c of chars){const key=c.codePointAt(0),g=metrics[key];
      for(const [x,y] of ink[key]){
        // Conservative one-pixel interpolation halo around each source pixel.
        const px=Math.floor(p[0]+advance+g[4]+x),py=Math.floor(p[1]-(ids.length?12:0)+g[5]+y);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const xx=px+dx,yy=py+dy;assert(Math.hypot(xx-227,yy-227)<227,'AOD clipped by circular display');mask.add(yy*454+xx);
        }
      }advance+=g[6];
    }
    // Full text bounds conservatively cover all changing live readings.
    for(let i=0;i<ids.length;i++){const cx=ids.length===1?227:147+i*160;for(let y=p[1]+25+top;y<=p[1]+25+bottom;y++)for(let x=cx-75;x<=cx+75;x++){assert(Math.hypot(x-227,y-227)<227,'AOD data clipped');mask.add(y*454+x);}}
    assert(mask.size<area*0.1,'AOD exceeds 10% pixel budget');maxLit=Math.max(maxLit,mask.size);
    if(history.length===3)for(const pixel of mask)assert(!history.every(old=>old.has(pixel)),'A pixel remains on for four consecutive minutes');
    history.push(mask);if(history.length>3)history.shift();
  }
  const report={minutesChecked:1440,maximumLitPixelsWithInterpolationHalo:maxLit,roundDisplayPixels:area,maximumFraction:maxLit/area,continuousPixelLimit:'No pixel lit for four consecutive minute frames',note:'Conservative atlas-based check, not physical-panel burn-in or battery validation.'};
  fs.writeFileSync(path.join(output,'aod-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
check(process.argv[2]?path.resolve(process.argv[2]):undefined).catch(e=>{console.error(e);process.exitCode=1;});
