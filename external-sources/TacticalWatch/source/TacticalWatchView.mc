using Toybox.Graphics;
using Toybox.WatchUi;
using Toybox.System;
using Toybox.Time;
using Toybox.Math;

class TacticalWatchView extends WatchUi.WatchFace {
    var data;
    var art;
    var cfg;
    var sky;
    var asleep=false;
    var night=false;
    var now=0;
    var hour=0;
    var minute=0;
    var second=0;
    var heading=null;
    var refreshAtTick=null;
    function refreshAt(p){
        if(asleep||!cfg.hasKey("refreshControl")){return false;}
        var r=cfg["refreshControl"];
        // Finger-sized hit area extends beyond the visible outline in every direction.
        var touchPadding=24;
        if(!r["enabled"]||Bounds.abs(p[0]-r["x"])>r["width"]/2+touchPadding||Bounds.abs(p[1]-r["y"])>r["height"]/2+touchPadding){return false;}
        var tick=System.getTimer();
        if(refreshAtTick!=null&&tick-refreshAtTick>=0&&tick-refreshAtTick<2000){return true;}
        refreshAtTick=tick;if(!RuntimeProfile.preview){FixtureSync.queue();}data.refresh(true);sky.skyDay=-1;WatchUi.requestUpdate();return true;
    }
    function drawRefresh(dc){
        if(!cfg.hasKey("refreshControl")||!cfg["refreshControl"]["enabled"]){return;}
        var r=cfg["refreshControl"],label="HOLD REFRESH";
        if(refreshAtTick!=null&&System.getTimer()-refreshAtTick>=0&&System.getTimer()-refreshAtTick<10000){label=heading==null?"NO HEADING":"DATA REREAD";}
        color(dc,accent());dc.drawRoundedRectangle(r["x"]-r["width"]/2,r["y"]-r["height"]/2,r["width"],r["height"],6);
        timeText(dc,label,r["x"],r["y"],"refresh",accent(),0);
    }
    function initialize(){WatchFace.initialize();cfg=ApprovedLayout.config;data=new WatchData();art=new DesignGraphics();sky=new SkyRenderer(self);}
    function onLayout(dc){clock();sky.update(now,hour,minute,second);}
    function onEnterSleep(){asleep=true;heading=null;data.resetHeading();WatchUi.requestUpdate();}
    function onExitSleep(){asleep=false;data.resetHeading();data.refresh(true);WatchUi.requestUpdate();}
    function rgb(hex){return hex.substring(1,7).toNumberWithBase(16);}
    function color(dc,c){dc.setColor(c,Graphics.COLOR_TRANSPARENT);}
    function accent(){return rgb(night?cfg["lume"]:cfg["accent"]);}
    function bg(){return night?0:rgb(cfg["bg"]);}
    function blend(c,opacity){var b=bg(),out=0;for(var i=0;i<3;i++){var shift=i*8;out+=(((c>>shift)&255)*opacity+((b>>shift)&255)*(1-opacity)).toNumber()<<shift;}return out;}
    function point(r,a){return [227+Math.cos(a)*r,227+Math.sin(a)*r];}
    function hourAngle(h){return (h-(cfg["solarTop"].equals("noon")?12:0))*Math.PI/12-Math.PI/2;}
    function line(dc,x1,y1,x2,y2,c,w){color(dc,c);dc.setPenWidth(w);dc.drawLine(x1,y1,x2,y2);dc.setPenWidth(1);}
    function arc(dc,r,a,b,w,c,roundCaps){
        if(b<=a){return;}color(dc,c);dc.setPenWidth(w);
        var p=point(r,a),n=Math.ceil((b-a)*r/3).toNumber();if(n<1){n=1;}
        for(var i=1;i<=n;i++){var q=point(r,a+(b-a)*i/n);dc.drawLine(p[0],p[1],q[0],q[1]);p=q;}
        dc.setPenWidth(1);if(roundCaps){var start=point(r,a);dc.fillCircle(start[0],start[1],w/2);dc.fillCircle(p[0],p[1],w/2);}
    }
    function band(dc,r,start,end,width,c,caps){if(end<start){end+=24;}arc(dc,r,hourAngle(start),hourAngle(end),width,c,caps);}
    function parseHour(value){return value.substring(0,2).toNumber()+value.substring(3,5).toNumber()/60.0;}
    function inside(h,a,b){return a<=b?(h>=a&&h<b):(h>=a||h<b);}
    function timeText(dc,value,x,y,font,c,align){art.text(dc,ApprovedLayout.fontIds[font],value,x,y,c,align,0);}
    function clock(){
        var t=System.getClockTime();now=RuntimeProfile.preview?RuntimeProfile.epoch:Time.now().value();
        hour=RuntimeProfile.preview?RuntimeProfile.hour:t.hour;minute=RuntimeProfile.preview?RuntimeProfile.minute:t.min;second=RuntimeProfile.preview?RuntimeProfile.second:t.sec;
    }
    function pointer(dc,degree,r,size,shape,c,inward){
        size=Bounds.max(4,Bounds.min(20,size));r=Bounds.max(20,Bounds.min(226-size/2,r));
        var a=degree*Math.PI/180,center=point(r,a-Math.PI/2),sign=inward?1:-1,h=size/2;
        var vertices=shape.equals("diamond")?[[0,h],[-h*0.65,0],[0,-h],[h*0.65,0]]:shape.equals("kite")?[[0,h],[-h*0.65,-h],[0,-h*0.4],[h*0.65,-h]]:shape.equals("chevron")?[[-h*0.8,-h*0.6],[0,h],[h*0.8,-h*0.6]]:[[0,h],[-h*0.7,-h],[h*0.7,-h]];
        color(dc,c);if(shape.equals("dot")){dc.fillCircle(center[0],center[1],h*0.7);return;}
        var pts=[];for(var vi=0;vi<vertices.size();vi++){var v=vertices[vi];pts.add([center[0]+sign*(v[0]*Math.cos(a)-v[1]*Math.sin(a)),center[1]+sign*(v[0]*Math.sin(a)+v[1]*Math.cos(a))]);}
        if(shape.equals("chevron")){for(var i=1;i<pts.size();i++){line(dc,pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1],c,2);}}else{dc.fillPolygon(pts);}
    }
    function split(value,delimiter){var out=[],part="",chars=value.toCharArray();for(var i=0;i<chars.size();i++){var ch=chars[i].toString();if(ch.equals(delimiter)){out.add(part);part="";}else{part+=ch;}}out.add(part);return out;}
    function lines(value,f){
        var out=[];
        var inputRows=split(value,"\n");for(var ri=0;ri<inputRows.size();ri++){var row=inputRows[ri];
            if(!f["wrap"]){out.add(row);continue;}var current="";
            var words=split(row," ");for(var wi=0;wi<words.size();wi++){var word=words[wi];if(current.length()>0&&current.length()+word.length()+1>f["wrapChars"]){out.add(current);current=word;}else{current+=(current.length()>0?" ":"")+word;}}out.add(current);
        }
        if(!f["wrap"]&&out.size()>1){var joined="";for(var ri=0;ri<out.size();ri++){joined+=(joined.length()>0?" · ":"")+out[ri];}return [joined];}return out;
    }
    function drawField(dc,f){
        if(!f["visible"]||(night&&!f["night"])){return;}
        var value=RuntimeProfile.preview?RuntimeProfile.fields[f["id"]]:data.fieldValue(f),font=f["fontIndex"],c=f["useAccent"]?accent():rgb(f["color"]);
        var rows=lines(value,f),x=f["x"],y=f["y"],angle=f["rotation"]*Math.PI/180,ix=0,iy=0,iconAngle=angle+f["iconRotation"]*Math.PI/180;
        var firstWidth=art.width(font,rows[0]),maxWidth=firstWidth;for(var ri=0;ri<rows.size();ri++){maxWidth=Bounds.max(maxWidth,art.width(font,rows[ri]));}
        if(f["curved"]){
            var r=Bounds.max(25,Math.sqrt((x-227)*(x-227)+(y-227)*(y-227))),a=Math.atan2(y-227,x-227)+angle,dir=f["curveReverse"]?-1:1;
            for(var i=0;i<rows.size();i++){
                var radius=Bounds.max(20,r+(i-(rows.size()-1)/2.0)*f["size"]*1.25);
                if(f["bubble"]&&!f["grouped"]){var span=Bounds.min(Math.PI*1.8,Bounds.max(0.04,(art.width(font,rows[i])+2*f["bubbleLengthPad"])/radius));arc(dc,radius,a-span/2,a+span/2,f["size"]+2*f["bubbleWidthPad"]+2*f["bubbleWidth"],rgb(f["bubbleColor"]),true);arc(dc,radius,a-span/2,a+span/2,f["size"]+2*f["bubbleWidthPad"],bg(),true);}
                art.radial(dc,font,rows[i],radius,a,f["curveReverse"],c);
            }
            var ia=a-dir*Bounds.min(1,(firstWidth/2+f["iconOffset"])/r);ix=227+r*Math.cos(ia);iy=227+r*Math.sin(ia);
            iconAngle=(f["iconFollowRadius"]?ia+dir*Math.PI/2:0)+f["iconRotation"]*Math.PI/180;
        }else{
            if(cfg["panels"]&&!night&&!f["grouped"]){color(dc,rgb(cfg["bg"]));dc.fillRoundedRectangle(x-maxWidth/2-4,y-rows.size()*f["size"]*0.59-5,maxWidth+8,rows.size()*f["size"]*1.18+10,4);color(dc,accent());dc.drawRoundedRectangle(x-maxWidth/2-4,y-rows.size()*f["size"]*0.59-5,maxWidth+8,rows.size()*f["size"]*1.18+10,4);}
            for(var i=0;i<rows.size();i++){var offset=(i-(rows.size()-1)/2.0)*f["size"]*1.18;art.text(dc,font,rows[i],x-Math.sin(angle)*offset,y+Math.cos(angle)*offset,c,0,angle);}
            ix=x-(maxWidth/2+f["iconOffset"])*Math.cos(angle);iy=y-(maxWidth/2+f["iconOffset"])*Math.sin(angle);
        }
        if(f["iconIndex"]>=0){art.image(dc,ApprovedLayout.icons[f["iconIndex"]],ix,iy,iconAngle,f["size"]*f["iconScale"]/4000.0,-32,-32,c);}
    }
    function drawTime(dc){
        if(!cfg["style"].equals("analog")){
            var hh=hour;if(cfg["format"].equals("12")){hh=hour%12;if(hh==0){hh=12;}}
            timeText(dc,hh.format("%02d"),227-cfg["digitalGap"],227,"digital",accent(),1);
            timeText(dc,minute.format("%02d"),227+cfg["digitalGap"],227,"digital",accent(),-1);
            if(cfg["format"].equals("12")){timeText(dc,hour<12?"AM":"PM",227,227+cfg["digitalSize"]*0.75,"small",accent(),0);}
        }
        if(cfg["style"].equals("digital")){return;}
        for(var i=0;i<2;i++){var h=ApprovedLayout.hands[i],a=(i==0?hour%12*30+minute*0.5:minute*6)*Math.PI/180;art.image(dc,ApprovedLayout.handImages[i],227,227,a,1,h["x"],h["y"],null);}
        color(dc,rgb(cfg["pivotColor"]));dc.fillCircle(227,227,cfg["pivotSize"]);color(dc,rgb(cfg["handBorder"]));dc.setPenWidth(cfg["handBorderWidth"]/2.0);dc.drawCircle(227,227,cfg["pivotSize"]);dc.setPenWidth(1);
    }
    function drawStatus(dc){
        var keys=ApprovedLayout.statusKeys,layout=cfg["statusLayout"],shown=[],maxSize=cfg["statusSize"],maxNumber=0;
        for(var i=0;i<keys.size();i++){var state=data.status(keys[i]);if(state==null||(state==false&&layout["inactive"].equals("hide"))){continue;}shown.add(i);var custom=ApprovedLayout.iconSizes[keys[i]];if(custom!=null){maxSize=Bounds.max(maxSize,custom);}maxNumber=Bounds.max(maxNumber,statusNumber(keys[i]).length());}
        var cellWidth=maxSize+maxNumber*maxSize*0.48+(maxNumber>0?5:0);
        var cols=layout["arrangement"].equals("row")?Bounds.max(1,shown.size()):layout["arrangement"].equals("column")?1:Bounds.max(1,layout["columns"]);
        for(var j=0;j<shown.size();j++){
            var i=shown[j],key=keys[i],row=j/cols,rows=Math.ceil(shown.size()/cols.toFloat()),inRow=Bounds.min(cols,shown.size()-row*cols);
            var x=layout["x"]+(j%cols-(inRow-1)/2.0)*(cellWidth+layout["gap"]),y=layout["y"]+(row-(rows-1)/2.0)*(maxSize+layout["rowGap"]),pos=ApprovedLayout.positions[key];
            if(pos!=null){x=pos["x"];y=pos["y"];}
            var size=ApprovedLayout.iconSizes[key];if(size==null){size=cfg["statusSize"];}
            var c=data.status(key)==false&&layout["inactive"].equals("dim")?blend(accent(),0.3):accent();
            var label=statusNumber(key),ix=label.length()>0?-(label.length()*size*0.48+5)/2:0;
            art.image(dc,ApprovedLayout.statusIcons[i],x+ix,y,0,size/40.0,-32,-32,c);
            if(key.equals("iconBattery")){var battery=data.statusValue(key).toNumber();if(battery!=null){color(dc,c);dc.fillRectangle(x+ix-size*8/24.0,y-size*4/24.0,size*14/24.0*battery/100.0,size*8/24.0);}}
            if(key.equals("iconDays")&&cfg["daysDisplay"].equals("inside")){timeText(dc,data.statusValue(key)+"d",x+ix-1,y+0.5,"battery",c,0);}
            if(label.length()>0){timeText(dc,label,x+ix+size/2+5,y,"status",c,-1);}
        }
        if(RuntimeProfile.preview||availableHeading()){
            if(cfg["northNeedle"]&&heading!=null){
                var a=-heading*Math.PI/180,p=point(cfg["markerSettings"]["northRadius"],Orientation.angle(0,heading)),s=cfg["markerSettings"]["northSize"]/20.0;
                var offset=cfg["markerOffsets"]["north"];if(offset!=null){p[0]+=offset["x"];p[1]+=offset["y"];}
                var pts=[],vertices=[[0,-12],[-6,8],[0,4],[6,8]];
                for(var i=0;i<vertices.size();i++){var v=vertices[i];pts.add([p[0]+s*(v[0]*Math.cos(a)-v[1]*Math.sin(a)),p[1]+s*(v[0]*Math.sin(a)+v[1]*Math.cos(a))]);}
                color(dc,0xff5555);dc.fillPolygon(pts);
            }
            if(cfg["headingReadout"]){var p=ApprovedLayout.positions["heading"];if(p==null){p={"x"=>227,"y"=>267};}var dirs=["N","NE","E","SE","S","SW","W","NW"],label="HDG --";
                if(heading!=null){label=(RuntimeProfile.preview?"":"~")+(Math.round(heading).toNumber()%360).format("%03d")+"° "+dirs[(Math.round(heading/45.0).toNumber())%8];}
                timeText(dc,label,p["x"],p["y"]-4,"heading",accent(),0);
            }
        }
    }
    function availableHeading(){return cfg.hasKey("headingMode")&&cfg["headingMode"].equals("available");}
    function drawAod(dc){
        if(!cfg.hasKey("aodTimeOnly")||!cfg["aodTimeOnly"]){return;}
        var h=hour;if(cfg["format"].equals("12")){h=hour%12;if(h==0){h=12;}}
        var label=h.format("%02d")+":"+minute.format("%02d")+(cfg["format"].equals("12")?(hour<12?"a":"p"):"");
        if(cfg.hasKey("aodLayout")){
            var layout=cfg["aodLayout"],t=layout["time"],c=rgb(cfg["aodColor"]);
            var shift=layout["protection"].equals("solid-shift-3")?(minute%3-1)*80:0;
            timeText(dc,label,t["x"],t["y"]+shift,"aod",c,0);data.refresh(false);
            for(var i=0;i<layout["fields"].size();i++){
                var item=layout["fields"][i];
                for(var j=0;j<ApprovedLayout.fields.size();j++){
                    var f=WatchUi.loadResource(ApprovedLayout.fields[j]);if(!f["id"].equals(item["id"])){continue;}
                    var value=RuntimeProfile.preview?RuntimeProfile.aodFields[f["id"]]:(f["source"].find("Next ")==0?data.fixture(f["id"],f["source"]):data.field(f["source"]));
                    if(f["source"].equals("Humidity")){value="HUM "+value;}
                    if(f["source"].equals("Feels-like temperature")&&value.find("FEELS ")==0){value=value.substring(6,value.length());}
                    var key="aodField"+i,font=ApprovedLayout.fontIds[key],trimmed=false;
                    while(art.width(font,value+(trimmed?"~":""))>item["maxWidth"]&&value.length()>0){value=value.substring(0,value.length()-1);trimmed=true;}
                    timeText(dc,value+(trimmed?"~":""),item["x"],item["y"]+shift,key,c,0);break;
                }
            }
            // Each physical row is dark once every three minute frames, regardless of live text.
            if(layout["protection"].equals("row-cycle-3")){dc.setAntiAlias(false);color(dc,0);for(var y=minute%3;y<454;y+=3){dc.fillRectangle(0,y,454,1);}dc.setAntiAlias(true);}return;
        }
        var p=cfg["aodPositions"][minute%3];
        var ids=cfg.hasKey("aodFieldIds")?cfg["aodFieldIds"]:[],hasData=ids.size()>0,c=rgb(cfg["aodColor"]);
        timeText(dc,label,p[0],p[1]-(hasData?12:0),"aod",c,0);
        if(hasData){
            data.refresh(false);
            for(var i=0;i<ids.size()&&i<2;i++){
                for(var j=0;j<ApprovedLayout.fields.size();j++){
                    var f=WatchUi.loadResource(ApprovedLayout.fields[j]);if(!f["id"].equals(ids[i])){continue;}
                    var value=RuntimeProfile.preview?RuntimeProfile.aodFields[f["id"]]:(f["source"].find("Next ")==0?data.fixture(f["id"],f["source"]):data.field(f["source"]));
                    if(f["source"].equals("Humidity")){value="HUM "+value;}
                    var font=ApprovedLayout.fontIds["aodData"],trimmed=false;
                    while(art.width(font,value+(trimmed?"~":""))>148&&value.length()>0){value=value.substring(0,value.length()-1);trimmed=true;}
                    if(trimmed){value+="~";}
                    timeText(dc,value,ids.size()==1?227:147+i*160,p[1]+25,"aodData",c,0);break;
                }
            }
        }
    }
    function statusNumber(key){
        if(key.equals("iconDays")){return cfg["daysDisplay"].equals("beside")?data.statusValue(key)+"d":"";}
        if(!cfg["statusLayout"]["values"]){return "";}
        return data.statusValue(key)+(key.equals("iconBattery")?"%":"");
    }
    function onUpdate(dc){
        dc.setColor(0,0);dc.clear();dc.setAntiAlias(true);clock();
        if(asleep){drawAod(dc);return;}
        heading=RuntimeProfile.preview?RuntimeProfile.heading:availableHeading()?data.heading():null;
        if(sky.skyDay!=now-hour*3600-minute*60-second){
            // Do the daily astronomy work in its own callback, outside the draw budget.
            dc.drawBitmap(0,0,art.bitmap(night?Rez.Drawables.DesignBackgroundNight:Rez.Drawables.DesignBackgroundDay));
            sky.update(now,hour,minute,second);WatchUi.requestUpdate();return;
        }
        sky.update(now,hour,minute,second);
        night=cfg["nightActivation"].equals("always")||(cfg["nightActivation"].equals("auto")&&sky.solar[1]!=null&&sky.solar[2]!=null&&!inside(hour+minute/60.0,sky.solar[1],sky.solar[2]))||(RuntimeProfile.preview&&RuntimeProfile.night);
        if(cfg["sleepSave"]&&inside(hour+minute/60.0,parseHour(cfg["sleepStart"]),parseHour(cfg["sleepEnd"]))){return;}
        data.refresh(false);dc.drawBitmap(0,0,art.bitmap(night?Rez.Drawables.DesignBackgroundNight:Rez.Drawables.DesignBackgroundDay));
        for(var fi=0;fi<ApprovedLayout.fields.size();fi++){drawField(dc,WatchUi.loadResource(ApprovedLayout.fields[fi]));}drawTime(dc);sky.draw(dc,hour,minute);drawStatus(dc);drawRefresh(dc);
        if(cfg["seconds"]&&cfg["highPower"]&&!cfg["secondRule"].equals("off")&&!cfg["secondsStyle"].equals("off")){
            if(cfg["secondsStyle"].equals("perimeter")){pointer(dc,second*6,cfg["secondsDiameter"]/2,cfg["secondsSize"],cfg["secondsShape"],rgb(cfg["secondColor"]),true);}
            else if(!cfg["style"].equals("digital")){var a=(second*6-90)*Math.PI/180,p=point(175,a),q=point(-28,a);line(dc,p[0],p[1],q[0],q[1],rgb(cfg["secondColor"]),2);}
        }
    }
}
