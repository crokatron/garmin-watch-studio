const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {dependency}=require('./dependencies.cjs');
const root=path.resolve(__dirname,'..');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function mc(value){
  if(value===null||value===undefined)return 'null';
  if(typeof value==='string')return JSON.stringify(value).replace(/\\u([0-9a-f]{4})/gi,(_,x)=>String.fromCharCode(parseInt(x,16)));
  if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Non-finite number');return Number.isInteger(value)?String(value):value.toFixed(6);}
  if(typeof value==='boolean')return String(value);
  if(Array.isArray(value))return '['+value.map(mc).join(',')+']';
  return '{'+Object.entries(value).map(([k,v])=>mc(k)+'=>'+mc(v)).join(',')+'}';
}
function validate(d){
  if(d.studio2?.enabled)throw Error('Studio 2 is an interaction preview, not a native watch layout yet. Use the approved baseline for watch builds; do not silently drop the solar ribbon or hold controls.');
  if(d.version!==1||d.device!=='fenix9pro47mm'||!Array.isArray(d.fields)||d.fields.length>100)throw Error('Expected version 1 export for fenix9pro47mm, with at most 100 fields.');
  if(d.aodSize!==undefined&&(!Number.isFinite(d.aodSize)||d.aodSize<36||d.aodSize>64))throw Error('AOD size must be 36–64 px');
  if(d.headingMode!==undefined&&!['northUp','available'].includes(d.headingMode))throw Error('Invalid heading mode');
  if(d.scaleStep!==undefined&&![1,2,3,6].includes(d.scaleStep))throw Error('Invalid sky scale interval');
  if(d.aodPositions!==undefined&&JSON.stringify(d.aodPositions)!==JSON.stringify([[227,151],[227,227],[227,303]]))throw Error('Use the verified three AOD positions');
  for(const [key,allowed]of Object.entries({style:['analog','digital','hybrid'],format:['12','24'],secondsStyle:['off','hand','perimeter'],secondsShape:['triangle','chevron','kite','diamond','dot'],solarPointerShape:['triangle','chevron','kite','diamond','dot'],dayBandStyle:['solid','dashed','dotted','segmented'],solarTop:['midnight','noon']})){
    if(d[key]!==undefined&&!allowed.includes(d[key]))throw Error(`Unsupported ${key}: ${d[key]}`);
  }
  for(const [key,min,max]of [['previewYear',1970,2100],['previewDay',1,366],['latitude',-90,90],['longitude',-180,180],['utcOffset',-14,14],['digitalSize',4,120],['statusSize',4,100],['headingSize',4,100]]){
    if(d[key]!==undefined&&(typeof d[key]!=='number'||!Number.isFinite(d[key])||d[key]<min||d[key]>max))throw Error(`Invalid ${key}`);
  }
  const ids=new Set();
  for(const f of d.fields){
    if(typeof f.id!=='string'||ids.has(f.id))throw Error('Field IDs must be unique strings');ids.add(f.id);
    if(typeof f.text!=='string'||typeof f.source!=='string'||!['x','y','size','rotation'].every(k=>Number.isFinite(f[k])))throw Error(`Invalid field ${f.id}`);
    if(f.size<4||f.size>120||Math.abs(f.x)>1000||Math.abs(f.y)>1000)throw Error(`Field ${f.id} exceeds supported geometry`);
  }
  if(d.dateFormat!==undefined&&!['written','dmy-slash','dmy-dot','dmy-dash'].includes(d.dateFormat))throw Error('Invalid date format');
  if(d.aodFieldIds!==undefined&&(!Array.isArray(d.aodFieldIds)||d.aodFieldIds.length>(d.aodLayout?20:2)||new Set(d.aodFieldIds).size!==d.aodFieldIds.length||d.aodFieldIds.some(id=>!ids.has(id))))throw Error('Choose up to two distinct existing AOD fields');
  if(d.aodLayout){
    const l=d.aodLayout;if(l.version!==1||!['row-cycle-3','solid-shift-3'].includes(l.protection)||!Array.isArray(l.fields)||l.fields.length>20)throw Error('Custom AOD requires row-cycle-3 protection and at most 20 readings');
    if(new Set(l.fields.map(f=>f.id)).size!==l.fields.length||l.fields.some(f=>!ids.has(f.id)))throw Error('Invalid AOD field references');
    for(const f of [l.time,...l.fields])if(!f||!['x','y','size'].every(k=>Number.isFinite(f[k]))||f.x<0||f.x>454||f.y<0||f.y>454||f.size<12||f.size>80)throw Error('Invalid AOD geometry');
    for(const f of l.fields)if(!Number.isFinite(f.maxWidth)||f.maxWidth<20||f.maxWidth>400)throw Error('Invalid AOD text width');
  }
  if(d.refreshControl){const r=d.refreshControl;if(typeof r.enabled!=='boolean'||!['x','y','width','height','size'].every(k=>Number.isFinite(r[k]))||r.width<100||r.width>200||r.height<24||r.height>60||r.size<12||r.size>24||r.x<100||r.x>354||r.y<30||r.y>400)throw Error('Invalid refresh control');}
  const groupIds=new Set();
  for(const g of d.bubbleGroups||[]){
    if(groupIds.has(g.id))throw Error('Duplicate group ID');groupIds.add(g.id);
    if(!Array.isArray(g.members))throw Error('Invalid group members');
    for(const member of g.members)if(member.startsWith('field:')&&!ids.has(member.slice(6)))throw Error(`Dangling group member ${member}`);
  }
  function walk(v,k='design'){
    if(typeof v==='number'&&!Number.isFinite(v))throw Error(`Non-finite ${k}`);
    if(typeof v==='string'&&/(Color|^accent$|^bg$|^lume$|color$|handBorder$|handInlay$)/i.test(k.split('.').pop())&&!/^#[0-9a-f]{6}$/i.test(v))throw Error(`Invalid colour ${k}`);
    if(v&&typeof v==='object')for(const [key,child]of Object.entries(v))walk(child,k+'.'+key);
  }walk(d);
}
const previewKeys=new Set(['sleeping','sunAzimuth','moonAzimuth','moonPhase','moonAbove','compassHeading','calculatedMoonPhase','lunarDay','skyNoEvents','statusStates']);
function classify(key){
  if(key.startsWith('preview')||previewKeys.has(key))return ['preview-only','Used only for the explicitly simulated comparison; never a live sensor fallback.'];
  if(/Revision$|Applied$|Ready$|Version$/.test(key)||['version','device','screenDiameterMm'].includes(key))return ['metadata','Export/schema or device metadata.'];
  if(['grid','snap','quadrantSymmetry','symmetryMode','linkModes','palette','weatherSplit','fieldSize','handsColor','lunarDiameter'].includes(key))return ['editor','Editor operation/default or alias; resolved geometry and individual field settings are imported.'];
  if(['northNeedle','headingReadout','headingMode'].includes(key))return ['approximate','Experimental available-heading mode reads Activity.currentHeading while awake, requiring observed changes; hides direction markers when unavailable or unchanged for 15 seconds. Firmware may freeze this value. Hardware rotation test required. North-up mode retains the old diagram.'];
  if(['compassAod','iconGps','iconTrend'].includes(key))return ['unavailable','No compass in time-only AOD; GPS/trend have no live provider.'];
  if(['aodTimeOnly','aodSize','aodColor','aodPositions'].includes(key))return ['supported','Low-power mode uses a generated font and three positions on black, changing each minute. Optional aodFieldIds add two compact text readings; run the per-design AOD audit. Enable AOD on the watch; OS sleep settings still apply.'];
  if(['dateFormat','heartRateUnits'].includes(key))return ['supported','Explicit date formatting and optional heart-rate unit suffix in editor and live renderer.'];
  if(key==='refreshControl')return ['approximate','Touch and hold while awake rereads available Garmin data and recalculates sky; cannot activate compass hardware. NO HEADING indicates no qualified orientation.'];
  if(key==='aodLayout')return ['approximate','Independent AOD coordinates, sizes and width limits; no icons. Solid-shift-3 uses bold solid text and vertical offsets -80/0/+80 each minute; legacy row-cycle-3 clears every third row. Text over width is marked with ~. Requires per-design pixel budget audit.'];
  if(key==='aodFieldIds')return ['approximate','Up to two readings in a moving compact AOD layout: 18 px text, no icons, capped width with ~ truncation; values may be missing or cached. Time is capped at 48 px with data.'];
  if(key==='scaleStep')return ['supported','Sky scale label interval; 1, 2, 3 or 6 hours.'];
  if(['iconWifi','iconLte'].includes(key))return ['supported','DeviceSettings.connectionInfo when available. Unknown/missing connection types omitted, not simulated.'];
  if(['aodLume','secondRule','highPower','nightActivation','sleepSave','sleepStart','sleepEnd'].includes(key))return ['approximate','Night colours and sleep schedule supported; seconds run only in active callbacks. Time-only AOD uses aodColor when enabled; otherwise low-power is dark. Manual night mode is day on watch.'];
  if(['solarRing','autoSky','solarManual','latitude','longitude','utcOffset','sunMarker','moonMarker'].includes(key))return ['approximate','Astronomy uses saved coordinates and device-local time, not GPS. Thirty-minute brackets can miss very brief polar events. Available-heading mode counter-rotates markers and hides them when heading is unknown; firmware heading updates are not guaranteed. Otherwise markers are north-up.'];
  if(['bubbleGroups','fields'].includes(key))return ['approximate','Saved geometry, membership and visibility preserved. Group envelopes baked from editor preview bounds; live content does not reflow groups. Glyph layout uses embedded fonts with per-character positioning (no kerning/ligatures). See per-field audit.'];
  if(['statusLayout','positions','statusOrder','iconSizes','daysDisplay','markerSettings','markerOffsets'].includes(key))return ['approximate','Geometry and ordering imported; unknown live states omitted, explicit positions win. Auto arrangement uses available states. Preview marker values isolated.'];
  if(key==='wheelchair')return ['unavailable','Wheelchair data providers are not implemented; affected live fields show --.'];
  const supported='secondsStyle secondsShape secondsDiameter secondsSize solarPointer solarPointerDiameter solarPointerColor solarPointerShape solarPointerSize solarPointerDirection hourHandStyle minuteHandStyle handInlay contourOpacity format solarTop dawn sunrise sunset dusk golden iconBattery iconNotifications iconBluetooth iconAlarm iconDnd accent bg lume style contours compass ticks seconds panels hourLength minuteLength handWidth globalFont digitalSize statusSize headingSize iconCharging iconDays iconConnection iconTracking iconTones iconVibrate iconNight iconReadability iconGlances handStyle hourColor minuteColor handBorder handBorderWidth secondColor pivotColor pivotSize digitalGap sunriseColor sunsetColor dawnColor duskColor dayBandDiameter dayBandOpacity moonMatchDay moonOnTop moonOpacity dayBandColor dayBandWidth dayBandStyle dayBandMinutes dayBandGap lunarColor lunarRing lunarRadius lunarWidth scaleDiameter scaleColor tickDiameter tickColor tickWidth tickMajorWidth tickLength tickMajorLength tickCount scaleSize hourMarkerWidth hourMarkerDiameter hourMarkerLength hourMarkerColor'.split(' ');
  if(supported.includes(key))return ['supported','Imported into generated data/assets and rendered by handwritten runtime.'];
  return ['unmapped','Unrecognised option: preserved in source JSON, not implemented on watch.'];
}
function capabilities(d){
  const top=Object.keys(d).sort().map(key=>({path:key,status:classify(key)[0],detail:classify(key)[1]}));
  top.push({path:'studio2',status:'preview-only',detail:'Studio 2 solar ribbon, notification/sleep/health hold targets and mode visibility are implemented in the offline Studio. Native generation rejects enabled Studio 2 drafts until a matching runtime is implemented. Wallet has no documented public complication launch route and is unavailable. Existing approved designs continue to build.'});
  function nested(prefix,obj,allowed,detail){for(const key of Object.keys(obj||{}))top.push({path:prefix+'.'+key,status:allowed.includes(key)?'supported':'unmapped',detail});}
  nested('statusLayout',d.statusLayout,['arrangement','columns','gap','rowGap','x','y','values','inactive'],'Native status layout. Explicit saved positions take priority; unavailable live statuses omitted.');
  for(const [key,obj]of Object.entries(d.positions||{}))nested('positions.'+key,obj,['x','y'],'Saved absolute screen coordinates.');
  for(const [key,obj]of Object.entries(d.markerOffsets||{}))nested('markerOffsets.'+key,obj,['x','y'],'Offset from marker geometry.');
  for(const key of Object.keys(d.markerSettings||{}))top.push({path:'markerSettings.'+key,status:/Size$|Radius$/.test(key)?'supported':['battery','notifications','bluetooth','alarm','dnd','trend','days'].includes(key)?'preview-only':'unmapped',detail:'Marker geometry is imported. Sample sensor/status values are isolated to the preview profile.'});
  const groupKeys='id members padding color width polarLayout lengthPadding widthPadding symmetryLink symmetryQuadrant rowGap tableLayout tableColumns columnGap minBandWidth minArcSpan tableDividers tableFrame border readingDirection'.split(' ');
  for(const group of d.bubbleGroups||[]){nested('bubbleGroups.'+group.id,group,groupKeys,'Resolved by the original editor into mode-specific backgrounds. Borders=false also disables dividers, exactly as in the editor. Envelopes are fixed at import.');if(group.tableFrame)nested('bubbleGroups.'+group.id+'.tableFrame',group.tableFrame,'angle radius inner outer halfAngle rows columns rowHeight rowGap'.split(' '),'Resolved polar table geometry from export.');}
  const fieldKeys='id name source text x y rotation size font weight useAccent color visible night aod displayMode wrap wrapChars bubble bubbleColor bubbleWidth bubblePadding bubbleLengthPad bubbleWidthPad curved curveReverse iconChoice iconScale iconFollowRadius iconRotation iconGap tableRow tableColumn tableSpan eventPreview eventSchedule eventMode'.split(' ');
  for(const f of d.fields)for(const key of Object.keys(f))top.push({path:`fields.${f.id}.${key}`,status:!fieldKeys.includes(key)?'unmapped':key==='text'?'preview-only':key==='aod'?'approximate':['font','weight','bubble','wrap','eventMode'].includes(key)?'approximate':'supported',detail:key==='aod'?'The editor checkbox selects a compact AOD slot, saved in aodFieldIds. Up to two slots; normal field geometry/icons are not used in low power. aodFieldIds is authoritative when importing.':key==='text'?'Preview sample only; unsupported sources show -- on live watch.':key==='bubble'?'Curved bubbles supported; straight fields follow the editor panel behavior.':key==='eventMode'?'Live F1 and Springbok fixtures refresh hourly through Garmin Connect, with a persistent offline cache. Editor fixtures remain preview/fallback data.':key==='font'||key==='weight'?'Embedded font glyph atlas; no kerning, ligatures, or shaping. Missing glyph uses ?.':'Imported; table layout resolved by editor.'});
  const knownSources='Heart rate|Resting heart rate|Pulse Ox|Altitude|Weather + PoP|Weather condition|Temperature Hi/Lo + Current|Humidity|UV index|Feels-like temperature|Wind speed / direction|Steps + Daily goal|Distance + Step progress|UTC|Date|Rain probability|Steps|Step goal|Distance|Battery percentage|Battery days remaining|Notifications|Bluetooth state|Alarm state|DND state|Total calories|Floors climbed|Seconds'.split('|');
  for(const f of d.fields)top.push({path:`fields.${f.id}.source-provider`,status:knownSources.includes(f.source)?'supported':f.source.startsWith('Next ')?'cached':'unavailable',detail:f.source.startsWith('Next ')?'User-supplied schedule with expired events skipped; no network updates.':knownSources.includes(f.source)?'Garmin clock, device settings or cached sensor/weather source; missing/stale data shows --.':'No implemented live provider: --; preview text is not used on watch.'});
  return top;
}
async function generate({input=path.join(root,'design/approved-layout.json'),output=path.join(root,'generated'),time='10:08',mode='day'}={}){
  if([root,path.join(root,'source'),path.join(root,'resources'),path.join(root,'design')].includes(path.resolve(output)))throw Error('Output must be a dedicated generated/scratch directory, not a handwritten source directory.');
  const raw=fs.readFileSync(input),design=JSON.parse(raw);validate(design);
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!['day','night'].includes(mode))throw Error('Invalid comparison time/mode');
  const editorPath=path.join(root,'Watch-Face-Designer.html');
  if(!fs.existsSync(editorPath))throw Error('Watch-Face-Designer.html is missing. Ask the user for the original editor.');
  const conditions={year:design.previewYear||2026,day:design.previewDay||1,time,second:38,mode,resolution:454,utcOffset:design.utcOffset??0};
  const {chromium}=dependency('playwright');
  const executable=process.env.WATCH_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',chromium.executablePath()].find(fs.existsSync);
  if(!executable)throw Error('Install Chromium with npx playwright install chromium, or set WATCH_BROWSER.');
  const browser=await chromium.launch({executablePath:executable,headless:true});
  let result;
  try{
    const page=await browser.newPage({viewport:{width:1600,height:1100}});
    await page.route(/^https?:/,route=>route.abort());
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(editorPath).href);await page.evaluate(()=>document.fonts.ready);
    await page.addScriptTag({path:path.join(__dirname,'editor-bridge.js')});
    result=await page.evaluate(async args=>await window.nativeBridge(...args),[design,conditions]);
    if(errors.length)throw Error('Editor error: '+errors.join('; '));
  }finally{await browser.close();}
  const report=capabilities(design);
  const unknown=report.filter(x=>x.status==='unmapped');
  if(unknown.length)throw Error('Unmapped export options; update capabilities/renderer before import: '+unknown.map(x=>x.path).join(', '));
  const files={};
  files['preview/manifest.xml']=fs.readFileSync(path.join(root,'manifest.xml'),'utf8').replace('name="@Strings.AppName"','name="@Strings.PreviewAppName"');
  const cfg={...result.normalized};
  for(const key of Object.keys(cfg))if(key.startsWith('preview')||previewKeys.has(key)||['fields','bubbleGroups','positions','iconSizes','statusOrder','eventSchedule'].includes(key))delete cfg[key];
  cfg.markerSettings=Object.fromEntries(Object.entries(cfg.markerSettings).filter(([k])=>/Size$|Radius$/.test(k)));
  const fields=result.fields.map(f=>{const o={...f};delete o.text;delete o.eventPreview;delete o.eventSchedule;return o;});
  const events=[];for(const f of design.fields){for(const e of f.eventSchedule?.length?f.eventSchedule:f.eventPreview?[f.eventPreview]:[]){
    if(!e.date)continue;const epoch=Date.parse(e.date+'Z')/1000-Number(e.utcOffset??design.utcOffset)*3600;
    if(!Number.isFinite(epoch))throw Error(`Invalid event date for ${f.id}`);events.push([f.id,epoch,e.title||'',f.eventMode||'date']);
  }}
  const refs=(prefix,n)=>'['+Array.from({length:n},(_,i)=>`Rez.Drawables.${prefix}${i}`).join(',')+']';
  const header=`// GENERATED by tools/generate.cjs. Do not edit.\n// design SHA-256: ${sha(raw)}\n`;
  files['source/ApprovedLayout.mc']=header+'module ApprovedLayout {\n'+
    ` const sourceHash=${mc(sha(raw))};\n var config=Toybox.WatchUi.loadResource(Rez.JsonData.DesignConfig);\n var fields=[${fields.map((_,i)=>'Rez.JsonData.DesignField'+i).join(',')}];\n var events=${mc(events)};\n`+
    ` var positions=${mc(result.normalized.positions)};\n var iconSizes=${mc(result.normalized.iconSizes)};\n var statusKeys=${mc(result.statuses)};\n`+
    ` var fontIds=${mc(result.fontIds)};\n var glyphs=[${result.fonts.map((_,i)=>'Rez.JsonData.DesignGlyphs'+i).join(',')}];\n var hands=${mc(result.hands)};\n`+
    ` var icons=${refs('DesignIcon',result.icons.length)};\n var statusIcons=${refs('DesignStatus',result.statuses.length)};\n var fontImages=${refs('DesignFont',result.fonts.length)};\n var handImages=${refs('DesignHand',result.hands.length)};\n}\n`;
  const epoch=Date.UTC(conditions.year,0,conditions.day,...time.split(':').map(Number),38)/1000-conditions.utcOffset*3600;
  files['preview/RuntimeProfile.mc']=header+'// SIMULATED DATA. This directory is excluded from monkey.jungle.\nmodule RuntimeProfile {\n const preview=true;\n'+
    ` const epoch=${epoch};\n const hour=${Number(time.slice(0,2))};\n const minute=${Number(time.slice(3))};\n const second=38;\n const night=${mode==='night'};\n var aodFields=${mc(result.previewAodFields)};\n var fields=${mc(result.previewFields)};\n var marker=${mc(result.normalized.markerSettings)};\n var states=${mc(result.normalized.statusStates)};\n const heading=${result.normalized.compassHeading};\n}\n`;
  const drawables=[];
  const dataResources=[];
  function jsonResource(id,name,value){files['resources/'+name]=JSON.stringify(value)+'\n';dataResources.push(`  <jsonData id="${id}" filename="${name}" />`);}
  jsonResource('DesignConfig','config.json',cfg);
  fields.forEach((f,i)=>jsonResource('DesignField'+i,'field-'+i+'.json',f));
  result.fonts.forEach((f,i)=>jsonResource('DesignGlyphs'+i,'glyphs-'+i+'.json',Object.fromEntries(Object.entries(f.glyphs).map(([char,glyph])=>[char.codePointAt(0).toString(),glyph]))));
  files['resources/data.xml']='<resources>\n'+dataResources.join('\n')+'\n</resources>\n';
  for(const [name,base64]of Object.entries(result.assets)){
    if(name.startsWith('editor-')){files['comparison/'+name]=Buffer.from(base64,'base64');continue;}
    files['resources/'+name]=Buffer.from(base64,'base64');
    const id=name.startsWith('background')?(name.includes('day')?'DesignBackgroundDay':'DesignBackgroundNight'):
      name.replace(/^(icon|status|font|hand)-(\d+)\.png$/,(_,type,n)=>'Design'+type[0].toUpperCase()+type.slice(1)+n);
    drawables.push(`  <bitmap id="${id}" filename="${name}" packingFormat="png" automaticPalette="false" />`);
  }
  files['resources/drawables.xml']='<drawables>\n'+drawables.join('\n')+'\n</drawables>\n';
  files['capabilities.json']=JSON.stringify({designHash:sha(raw),options:report},null,2)+'\n';
  files['comparison/conditions.json']=JSON.stringify({label:'SIMULATED PREVIEW — not live watch data',...conditions,epoch,designHash:sha(raw),editorHash:sha(fs.readFileSync(editorPath))},null,2)+'\n';
  files['manifest.json']=JSON.stringify({generatorVersion:1,designHash:sha(raw),editorHash:sha(fs.readFileSync(editorPath)),files:Object.fromEntries(Object.entries(files).map(([k,v])=>[k,sha(v)]))},null,2)+'\n';
  // Validate everything before writing. Only the generated tree is managed.
  fs.mkdirSync(output,{recursive:true});
  const priorPath=path.join(output,'manifest.json'),prior=fs.existsSync(priorPath)?JSON.parse(fs.readFileSync(priorPath)):null;
  for(const [name,contents]of Object.entries(files)){const dest=path.join(output,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest+'.tmp',contents);fs.renameSync(dest+'.tmp',dest);}
  for(const stale of Object.keys(prior?.files||{}))if(!Object.hasOwn(files,stale)){
    const target=path.resolve(output,stale);if(!target.startsWith(path.resolve(output)+path.sep))throw Error('Unsafe stale path');fs.unlinkSync(target);
  }
  console.log(`Generated ${fields.length} fields from ${path.relative(root,input)} (${sha(raw).slice(0,12)}).`);
  console.log('Capabilities and comparison conditions written to '+path.relative(root,output)+'.');
  return {files,report,conditions};
}
module.exports={generate,validate,mc,sha};
if(require.main===module){const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){const k=args[i].replace(/^--/,'');if(!['input','output','time','mode'].includes(k)||!args[i+1])throw Error('Usage: node tools/generate.cjs [--input file] [--output dir] [--time HH:mm] [--mode day|night]');options[k]=['input','output'].includes(k)?path.resolve(args[i+1]):args[i+1];}generate(options).catch(e=>{console.error(e);process.exitCode=1;});}
