/* Injected only into a fresh local browser by generate.cjs. The editor is unmodified. */
window.nativeBridge = async function (input, conditions) {
  $('live').checked = false;
  // Import via the editor's own defaults and normalisation, without its startup "now" action.
  d = {...initial(), ...structuredClone(input)};
  ensurePreview();
  d.previewYear = conditions.year;
  d.previewDay = conditions.day;
  $('time').value = conditions.time;
  selected = null; featureSelected = null; editMode = false; multiSelected.clear();
  symmetrySignatures.clear(); rememberSymmetry();
  await document.fonts.ready;
  mode = conditions.mode;
  render(true);
  const normalized = structuredClone(d);
  const root = $('face');
  const assets = {};
  async function raster(node, width, height, viewBox) {
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('xmlns', ns);
    svg.setAttribute('width', width); svg.setAttribute('height', height);
    svg.setAttribute('viewBox', viewBox || `0 0 ${width} ${height}`);
    const style = document.createElementNS(ns, 'style'); style.textContent = embeddedFontCss; svg.append(style);
    for (const child of node.childNodes) svg.append(child.cloneNode(true));
    const img = new Image();
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], {type:'image/svg+xml'}));
    try {
      await new Promise((resolve,reject) => { img.onload=resolve; img.onerror=reject; img.src=url; });
      const canvas=document.createElement('canvas'); canvas.width=width;canvas.height=height;
      canvas.getContext('2d').drawImage(img,0,0);
      return canvas.toDataURL('image/png').split(',')[1];
    } finally { URL.revokeObjectURL(url); }
  }
  assets['editor-preview.png'] = await raster(root,454,454);
  const previewFields = {},previewAodFields={};
  for (const f of d.fields) {
    previewAodFields[f.id]=fieldVisual({...f,displayMode:"value",wrap:false}).text;
    const node = [...root.querySelectorAll('[data-id]')].find(n=>n.dataset.id===f.id);
    previewFields[f.id] = node ? [...node.children].filter(n=>n.tagName==='text').map(n=>n.textContent).join('\n') : fieldVisual(f).text;
  }
  const fields = d.fields.map(f=>({...f, iconKind:fieldVisual(f).icon,
    iconOffset:fieldVisual(f).icon ? iconTextOffset(f,fieldVisual(f).icon):0,
    grouped:inBubbleGroup('field:'+f.id)}));
  const activation=d.nightActivation;
  d.nightActivation='manual';
  for(const m of ['night','aod']){mode=m;render(true);assets[`editor-${m}.png`]=await raster(root,454,454);}
  d.nightActivation=activation;mode=conditions.mode;render(true);
  // Backgrounds are rendered by the original editor. Dynamic layers are removed.
  for (const m of ['day','night']) {
    mode=m; const activation=d.nightActivation;d.nightActivation=m==='day'?'never':'always';render(true);d.nightActivation=activation;
    const clone=root.cloneNode(true);
    // Identify the sky container before removing its labelled descendants; leave group divider containers.
    for(const n of [...clone.children])if(n.tagName==='g'&&n.getAttribute('pointer-events')==='none'&&n.querySelector('[data-move],[data-feature]'))n.remove();
    clone.querySelectorAll('[data-id],[data-move]').forEach(n=>n.remove());
    clone.querySelectorAll('[data-feature]').forEach(n=>{
      if(!['minuteMarkers','hourMarkers','compassScale'].includes(n.dataset.feature))n.remove();
    });
    // renderFeatures creates the dynamic sky/status/marker container without a data attribute.
    assets[`background-${m}.png`]=await raster(clone,454,454);
  }
  d=structuredClone(normalized);mode=conditions.mode;
  const icons=[];
  for(const f of fields){
    if(!f.iconKind){f.iconIndex=-1;continue;}
    let index=icons.indexOf(f.iconKind);
    if(index<0){index=icons.length;icons.push(f.iconKind);const g=el('g');drawDataIcon(f.iconKind,g,32,32,40,'#ffffff');
      assets[`icon-${index}.png`]=await raster(g,64,64);g.remove();}
    f.iconIndex=index;
  }
  // Status artwork is static; battery fill, battery days and values are added using real data.
  const statuses=[];
  d.markerSettings.battery=0;d.daysDisplay='inside';
  for (const key of d.statusOrder.filter(k=>d[k])) {
    const g=el('g');drawStatusGlyph(key,g,32,32,40,'#ffffff');
    if(key==='iconDays')g.querySelectorAll('text').forEach(n=>n.remove());
    assets[`status-${statuses.length}.png`]=await raster(g,64,64);g.remove();statuses.push(key);
  }
  d=structuredClone(normalized);
  // Extract all hand styles from the real SVG paths at zero rotation.
  $('time').value='00:00';const savedStyle=d.style;d.style='analog';root.replaceChildren();renderTime(d.accent);
  const hands=[];
  for(const node of root.querySelectorAll('[data-feature="analogTime"]')){
    if(node.tagName==='circle')continue;
    const box=node.getBBox(),pad=3,x=Math.floor(box.x-pad),y=Math.floor(box.y-pad),w=Math.ceil(box.width+pad*2),h=Math.ceil(box.height+pad*2);
    const group=el('g');const clone=node.cloneNode(true);clone.removeAttribute('transform');group.append(clone);
    // Refined hands use local coordinates; basic hands use absolute dial coordinates.
    const local=node.tagName==='g';
    assets[`hand-${hands.length}.png`]=await raster(group,w,h,`${x} ${y} ${w} ${h}`);
    hands.push({x:local?x:x-227,y:local?y:y-227,width:w,height:h});group.remove();
  }
  d.style=savedStyle;
  // Glyph atlases use the editor's embedded fonts at their requested sizes and weights.
  // Per-glyph affine drawing permits straight, rotated and curved text on the watch.
  const fonts=[];
  function register(family,size,weight,chars){
    let i=fonts.findIndex(f=>f.family===family&&f.size===size&&f.weight===String(weight));
    if(i<0){i=fonts.length;fonts.push({family,size,weight:String(weight),chars:new Set()});}
    for(const c of chars)fonts[i].chars.add(c);return i;
  }
  const alphabet=Array.from({length:95},(_,i)=>String.fromCharCode(i+32)).join('')+'°₂—–·';
  for(const f of fields)f.fontIndex=register(f.font,f.size,f.weight,alphabet+f.text+f.name+previewFields[f.id]);
  const fontIds={digital:register(d.globalFont,d.digitalSize,700,'0123456789'),small:register(d.globalFont,12,700,alphabet),
    scale:register('monospace',d.scaleSize,400,'0123456789'),heading:register(d.globalFont,d.headingSize,400,alphabet),
    status:register(d.globalFont,Math.round(d.statusSize*.72),400,alphabet),battery:register(d.globalFont,8,700,alphabet),
    aod:register(d.globalFont,d.aodLayout?d.aodLayout.time.size:(d.aodFieldIds||[]).length?Math.min(48,d.aodSize||54):d.aodSize||54,d.aodLayout?.protection==='solid-shift-3'?700:500,'0123456789:ap'),aodData:register(d.globalFont,18,500,alphabet)};
  if(d.refreshControl)fontIds.refresh=register(d.globalFont,d.refreshControl.size,700,alphabet);
  if(d.aodLayout)for(const [i,f] of d.aodLayout.fields.entries())fontIds['aodField'+i]=register(d.globalFont,f.size,d.aodLayout.protection==='solid-shift-3'?700:500,alphabet);
  for(let index=0;index<fonts.length;index++){
    const f=fonts[index],chars=[...f.chars].filter(c=>c!=='\n'&&c!=='\r');
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=2048;
    const ctx=canvas.getContext('2d');ctx.font=`${f.weight} ${f.size}px "${f.family}"`;ctx.fillStyle='white';ctx.textBaseline='alphabetic';
    // SVG dominant-baseline:central places the em box midpoint on the baseline.
    const probe=el('text',{'font-family':f.family,'font-size':f.size,'font-weight':f.weight,'dominant-baseline':'central'},'H');
    const central=probe.getBBox().y;
    probe.setAttribute('dominant-baseline','alphabetic');
    const baseline=central-probe.getBBox().y;probe.remove();
    let x=0,y=0,row=0;const glyphs={};
    for(const char of chars){
      const metrics=ctx.measureText(char),left=Math.floor(-metrics.actualBoundingBoxLeft)-2,top=Math.floor(-metrics.actualBoundingBoxAscent+baseline)-2;
      const w=Math.max(1,Math.ceil(metrics.actualBoundingBoxRight)-left+2),h=Math.max(1,Math.ceil(metrics.actualBoundingBoxDescent+baseline)-top+2);
      if(x+w>512){x=0;y+=row;row=0;}if(y+h>2048)throw Error('Font atlas exceeds supported size');
      ctx.fillText(char,x-left,y-top+baseline);
      glyphs[char]=[x,y,w,h,left,top,metrics.width];x+=w;row=Math.max(row,h);
    }
    const trimmed=document.createElement('canvas');trimmed.width=512;trimmed.height=y+row;trimmed.getContext('2d').drawImage(canvas,0,0);
    assets[`font-${index}.png`]=trimmed.toDataURL('image/png').split(',')[1];f.glyphs=glyphs;delete f.chars;
  }
  return {normalized,fields,statuses,hands,fonts,fontIds,icons,previewFields,previewAodFields,assets};
};
