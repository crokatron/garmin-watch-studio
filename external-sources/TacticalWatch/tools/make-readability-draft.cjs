const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),d=JSON.parse(fs.readFileSync(path.join(root,'design/approved-layout.json')));
Object.assign(d,{accent:'#f2f6ff',bg:'#000000',lume:'#80ffc2',linkModes:false,nightActivation:'manual',globalFont:'InstrumentSans',fieldSize:24,digitalSize:80,digitalGap:8,statusSize:26,headingSize:22,contours:false,panels:false,quadrantSymmetry:false,bubbleGroups:[],ticks:false,hourMarkerLength:0,scaleSize:16,scaleColor:'#b8c8d8',scaleDiameter:390,dayBandColor:'#45e09b',dayBandOpacity:1,lunarColor:'#74dfff',dayBandWidth:5,lunarWidth:3,secondsSize:8,secondsDiameter:446,aodTimeOnly:true,aodSize:54,aodColor:'#56856a',aodPositions:[[227,151],[227,227],[227,303]],headingMode:'available',compassAod:false});
d.markerSettings={...d.markerSettings,northRadius:214,northSize:22,sunRadius:216,moonRadius:216};
Object.assign(d,{scaleStep:3,nightActivation:'auto',aodSize:64,aodColor:'#619a75'});
for(const f of d.fields)Object.assign(f,{visible:false,size:24,font:'InstrumentSans',weight:'700',curved:false,rotation:0,wrap:false,night:true,aod:false,useAccent:true,iconScale:100,iconGap:5,bubble:false});
function field(id,x,y,size,source,text){const f=d.fields.find(f=>f.id===id);Object.assign(f,{visible:true,x,y,size});if(source)f.source=source;if(text!==undefined)f.text=text;}
field('eight5',227,80,24);field('eight2',227,110,22);
field('eight3',237,139,22);
field('eight0',139,170,26);field('wind',310,170,20);
field('eight6',150,312,26,'Steps','8750');field('eight7',318,312,24,'Distance','6.2 km');
field('next-f1',237,344,20);field('next-boks',237,371,20);
for(const key of Object.keys(d))if(key.startsWith('icon')&&typeof d[key]==='boolean')d[key]=false;
d.iconBattery=true;d.iconNotifications=true;d.iconBluetooth=true;d.iconDays=true;d.daysDisplay='beside';
d.statusLayout={...d.statusLayout,arrangement:'row',gap:7,rowGap:4,x:227,y:407,values:false,inactive:'dim'};
d.positions={heading:{x:227,y:284},iconBattery:{x:163,y:397},iconDays:{x:221,y:397},iconNotifications:{x:281,y:397},iconBluetooth:{x:320,y:397}};
const dest=path.join(root,'design/readability-draft.json');fs.writeFileSync(dest,JSON.stringify(d,null,2)+'\n');
console.log(dest);
