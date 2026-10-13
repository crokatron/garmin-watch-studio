/* Additive extension to the original offline editor. Embedded by extend-editor.cjs. */
(() => {
  const defaults={aodTimeOnly:false,aodSize:54,aodColor:'#56856a',aodPositions:[[227,151],[227,227],[227,303]],headingMode:'northUp',scaleStep:1,dateFormat:'written',heartRateUnits:true,aodFieldIds:[]};
  const originalInitial=initial;
  initial=function(){return {...defaults,...originalInitial()};};
  Object.assign(d,{...defaults,...d});
  const panel=document.querySelector('[data-panel="Time"]');
  const section=document.createElement('section');
  section.innerHTML='<h2>Native watch readability</h2><label>Enable always-on layout<input id="nativeAod" type="checkbox"></label><label>AOD time size<input id="nativeAodSize" type="number" min="36" max="64"></label><label>AOD colour<input id="nativeAodColor" type="color"></label><label>Heading on watch<select id="nativeHeading"><option value="northUp">North-up sky diagram</option><option value="available">Available heading — experimental</option></select></label><p class="notice">AOD moves every minute. Add up to two compact data readings below the time; their normal field positions and styling remain unchanged. Enable Always On in the watch settings. Experimental heading reads Garmin data while awake; firmware may leave it unavailable or frozen. The editor heading is simulated.</p>';
  panel.append(section);
  const refreshPanel=document.createElement('section');refreshPanel.innerHTML='<h2>Watch refresh button</h2><label>Show hold-to-refresh<input id="refreshEnabled" type="checkbox"></label><label>X<input id="refreshX" type="number" min="100" max="354"></label><label>Y<input id="refreshY" type="number" min="30" max="400"></label><p class="notice">Touch and hold while awake. Rereads available Garmin data and recalculates sky positions. It cannot turn on the compass sensor; NO HEADING means orientation is unavailable. The studio uses simulated readings.</p>';panel.append(refreshPanel);
  for(const [id,key] of [['refreshEnabled','enabled'],['refreshX','x'],['refreshY','y']])$(id).onchange=()=>{checkpoint();d.refreshControl={enabled:false,x:227,y:385,width:164,height:34,size:18,...d.refreshControl};d.refreshControl[key]=key==='enabled'?$(id).checked:Math.max(Number($(id).min),Math.min(Number($(id).max),Number($(id).value)));persist();render();};
  const scaleLabel=document.createElement('label');scaleLabel.innerHTML='Sky scale labels<select id="nativeScaleStep"><option value="1">Every hour</option><option value="2">Every 2 hours</option><option value="3">Every 3 hours</option><option value="6">Every 6 hours</option></select>';section.append(scaleLabel);
  function optionsUI(){ $('nativeAodSize').closest('label').hidden=!!d.aodLayout; $('nativeAod').checked=!!d.aodTimeOnly;$('nativeAodSize').value=d.aodSize??54;$('nativeAodColor').value=d.aodColor||'#56856a';$('nativeHeading').value=d.headingMode||'northUp';$('nativeScaleStep').value=d.scaleStep||1; }
  $('nativeScaleStep').onchange=()=>{checkpoint();d.scaleStep=Number($('nativeScaleStep').value);persist();render();};
  for(const [id,key,kind] of [['nativeAod','aodTimeOnly','bool'],['nativeAodSize','aodSize','number'],['nativeAodColor','aodColor','text'],['nativeHeading','headingMode','text']]){
    $(id).onchange=()=>{checkpoint();d[key]=kind==='bool'?$(id).checked:kind==='number'?Math.max(36,Math.min(64,Number($(id).value)||54)):$(id).value;persist();render();};
  }
  const colours=document.createElement('section');
  colours.innerHTML='<h2>Day / night / always-on</h2><label>Day text colour<input id="readDay" type="color"></label><label>Night lume text colour<input id="readNight" type="color"></label><label>Always-on text colour<input id="readAod" type="color"></label><p class="notice">These apply to time and fields using the global colour. Ring colours are set separately in Sky. Editing these colours unlinks day and night.</p><div class="row"><button id="showDay">Preview day</button><button id="showNight">Preview night</button><button id="showAod">Preview AOD</button></div><label>Date format<select id="readDate"><option value="written">MON 21 SEP</option><option value="dmy-slash">21/09/2026</option><option value="dmy-dot">21.09.2026</option><option value="dmy-dash">21-09-2026</option></select></label><label>Show heart-rate bpm<input id="readBpm" type="checkbox"></label><h3>Always-on data</h3><p class="notice">Choose up to two. Compact text, no icons; long values are shortened. Values update at most once a minute and can be unavailable.</p><label>Reading 1<select id="readAodOne"></select></label><label>Reading 2<select id="readAodTwo"></select></label>';
  document.querySelector('[data-panel="Design"]').prepend(colours);
  const originalEffectiveMode=effectiveMode;
  let palettePreview=false;
  effectiveMode=function(){return palettePreview?mode:originalEffectiveMode();};
  for(const [id,m] of [['showDay','day'],['showNight','night'],['showAod','aod']])$(id).onclick=()=>{palettePreview=true;mode=m;render();};
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{palettePreview=true;mode=button.dataset.mode;render();}));
  for(const [id,key] of [['readDay','accent'],['readNight','lume'],['readAod','aodColor']])$(id).oninput=()=>{checkpoint();d[key]=$(id).value;d.linkModes=false;persist();sync();};
  $('readDate').onchange=()=>{checkpoint();d.dateFormat=$('readDate').value;persist();render();};
  $('readBpm').onchange=()=>{checkpoint();d.heartRateUnits=$('readBpm').checked;persist();render();};
  const centre=document.createElement('div');centre.innerHTML='<h3>Snap selected data field</h3><div class="row"><button id="centreX">Centre horizontally</button><button id="centreY">Centre vertically</button><button id="centreBoth">Centre on face</button></div><p class="notice">Moves the selected field anchor to X=227 and/or Y=227. Groups and symmetry may also move linked fields.</p>';
  $('editor').append(centre);
  for(const [id,axes] of [['centreX',['x']],['centreY',['y']],['centreBoth',['x','y']]])$(id).onclick=()=>{checkpoint();for(const f of editableSelection())for(const axis of axes)f[axis]=227;persist();sync();};
  const originalVisual=fieldVisual;
  fieldVisual=function(f){const result=originalVisual(f);
    if(f.source==='Heart rate'&&d.heartRateUnits===false)result.text=result.text.replace(/\s*bpm\b/gi,'');
    if(f.source==='Date'&&d.dateFormat&&d.dateFormat!=='written'){const date=previewDate(),sep={'dmy-slash':'/','dmy-dot':'.','dmy-dash':'-'}[d.dateFormat]||'/';result.text=[String(date.getUTCDate()).padStart(2,'0'),String(date.getUTCMonth()+1).padStart(2,'0'),date.getUTCFullYear()].join(sep);}
    return result;
  };
  function readabilityUI(){
    for(const [id,key] of [['readDay','accent'],['readNight','lume'],['readAod','aodColor']])$(id).value=d[key]||defaults.aodColor;
    if(selected)$('aod').checked=(d.aodFieldIds||[]).includes(selected);
    $('readDate').value=d.dateFormat||'written';$('readBpm').checked=d.heartRateUnits!==false;
    for(const [index,id] of ['readAodOne','readAodTwo'].entries()){const select=$(id);select.replaceChildren(new Option('None',''),...d.fields.map(f=>new Option(f.name,f.id)));select.value=(d.aodFieldIds||[])[index]||'';}
  }
  function aodValue(f){let text=fieldVisual({...f,displayMode:'value',wrap:false}).text;if(f.source==='Humidity')text='HUM '+text;if(f.source==='Feels-like temperature')text=text.replace(/^FEELS\s*/i,'');return text;}
  // AOD has independent geometry: normal day/night fields are never moved here.
  const aodTab=document.createElement('button');aodTab.type='button';aodTab.dataset.tab='AOD';aodTab.textContent='AOD';document.querySelector('.settings-tabs').append(aodTab);
  const aodPanel=document.createElement('div');aodPanel.className='settings-panel';aodPanel.dataset.panel='AOD';aodPanel.hidden=true;
  aodPanel.innerHTML='<section><h2>Always-on layout</h2><p class="notice">Drag the time or a reading directly on the face. Positions below belong only to AOD. Add any available data source, then remove it with its Remove button.</p><button id="editAod">Show / edit AOD</button><label>Add reading<select id="aodAddSource"></select></label><button id="aodAdd">Add reading</button><div id="aodLayoutRows"></div><p class="notice">Solid AOD moves the whole layout between three vertical positions each minute. Legacy striped designs retain row cycling. Layout changes require a fresh pixel-budget audit before installation. Preview values are simulated.</p></section>';
  document.querySelector('aside').append(aodPanel);
  aodTab.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===aodTab));document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p!==aodPanel);palettePreview=true;mode='aod';d.aodTimeOnly=true;render();};
  $('editAod').onclick=()=>{palettePreview=true;mode='aod';render();};
  $('showAod').onclick=()=>aodTab.click();
  // Retire the duplicate two-slot controls in favour of this explicit editor.
  for(const id of ['readAodOne','readAodTwo'])$(id).closest('label').hidden=true;
  const oldNote=$('readAodOne').closest('section').querySelector('h3');oldNote.nextElementSibling.textContent='Use the AOD tab to add, remove, drag and resize readings independently.';
  section.querySelector('p').textContent='Use the AOD tab to edit its separate layout. Enable Always On on the watch. Experimental heading can be unavailable or frozen; editor heading is simulated.';
  let aodSelected='time',aodDragging=null;
  function ensureAodLayout(){
    if(!d.aodLayout)d.aodLayout={version:1,time:{x:227,y:215,size:Math.min(48,d.aodSize||54)},fields:(d.aodFieldIds||[]).map((id,i)=>({id,x:147+i*160,y:252,size:18}))};
    d.aodLayout.protection=d.aodLayout.protection||'solid-shift-3';for(const item of d.aodLayout.fields)if(!item.maxWidth)item.maxWidth=148;
    d.aodLayout.fields=d.aodLayout.fields.filter(item=>d.fields.some(f=>f.id===item.id));return d.aodLayout;
  }
  function saveAod(){d.aodFieldIds=ensureAodLayout().fields.map(item=>item.id);for(const f of d.fields)f.aod=d.aodFieldIds.includes(f.id);d.aodTimeOnly=true;persist();render();}
  function aodItem(id){const layout=ensureAodLayout();return id==='time'?layout.time:layout.fields.find(item=>item.id===id);}
  $('aodAdd').onclick=()=>{
    const source=$('aodAddSource').value;if(!source)return;checkpoint();const layout=ensureAodLayout();let f=d.fields.find(f=>f.source===source&&!layout.fields.some(item=>item.id===f.id));
    if(!f){f={...structuredClone(d.fields[0]),id:crypto.randomUUID(),name:source,source,text:sources[source]||'--',visible:false,night:true,aod:true,x:227,y:227,rotation:0,curved:false,wrap:false,displayMode:'icon'};d.fields.push(f);}
    layout.fields.push({id:f.id,x:227,y:Math.min(390,285+layout.fields.length*26),size:20});aodSelected=f.id;saveAod();
  };
  $('aod').oninput=()=>{checkpoint();const layout=ensureAodLayout();for(const f of editableSelection()){const has=layout.fields.some(item=>item.id===f.id);if($('aod').checked&&!has)layout.fields.push({id:f.id,x:227,y:310,size:20});if(!$('aod').checked)layout.fields=layout.fields.filter(item=>item.id!==f.id);}saveAod();};
  function aodUI(){
    const layout=ensureAodLayout(),select=$('aodAddSource'),previous=select.value;select.replaceChildren(...Object.keys(sources).map(source=>new Option(source,source)));if(previous)select.value=previous;
    const rows=$('aodLayoutRows');rows.replaceChildren();
    for(const item of [{...layout.time,id:'time'},...layout.fields]){
      const row=document.createElement('section');row.style.border=item.id===aodSelected?'1px solid #80ffc2':'';
      const title=document.createElement('button');title.textContent=item.id==='time'?'Time':d.fields.find(f=>f.id===item.id).name;title.onclick=()=>{aodSelected=item.id;render();};row.append(title);
      for(const [key,min,max] of [['x',0,454],['y',0,454],['size',12,item.id==='time'?80:48]]){const label=document.createElement('label');label.textContent=key==='size'?'Text size':key.toUpperCase();const input=document.createElement('input');input.type='number';input.min=min;input.max=max;input.value=item[key];input.dataset.aodId=item.id;input.dataset.aodKey=key;input.onchange=()=>{checkpoint();aodItem(item.id)[key]=Math.max(min,Math.min(max,Number(input.value)||min));saveAod();};label.append(input);row.append(label);}
      const centre=document.createElement('button');centre.textContent='Centre horizontally';centre.onclick=()=>{checkpoint();aodItem(item.id).x=227;saveAod();};row.append(centre);
      if(item.id!=='time'){const remove=document.createElement('button');remove.textContent='Remove';remove.dataset.aodRemove=item.id;remove.onclick=()=>{checkpoint();layout.fields=layout.fields.filter(f=>f.id!==item.id);saveAod();};row.append(remove);}rows.append(row);
    }
  }
  function aodPoint(event){const matrix=$('face').getScreenCTM();return new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());}
  $('face').addEventListener('pointerdown',event=>{if(mode!=='aod'||!event.target.dataset.aodItem)return;event.preventDefault();event.stopImmediatePropagation();const id=event.target.dataset.aodItem,p=aodPoint(event),item=aodItem(id);checkpoint();aodSelected=id;aodDragging={id,x:p.x,y:p.y,startX:item.x,startY:item.y};$('face').setPointerCapture(event.pointerId);render();},true);
  $('face').addEventListener('pointermove',event=>{if(!aodDragging)return;event.preventDefault();event.stopImmediatePropagation();const p=aodPoint(event),item=aodItem(aodDragging.id);item.x=Math.round(Math.max(0,Math.min(454,aodDragging.startX+p.x-aodDragging.x)));item.y=Math.round(Math.max(0,Math.min(454,aodDragging.startY+p.y-aodDragging.y)));if(d.snap&&Math.abs(item.x-227)<8)item.x=227;render();},true);
  $('face').addEventListener('pointerup',event=>{if(!aodDragging)return;event.stopImmediatePropagation();aodDragging=null;persist();},true);
  $('face').addEventListener('pointercancel',()=>{aodDragging=null;});
  function drawAodStudio(clean){
    const layout=ensureAodLayout(),face=$('face');face.replaceChildren();face.style.transform='none';face.style.opacity='1';el('circle',{cx:227,cy:227,r:227,fill:'#000'});
    const total=Math.floor(previewHour()*60),hour=Math.floor(total/60)%24,minute=total%60,h=d.format==='12'?(hour%12||12):hour;
    const text=String(h).padStart(2,'0')+':'+String(minute).padStart(2,'0')+(d.format==='12'?(hour<12?'a':'p'):'');
    const items=[{...layout.time,id:'time',text},...layout.fields.map(item=>({...item,text:aodValue(d.fields.find(f=>f.id===item.id))}))];
    for(const item of items){const node=el('text',{x:item.x,y:item.y+(clean&&layout.protection==='solid-shift-3'?(minute%3-1)*80:0),fill:d.aodColor||defaults.aodColor,'font-family':d.globalFont,'font-size':item.size,'font-weight':layout.protection==='solid-shift-3'?700:500,'dominant-baseline':'central','text-anchor':'middle','data-aod-item':item.id,style:'cursor:move;touch-action:none;user-select:none'},item.text);
      if(item.maxWidth){let value=item.text;while(node.getComputedTextLength()>item.maxWidth&&value.length){value=value.slice(0,-1);node.textContent=value+'~';}}
      if(!clean&&item.id===aodSelected){const b=node.getBBox();el('rect',{x:b.x-5,y:b.y-5,width:b.width+10,height:b.height+10,fill:'none',stroke:'#80ffc2','stroke-dasharray':'3 3','pointer-events':'none'});}}
    if(layout.protection==='row-cycle-3')for(let y=minute%3;y<454;y+=3)el('rect',{x:0,y,width:454,height:1,fill:'#000','pointer-events':'none'});
    $('secondsPreviewNote').textContent='SIMULATED AOD · drag edits base positions · clean preview includes minute movement';
  }
  const originalRender=render;
  render=function(clean=false){
    optionsUI();readabilityUI();if(d.aodLayout||mode==='aod')aodUI();
    $('refreshEnabled').checked=!!d.refreshControl?.enabled;$('refreshX').value=d.refreshControl?.x??227;$('refreshY').value=d.refreshControl?.y??385;
    if(mode==='aod'&&d.aodTimeOnly){drawAodStudio(clean);return;}
    originalRender(clean);
    if(d.refreshControl?.enabled){const r=d.refreshControl,c=effectiveMode()==='night'?d.lume:d.accent;const g=el('g',{'data-feature':'refreshControl'});el('rect',{x:r.x-r.width/2,y:r.y-r.height/2,width:r.width,height:r.height,rx:6,fill:'none',stroke:c},null,g);el('text',{x:r.x,y:r.y,fill:c,'font-family':d.globalFont,'font-size':r.size,'font-weight':700,'dominant-baseline':'central','text-anchor':'middle'},'HOLD REFRESH',g);}

    for(const text of $('face').querySelectorAll('[data-feature="scale24"]'))if(Number(text.textContent)%(d.scaleStep||1)!==0)text.remove();
  };
  // Explicit review links carry a draft inside the URL; no server or file fetch is needed.
  // Loading does not save over the user's browser draft until they make an edit.
  const encoded=new URLSearchParams(location.hash.slice(1)).get('review');
  if(encoded){try{
    const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),candidate=JSON.parse(new TextDecoder().decode(bytes));
    if(candidate.version!==1||candidate.device!=='fenix9pro47mm'||!Array.isArray(candidate.fields))throw Error('Invalid review design');
    d={...initial(),...candidate};ensurePreview();symmetrySignatures.clear();rememberSymmetry();selected=null;featureSelected=null;multiSelected.clear();
    $('live').checked=false;$('time').value='10:08';mode='day';sync();
    $('status').textContent='READABILITY DRAFT — review before installation. Preview readings are simulated.';
  }catch(error){$('status').textContent='Could not load review draft: '+error.message;}}
  render();
})();
