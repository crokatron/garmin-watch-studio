/* Adapter around the preserved editor. No network calls or watch launches. */
window.installStudio2 = function(ui) {
  const M=Studio2Model, face=$('face');
  let focus=null, testing=false, gesture=null, timer=null, targets=false;
  const state=()=>d.studio2;
  const visible=c=>!!c.visibility[effectiveMode()];
  const active=()=>state()?.enabled;
  const originalSportText=sportText,originalChosenSportEvent=chosenSportEvent;
  sportText=field=>active()?StudioEvents.text(field,sportNow(),d.utcOffset):originalSportText(field);
  chosenSportEvent=field=>active()?StudioEvents.next(field,sportNow(),d.utcOffset):originalChosenSportEvent(field);
  const node=(tag,attrs,text,parent)=>el(tag,attrs,text,parent);
  const choose=id=>{focus=id;selected=null;featureSelected=null;multiSelected.clear();ui.open();render();};
  const color=c=>effectiveMode()==='aod'?d.aodColor:effectiveMode()==='night'?d.lume:c.useAccent?d.accent:c.color;
  function icon(name,g,x,y,size,c) {
    const paths={bell:'M-7 4 L-5 1 V-3 A5 5 0 0 1 5-3 V1 L7 4 Z M-2 7 Q0 10 2 7 M0-10 V-8',moon:'M5-8 A9 9 0 1 0 8 5 A8 8 0 0 1 5-8 Z',heart:'M0 8 C-18-3 -6-14 0-5 C6-14 18-3 0 8',battery:'M-8-5 H6 V5 H-8 Z M9-2 V2 M-5-2 H2 V2 H-5 Z',activity:'M-10 0 H-5 L-2-7 L2 7 L5 0 H10',clock:'M0-9 A9 9 0 1 0 .01-9 M0-5 V0 L4 3',refresh:'M7-4 A8 8 0 1 0 8 3 M7-10 V-3 H0',sun:'M0-5 A5 5 0 1 0 .01-5 M0-10 V-8 M0 8 V10 M-10 0 H-8 M8 0 H10',wallet:'M-9-6 H8 V7 H-9 Z M3-1 H10 V4 H3 Z'};
    if(name==='none')return;
    node('path',{d:paths[name]||paths.activity,transform:`translate(${x} ${y}) scale(${size/22})`,stroke:c,'stroke-width':1.7,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},undefined,g);
  }
  function target(c,parent,show) {
    const g=M.geometry(c),attrs={'data-hold-target':c.id,fill:show?'#80d9ff22':'transparent',stroke:show?'#80d9ff':'none','stroke-width':1,'stroke-dasharray':'4 3','pointer-events':'none'};
    if(g.shape==='ellipse')node('ellipse',{...attrs,cx:0,cy:0,rx:g.width/2,ry:g.height/2},undefined,parent);
    else node('rect',{...attrs,x:-g.width/2,y:-g.height/2,width:g.width,height:g.height},undefined,parent);
  }
  function drawControl(c,clean) {
    const geom=M.geometry(c),g=node('g',{'data-interactive':c.id,transform:`translate(${c.x} ${c.y}) rotate(${geom.angle})`,tabindex:clean?-1:0,role:'button','aria-label':c.label+' · hold to preview',style:'cursor:pointer'},undefined,face),ink=color(c);
    if(c.source==='wallet'){
      g.setAttribute('aria-label','Wallet unavailable · select for details');g.setAttribute('data-launch-disabled','true');
      node('title',{},'Wallet unavailable: select to see why. No Garmin Wallet launcher.',g);
      node('rect',{x:-c.width/2,y:-c.height/2,width:c.width,height:c.height,rx:7,fill:'#151a17',stroke:'#718177','stroke-width':1,'stroke-dasharray':'3 2'},undefined,g);
      icon('wallet',g,-c.width/2+14,0,c.size,'#9ca99f');
      node('line',{x1:-c.width/2+5,y1:7,x2:-c.width/2+22,y2:-7,stroke:'#9ca99f','stroke-width':1.3},undefined,g);
      node('text',{x:9,y:0,fill:'#a7b4ab','font-family':'InstrumentSans, sans-serif','font-size':Math.min(c.size,14),'dominant-baseline':'central','text-anchor':'middle'},'Wallet',g);
      if(!clean)target(c,g,focus===c.id||targets);
      g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();testing?launch(c):choose(c.id);}});
      return;
    }
    if(c.style!=='plain')node('rect',{x:-c.width/2,y:-c.height/2,width:c.width,height:c.height,rx:c.height/2,fill:c.style==='pill'?'#15271f':'none',stroke:ink,'stroke-width':.8},undefined,g);
    const value=c.available===false?'—':c.value,hasIcon=['icon','iconValue'].includes(c.display),name=c.icon==='auto'?M.sources[c.source].icon:c.icon;
    if(hasIcon)icon(name,g,c.display==='icon'?0:-c.width/2+c.size/2+2,0,c.size,ink);
    if(c.display!=='icon'){
      const text=c.display==='labelValue'?`${c.label} ${value}`:value;
      const n=node('text',{x:c.display==='iconValue'?c.size/2+3:0,y:0,fill:ink,'font-family':'InstrumentSans, sans-serif','font-size':c.size,'font-weight':600,'dominant-baseline':'central','text-anchor':'middle'},text,g);
      const max=c.display==='iconValue'?Math.max(16,c.width-c.size-7):c.width-4;
      if(n.getComputedTextLength()>max){n.setAttribute('textLength',max);n.setAttribute('lengthAdjust','spacingAndGlyphs');}
    }
    if(!clean)target(c,g,focus===c.id||targets);
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();testing?launch(c):choose(c.id);}});
  }
  function drawRibbon(clean) {
    const r=state().ribbon;if(!visible(r))return;
    const data=M.solar(d,previewHour()),g=node('g',{'data-interactive':'ribbon',role:'button',tabindex:clean?-1:0,'aria-label':'Solar ribbon'},undefined,face);
    if(!data.valid){node('path',{d:M.arc(r),fill:'none',stroke:'#66706c','stroke-width':r.width,'stroke-dasharray':'2 5','data-solar-unavailable':'true'},undefined,g);}
    else {
      const opacity=data.active?1:r.nightOpacity;
      for(const seg of data.segments)if(seg.to>seg.from)node('path',{d:M.arc(r,seg.from,seg.to),fill:'none',stroke:r[seg.color],opacity,'stroke-width':r.width,'stroke-linecap':'round','stroke-dasharray':r.style==='dotted'?'1 6':'none','data-solar-segment':seg.color},undefined,g);
      if(r.endpoints)for(const [key,t]of [['sunrise',data.rise],['sunset',data.set]]){
        const angle=r.center+r.span/2-t*r.span,a=M.polar(r.cx,r.cy,r.radius-4,angle),b=M.polar(r.cx,r.cy,r.radius+4,angle);
        node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:r.goldenColor,'stroke-width':1.5,opacity,'data-solar-endpoint':key},undefined,g);
      }
      if(data.active){const p=M.polar(r.cx,r.cy,r.radius,r.center+r.span/2-data.position*r.span);node('circle',{cx:p.x,cy:p.y,r:r.markerSize,fill:r.markerColor,stroke:'#07110d','stroke-width':1,'data-current-sun':true},undefined,g);}
      else if(r.nextDawn){const p=M.polar(r.cx,r.cy,r.radius,r.center+r.span/2);node('circle',{cx:p.x,cy:p.y,r:2,fill:'none',stroke:r.dawnColor,'stroke-width':1,'data-next-dawn':true},undefined,g);}
      if(r.labels!==false)for(const [key,title,t,offset]of [['dawn','DAWN',0,6],['sunrise','RISE',data.rise,0],['sunset','SET',data.set,0],['dusk','DUSK',1,-6]]){
        const angle=r.center+r.span/2-t*r.span,p=M.polar(r.cx,r.cy,Math.max(25,r.radius-(key==='sunrise'||key==='sunset'?30:17)),angle+offset),size=r.labelSize||11;
        const label=node('g',{'data-solar-reference':key,'pointer-events':'none'},undefined,g);
        node('text',{x:p.x,y:p.y-5,fill:'#a9b8ad','font-family':'InstrumentSans, sans-serif','font-size':Math.max(8,size-2),'text-anchor':'middle'},title,label);
        node('text',{x:p.x,y:p.y+size-3,fill:r.dayColor,'font-family':'InstrumentSans, sans-serif','font-size':size,'font-weight':600,'text-anchor':'middle'},d[key],label);
      }
    }
    if(!clean)node('path',{d:M.arc(r),fill:'none',stroke:focus==='ribbon'||targets?'#80d9ff33':'transparent','stroke-width':r.width+2*r.padding,'stroke-linecap':'butt','data-hold-target':'ribbon','pointer-events':'none'},undefined,g);
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();testing?launch({source:'sunrise',action:r.action}):choose('ribbon');}});
    const summary=$('sSolarSummary');if(summary)summary.textContent=data.valid?`Dawn ${d.dawn} · Sunrise ${d.sunrise} · Sunset ${d.sunset} · Dusk ${d.dusk}`:data.reason;
    const schedule=$('sSolarSchedule');if(schedule){schedule.replaceChildren();if(data.valid)for(const seg of data.segments){if(seg.from===seg.to)continue;const row=document.createElement('div'),label=document.createElement('span'),times=document.createElement('span');label.textContent=seg.label;label.style.borderLeft=`3px solid ${r[seg.color]}`;times.textContent=`${seg.start}–${seg.end}`;row.append(label,times);schedule.append(row);}else schedule.textContent=data.reason;}
  }
  const originalRender=render;
  render=function(clean=false){
    const live=$('live').checked,nowButton=$('sUseNow'),clockState=$('sClockState');
    if(nowButton){nowButton.textContent=live?'Pause clock':'Use current time';nowButton.classList.toggle('active',live);}
    if(clockState)clockState.textContent=`${live?'Live time':'Preview time'} · UTC${d.utcOffset>=0?'+':''}${d.utcOffset}`;
    if(live&&document.activeElement!==$('sPreviewTime'))$('sPreviewTime').value=$('time').value;
    if(!active())return originalRender(clean);
    const keys=['solarRing','lunarRing','solarPointer','sunMarker','moonMarker','compass','ticks','hourMarkerLength','iconNotifications','northNeedle','headingReadout'],saved=Object.fromEntries(keys.map(k=>[k,d[k]])),refresh=d.refreshControl;
    try{for(const k of keys)d[k]=k==='hourMarkerLength'?0:false;d.refreshControl={...refresh,enabled:false};originalRender(clean);}
    finally{Object.assign(d,saved);d.refreshControl=refresh;}
    const s=state(),m=effectiveMode();
    if(m!=='aod'&&s.minuteMarks!=='none'){
      const count=s.minuteMarks==='minutes'?60:4;
      for(let i=0;i<count;i++){const a=i*360/count;
        // Reserve the lower arc for the solar ribbon.
        if(Math.abs(((a-s.ribbon.center+540)%360)-180)<=s.ribbon.span/2+4)continue;
        const p=M.polar(227,227,219,a),p2=M.polar(227,227,219-(count===4||i%5===0?5:2),a);
        node('line',{x1:p.x,y1:p.y,x2:p2.x,y2:p2.y,stroke:'#6f8278','stroke-width':1,'data-studio-minute':true},undefined,face);
      }
    }
    if(m!=='aod'&&s.compass==='cardinals')for(const [i,label]of ['N','E','S','W'].entries()){
      const a=i*90-d.compassHeading;if(Math.abs(((a-s.ribbon.center+540)%360)-180)<s.ribbon.span/2+5)continue;
      const p=M.polar(227,227,204,a);node('text',{x:p.x,y:p.y,fill:'#819b8d','text-anchor':'middle','dominant-baseline':'central','font-size':11,'data-compass-diagram':true},label,face);
    }
    drawRibbon(clean);for(const c of s.controls)if(visible(c))drawControl(c,clean);
  };
  function launch(c) {
    const result=effectiveMode()==='aod'?{available:false,message:'Always-on preview: hold actions are inactive. Wake the watch first.'}:c.available===false?{available:false,message:'This complication is unavailable in the selected preview. No action.'}:M.action(c);
    $('sActionPreview').hidden=false;$('sActionText').textContent=result.message;ui.message(result.message);
    window.studioLastAction={id:c.id||'ribbon',...result};
  }
  function point(e){return new DOMPoint(e.clientX,e.clientY).matrixTransform(face.getScreenCTM().inverse());}
  function hit(p){
    if(Math.hypot(p.x-227,p.y-227)>227)return null;
    const list=state().controls.filter(c=>visible(c)&&M.hit(c,p.x,p.y));
    list.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
    if(list.length)return list[0].id;
    return visible(state().ribbon)&&M.ribbonHit(state().ribbon,p.x,p.y)?'ribbon':null;
  }
  function clearGesture(){clearTimeout(timer);timer=null;gesture=null;}
  face.addEventListener('pointerdown',e=>{
    if(!active()||e.button!==0)return;
    const p=point(e),id=hit(p);if(!id)return;
    e.preventDefault();e.stopImmediatePropagation();face.setPointerCapture(e.pointerId);
    const c=id==='ribbon'?state().ribbon:state().controls.find(x=>x.id===id);
    gesture={id,p,x:c.x??c.cx,y:c.y??c.cy,moved:false,held:false};choose(id);
    if(testing)timer=setTimeout(()=>{if(!gesture)return;gesture.held=true;launch(id==='ribbon'?{source:'sunrise',action:c.action}:c);},650);
  },true);
  face.addEventListener('pointermove',e=>{
    if(!gesture)return;e.preventDefault();e.stopImmediatePropagation();const p=point(e),dx=p.x-gesture.p.x,dy=p.y-gesture.p.y;
    if(Math.hypot(dx,dy)<5&&!gesture.moved)return;
    if(testing){clearTimeout(timer);return;}
    if(!gesture.moved)checkpoint();gesture.moved=true;
    const c=gesture.id==='ribbon'?state().ribbon:state().controls.find(x=>x.id===gesture.id),rx=gesture.id==='ribbon'?'cx':'x',ry=gesture.id==='ribbon'?'cy':'y';
    c[rx]=Math.round(M.clamp(gesture.x+dx,0,454));c[ry]=Math.round(M.clamp(gesture.y+dy,0,454));render();
  },true);
  face.addEventListener('pointerup',e=>{if(!gesture)return;e.stopImmediatePropagation();if(gesture.moved){persist();ui.open();}else if(testing&&!gesture.held)ui.message('Press and hold the highlighted target for 0.65 seconds to preview its action.');clearGesture();},true);
  for(const event of ['pointercancel','lostpointercapture'])face.addEventListener(event,clearGesture);
  face.addEventListener('contextmenu',e=>{if(active())e.preventDefault();});
  function number(label,obj,key,min,max,step=1){const n=ui.input(label,obj[key],v=>ui.change(()=>obj[key]=M.clamp(Number.isFinite(v)?v:min,min,max)));n.min=min;n.max=max;n.step=step;return n;}
  function select(label,obj,key,values){return ui.input(label,obj[key],v=>ui.change(()=>obj[key]=v),'text',values);}
  function check(label,obj,key){return ui.input(label,obj[key],v=>ui.change(()=>obj[key]=v),'checkbox');}
  function note(text){const p=document.createElement('p');p.className='note';p.textContent=text;ui.panel.append(p);}
  function heading(t){const h=document.createElement('h3');h.textContent=t;ui.panel.append(h);}
  function visibility(c){heading('Visibility');for(const [k,label]of [['day','Day'],['night','Night'],['aod','Always-on']])check(label,c.visibility,k);}
  const actions=[['none','No action'],...Object.entries(M.sources).filter(([k])=>k!=='wallet').map(([k,v])=>[k,v.label])];
  function list(){
    ui.title('Interactive layers','Select a control to see its invisible hold target. All readings here are samples.');
    if(!state()){ui.panel.append(ui.button('Create Studio 2 preview',()=>ui.change(()=>d.studio2=M.defaults(d)),'primary'));return;}
    check('Studio 2 redesign',state(),'enabled');
    const stack=document.createElement('div');stack.className='stack';ui.panel.append(stack);
    stack.append(ui.button('Solar ribbon',()=>choose('ribbon'),'layer-button'));
    for(const c of state().controls)stack.append(ui.button(c.source==='wallet'?'Wallet · unavailable':c.id==='health'?'Health · '+M.sources[c.source].label:c.label,()=>choose(c.id),'layer-button'));
    heading('Bezel');select('Minute information',state(),'minuteMarks',[['none','None'],['quarters','Quarter marks'],['minutes','Fine minute marks']]);select('Compass',state(),'compass',[['hidden','Hidden'],['cardinals','Small cardinals · simulated']]);
    if(state().compass!=='hidden')note('Cardinal directions use the preview heading. Continuous geographic heading on the physical watch is not verified.');
    ui.panel.append(ui.button(targets?'Hide all targets':'Show all targets',()=>{targets=!targets;render();ui.open();}));
  }
  function inspect(){
    if(!focus||!state())return list();
    ui.panel.append(ui.button('← Interactive layers',()=>{focus=null;ui.open();render();},'back'));
    if(focus==='ribbon'){
      const r=state().ribbon;ui.title('Solar ribbon','A compact daylight timeline. Native watch pixels; noon is not a compass bearing.');
      const timing=M.solar(d,previewHour());
      if(timing.valid){const schedule=document.createElement('div');schedule.className='solar-schedule';for(const seg of timing.segments){if(seg.from===seg.to)continue;const row=document.createElement('div'),label=document.createElement('span'),times=document.createElement('span');label.textContent=seg.label;label.style.borderLeft=`3px solid ${r[seg.color]}`;times.textContent=`${seg.start}–${seg.end}`;row.append(label,times);schedule.append(row);}ui.panel.append(schedule);}
      ui.input('Time labels on watch',r.labels!==false,v=>ui.change(()=>r.labels=v),'checkbox');number('Time label size',r,'labelSize',9,16);
      heading('Geometry');number('Arc span (°)',r,'span',40,180);number('Thickness (px)',r,'width',1,10,.5);number('Radius (px)',r,'radius',40,220);number('Centre angle (°)',r,'center',0,360);number('Centre X',r,'cx',0,454);number('Centre Y',r,'cy',0,454);
      heading('Appearance');select('Ribbon style',r,'style',[['solid','Solid'],['dotted','Dotted']]);
      for(const [k,label]of [['dawnColor','Nautical dawn'],['goldenColor','Golden hour'],['dayColor','Daylight'],['duskColor','Nautical dusk'],['markerColor','Current sun']])ui.input(label,r[k],v=>ui.change(()=>r[k]=v),'color');
      number('Sun marker size',r,'markerSize',1,8);check('Sunrise / sunset ticks',r,'endpoints');number('After-dark opacity',r,'nightOpacity',0,1,.05);check('Next dawn marker',r,'nextDawn');
      heading('Solar calculation');check('Calculate from date / location',d,'autoSky');check('Manual event times',d,'solarManual');
      for(const [k,label]of [['dawn','Nautical dawn time'],['sunrise','Sunrise time'],['sunset','Sunset time'],['dusk','Nautical dusk time']])ui.input(label,d[k],v=>ui.change(()=>{d[k]=v;d.solarManual=true;}),'time');
      number('Golden minutes either side',d,'golden',0,120);number('Latitude',d,'latitude',-90,90,.001);number('Longitude',d,'longitude',-180,180,.001);number('UTC offset',d,'utcOffset',-14,14,.5);
      const n=ui.input('Preview date',previewDate().toISOString().slice(0,10),v=>{if(!v)return;ui.change(()=>{const date=new Date(v+'T00:00:00Z');d.previewYear=date.getUTCFullYear();d.previewDay=Math.floor((date-Date.UTC(d.previewYear,0,1))/86400000)+1;});},'date');
      heading('Hold target');select('Hold action',r,'action',[['none','No action'],['sunrise','Sunrise details'],['sunset','Sunset details']]);number('Touch padding (px)',r,'padding',0,40);note('The highlighted curved band is the exact hold target. Golden hour uses the saved minutes around sunrise / sunset. Missing polar events show a neutral dotted ribbon.');visibility(r);return;
    }
    const c=state().controls.find(c=>c.id===focus);if(!c){focus=null;return list();}
    ui.title(c.source==='wallet'?'Wallet · unavailable':c.id==='health'?'Health':c.label,'Edit the visible control and its separate invisible target.');
    if(c.source==='wallet'){
      note(M.action(c).message);note('The dashed Wallet button is a disabled layout preview. Selecting it shows these details; testing a hold explains the limitation.');
      heading('Placement');number('X',c,'x',0,454);number('Y',c,'y',0,454);number('Visible width',c,'width',70,180);number('Visible height',c,'height',24,80);check('Follow radius',c,'followRadius');number('Rotation offset (°)',c,'rotation',-180,180);
      heading('Preview target');number('Touch padding (px)',c,'padding',0,40);number('Minimum target width',c,'targetWidth',20,220);number('Minimum target height',c,'targetHeight',20,160);visibility(c);
      ui.panel.append(ui.button('Why unavailable?',()=>launch(c)));return;
    }
    heading('Display');
    const allowed=c.source==='refresh'?['refresh']:['notifications','sleep','hr','bodyBattery','stress','recovery','training'];
    ui.input('Display source',c.source,v=>ui.change(()=>{c.source=v;c.label=M.sources[v].label;c.value=M.sources[v].sample;}),'text',allowed.map(k=>[k,M.sources[k].label]));
    select('Display style',c,'style',[['plain','Plain'],['pill','Filled pill'],['outline','Outline']]);select('Show',c,'display',[['iconValue','Icon + value'],['icon','Icon only'],['value','Value only'],['labelValue','Label + value']]);
    select('Icon',c,'icon',[['auto','Match source'],...['bell','moon','heart','battery','activity','clock','refresh','sun','none'].map(k=>[k,k])]);
    ui.input('Preview value',c.value,v=>ui.change(()=>c.value=v.slice(0,40)),'text');number('Text / icon size',c,'size',10,32);number('Visible width',c,'width',16,180);number('Visible height',c,'height',16,80);check('Use accent colour',c,'useAccent');ui.input('Custom colour',c.color,v=>ui.change(()=>c.color=v),'color');
    heading('Placement');number('X',c,'x',0,454);number('Y',c,'y',0,454);
    const radius=Math.hypot(c.x-227,c.y-227),angle=M.bearing(c.x,c.y);
    ui.input('Radius (px)',Math.round(radius),v=>ui.change(()=>Object.assign(c,M.polar(227,227,M.clamp(v,0,215),angle))));ui.input('Angle (°)',Math.round(angle),v=>ui.change(()=>Object.assign(c,M.polar(227,227,radius,M.clamp(v,0,360)))));
    check('Follow radius',c,'followRadius');number('Rotation offset (°)',c,'rotation',-180,180);
    heading('Hold target');select('Hold action',c,'action',actions);select('Target shape',c,'targetShape',[['rect','Rectangle'],['ellipse','Ellipse']]);number('Touch padding (px)',c,'padding',0,40);number('Minimum target width',c,'targetWidth',20,220);number('Minimum target height',c,'targetHeight',20,160);
    const g=M.geometry(c);note(`Actual target: ${g.width} × ${g.height} px, clipped to the circular screen. It follows the control’s position and rotation. If targets overlap, the nearest centre wins.`);
    ui.input('Preview availability',c.available!==false,v=>ui.change(()=>c.available=v),'checkbox');
    if(M.sources[c.source].api)note(`${M.sources[c.source].label}: documented from Connect IQ ${M.sources[c.source].api}. Availability and launch destination depend on the device and firmware. Studio simulates the hold; no device launch is implemented in this preview.`);
    visibility(c);ui.panel.append(ui.button('Preview hold action',()=>launch(c),'primary'));
  }
  $('sTestHold').onclick=()=>{testing=!testing;clearGesture();$('sTestHold').textContent=testing?'Done testing':'Test holds';$('sTestHold').classList.toggle('active',testing);ui.message(testing?'Hold any control for 0.65 seconds. Dragging is paused while testing.':'Select or drag a layer to edit it.');};
  $('sCloseAction').onclick=()=>{$('sActionPreview').hidden=true;};
  $('sPreviewTime').oninput=e=>{$('time').value=e.target.value;$('live').checked=false;render();};
  $('sUseNow').onclick=()=>{
    clearGesture();
    if($('live').checked){useNow(false);$('live').checked=false;$('sPreviewTime').value=$('time').value;render();ui.message('Clock paused. Set a preview time or use current time again.');return;}
    useNow(true);$('sPreviewTime').value=$('time').value;render();persist();if(focus==='ribbon')ui.open();
    ui.message(`Using current time and date at UTC${d.utcOffset>=0?'+':''}${d.utcOffset}. The clock and solar ribbon update live; health readings remain samples.`);
  };
  window.studio2Select=choose;
  return {list,inspect,selected:()=>focus,clear(){focus=null;},select:choose,validate(c){if(c.studio2)M.validate(c.studio2);}};
};
