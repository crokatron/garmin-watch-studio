/* Shared, dependency-free Studio 2 geometry. Units are native 454px watch pixels. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Studio2Model = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sources = {
    notifications: {label:'Notifications', icon:'bell', sample:'2', type:17, api:'4.2.0'},
    sleep: {label:'Sleep Score', icon:'moon', sample:'82', type:42, api:'6.0.2'},
    hr: {label:'Heart rate', icon:'heart', sample:'68', type:18, api:'4.2.0'},
    bodyBattery: {label:'Body Battery', icon:'battery', sample:'86', type:23, api:'4.2.0'},
    stress: {label:'Stress', icon:'activity', sample:'35', type:22, api:'4.2.0'},
    recovery: {label:'Recovery', icon:'clock', sample:'18h', type:21, api:'4.2.0'},
    training: {label:'Training Status', icon:'activity', sample:'Productive', type:26, api:'4.2.0'},
    sunrise: {label:'Sunrise', icon:'sun', sample:'06:07', type:13, api:'4.2.0'},
    sunset: {label:'Sunset', icon:'sun', sample:'18:17', type:14, api:'4.2.0'},
    refresh: {label:'Refresh data', icon:'refresh', sample:'', type:null, api:null},
    wallet: {label:'Wallet', icon:'wallet', sample:'—', type:null, api:null}
  };
  function control(id,source,x,y,extra={}) {
    return {id,source,label:sources[source].label,x,y,width:58,height:28,size:20,icon:'auto',
      display:'iconValue',style:'plain',value:sources[source].sample,followRadius:false,rotation:0,
      color:'#a7ddc3',useAccent:true,action:source,targetShape:'rect',padding:9,targetWidth:64,targetHeight:46,
      visibility:{day:true,night:true,aod:false},...extra};
  }
  function defaults(design={}) {
    const n=design.positions?.iconNotifications||{x:318,y:283};
    return {version:1,enabled:true,previewOnly:true,minuteMarks:'quarters',compass:'hidden',
      ribbon:{cx:227,cy:227,radius:207,center:180,span:120,width:4,style:'solid',
        dawnColor:'#5387c8',goldenColor:'#efb35c',dayColor:'#d9e5df',duskColor:'#7476c2',
        markerColor:'#fff3c8',markerSize:3,endpoints:true,labels:true,labelSize:11,nightOpacity:0.18,nextDawn:true,
        visibility:{day:true,night:true,aod:false},action:'sunrise',padding:10},
      controls:[control('notifications','notifications',n.x,n.y,{value:String(design.markerSettings?.notifications??2)}),
        control('sleep','sleep',142,385),control('health','bodyBattery',312,385),
        control('refresh','refresh',227,385,{width:28,size:19,display:'icon',targetWidth:44,targetHeight:44,visibility:{day:design.refreshControl?.enabled!==false,night:design.refreshControl?.enabled!==false,aod:false}}),
        control('wallet','wallet',227,32,{action:'none',width:90,height:28,size:16,style:'outline',visibility:{day:true,night:true,aod:false}})]};
  }
  function validate(s) {
    if(!s || s.version!==1 || typeof s.enabled!=='boolean' || !Array.isArray(s.controls) || s.controls.length>20)throw Error('Invalid Studio 2 design');
    const num=(obj,key,min,max)=>{if(!Number.isFinite(obj[key])||obj[key]<min||obj[key]>max)throw Error('Invalid Studio 2 '+key);};
    const vis=o=>{if(!o || !['day','night','aod'].every(k=>typeof o[k]==='boolean'))throw Error('Invalid mode visibility');};
    const r=s.ribbon;if(!r)throw Error('Missing solar ribbon');
    for(const [k,a,b]of [['cx',0,454],['cy',0,454],['radius',40,220],['center',0,360],['span',40,180],['width',1,10],['markerSize',1,8],['nightOpacity',0,1],['padding',0,40]])num(r,k,a,b);
    vis(r.visibility);if(!['none','sunrise','sunset'].includes(r.action))throw Error('Invalid ribbon action');
    if(r.labelSize!==undefined)num(r,'labelSize',9,16);
    if(!['solid','dotted'].includes(r.style))throw Error('Invalid ribbon style');
    if(!['none','quarters','minutes'].includes(s.minuteMarks)||!['hidden','cardinals'].includes(s.compass))throw Error('Invalid bezel style');
    const ids=new Set();
    for(const c of s.controls){
      if(typeof c.id!=='string'||!/^[\w-]{1,60}$/.test(c.id)||ids.has(c.id)||!sources[c.source]||!(c.action==='none'||sources[c.action]))throw Error('Invalid interactive element');ids.add(c.id);
      for(const [k,a,b]of [['x',0,454],['y',0,454],['width',16,180],['height',16,80],['size',10,32],['rotation',-180,180],['padding',0,40],['targetWidth',20,220],['targetHeight',20,160]])num(c,k,a,b);
      if(!['rect','ellipse'].includes(c.targetShape)||!['plain','pill','outline'].includes(c.style)||!['iconValue','icon','value','labelValue'].includes(c.display))throw Error('Invalid control style');
      if(typeof c.value!=='string'||c.value.length>40||typeof c.label!=='string'||c.label.length>60)throw Error('Invalid control text');
      vis(c.visibility);
    }
    for(const value of [r.dawnColor,r.goldenColor,r.dayColor,r.duskColor,r.markerColor,...s.controls.map(c=>c.color)])if(!/^#[\da-f]{6}$/i.test(value))throw Error('Invalid Studio 2 colour');
    return s;
  }
  const polar=(cx,cy,r,a)=>({x:cx+Math.sin(a*Math.PI/180)*r,y:cy-Math.cos(a*Math.PI/180)*r});
  const bearing=(x,y,cx=227,cy=227)=>(Math.atan2(x-cx,cy-y)*180/Math.PI+360)%360;
  const delta=(a,b)=>((a-b+540)%360)-180;
  function geometry(c){
    let angle=c.rotation;
    if(c.followRadius){angle+=bearing(c.x,c.y);if(angle>90&&angle<270)angle-=180;}
    return {x:c.x,y:c.y,width:Math.max(c.width+2*c.padding,c.targetWidth),height:Math.max(c.height+2*c.padding,c.targetHeight),angle,shape:c.targetShape};
  }
  function hit(c,x,y){const g=geometry(c),a=-g.angle*Math.PI/180,dx=x-g.x,dy=y-g.y,u=dx*Math.cos(a)-dy*Math.sin(a),v=dx*Math.sin(a)+dy*Math.cos(a);return g.shape==='ellipse'?(u/(g.width/2))**2+(v/(g.height/2))**2<=1:Math.abs(u)<=g.width/2&&Math.abs(v)<=g.height/2;}
  function ribbonHit(r,x,y){return Math.abs(Math.hypot(x-r.cx,y-r.cy)-r.radius)<=r.width/2+r.padding&&Math.abs(delta(bearing(x,y,r.cx,r.cy),r.center))<=r.span/2;}
  function arc(r,from=0,to=1){const pts=[];for(let i=0;i<=80;i++){const t=from+(to-from)*i/80,p=polar(r.cx,r.cy,r.radius,r.center+r.span/2-t*r.span);pts.push(`${i?'L':'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`);}return pts.join(' ');}
  function solar(design,hour){
    const parse=t=>typeof t==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t)?Number(t.slice(0,2))+Number(t.slice(3))/60:NaN;
    const ts=['dawn','sunrise','sunset','dusk'].map(k=>parse(design[k]));
    if(design.autoSky&&!design.solarManual&&design.skyNoEvents || ts.some(v=>!Number.isFinite(v)))return {valid:false,reason:'Solar events unavailable for this date / location'};
    for(let i=1;i<ts.length;i++){while(ts[i]<ts[i-1])ts[i]+=24;}
    const [start,rise,set,end]=ts,span=end-start;
    if(span<=0||span>=24||set<=rise)return {valid:false,reason:'Check the dawn, sunrise, sunset and dusk times'};
    let now=hour;while(now<start)now+=24;
    const f=t=>clamp((t-start)/span,0,1),gold=clamp(Number(design.golden)||0,0,120)/60;
    const cuts=[start,Math.max(start,rise-gold),Math.min((rise+set)/2,rise+gold),Math.max((rise+set)/2,set-gold),Math.min(end,set+gold),end];
    const time=t=>{const minutes=((Math.round(t*60)%1440)+1440)%1440;return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;};
    return {valid:true,rise:f(rise),set:f(set),active:now>=start&&now<=end,position:f(now),
      segments:cuts.slice(0,-1).map((a,i)=>({from:f(a),to:f(cuts[i+1]),start:time(a),end:time(cuts[i+1]),label:['Nautical dawn','Morning golden hour','Daylight','Evening golden hour','Nautical dusk'][i],color:['dawnColor','goldenColor','dayColor','goldenColor','duskColor'][i]}))};
  }
  function action(c){
    if(c.source==='wallet'||c.action==='wallet')return {available:false,message:'Wallet is unavailable: Garmin exposes no documented Wallet complication or watch-face launch route. Use the watch’s Wallet shortcut.'};
    if(c.action==='none')return {available:false,message:'No hold action assigned.'};
    const src=sources[c.action];
    return {available:true,message:c.action==='refresh'?'Preview: refresh available watch data. This cannot activate the compass sensor.':`Preview: open ${src.label}. Requires a matching device complication (API ${src.api}+); no watch app is launched from Studio.`};
  }
  return {clamp,sources,defaults,validate,polar,bearing,geometry,hit,ribbonHit,arc,solar,action};
});
