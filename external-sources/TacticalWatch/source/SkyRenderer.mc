using Toybox.Math;

// Daily events use the same low-precision model and crossing interpolation as the editor.
class SkyRenderer {
    var view;
    var cfg;
    var skyDay=-1;
    var solar=[];
    var lunar=[];
    var lunarEvents=[];
    var current;
    function initialize(owner){view=owner;cfg=ApprovedLayout.config;}
    function position(epoch){return Sky.position(epoch,cfg["latitude"],cfg["longitude"]);}
    function update(now,hour,minute,second){
        current=position(now);var base=now-hour*3600-minute*60-second;
        if(base==skyDay){return;}skyDay=base;solar=[null,null,null,null];lunar=[];lunarEvents=[];
        var targets=[-12,-0.833,-0.833,-12,0.133],rises=[true,true,false,false];
        var previous=position(base),start=previous[1][1]>=0.133?0:null;
        // Share samples between all event searches to fit the watch-face watchdog.
        // Thirty-minute brackets; crossings refined to <2 seconds. See capabilities.
        for(var i=1;i<=48;i++){
            var next=position(base+i*1800);
            for(var j=0;j<5;j++){
                var body=j==4?1:0,p=previous[body][1]-targets[j],v=next[body][1]-targets[j],rising=p<0;
                if(!((p<0&&v>=0)||(p>=0&&v<0))){continue;}
                if(j<4&&(rising!=rises[j]||solar[j]!=null)){continue;}
                var lo=(i-1)*1800.0,hi=i*1800.0;
                for(var k=0;k<10;k++){var mid=(lo+hi)/2,value=position(base+mid)[body][1]-targets[j];if(rising?value<0:value>=0){lo=mid;}else{hi=mid;}}
                var crossing=(lo+hi)/7200;
                if(j<4){solar[j]=(Math.round(crossing*60).toNumber()%1440)/60.0;}
                else{lunarEvents.add([crossing,rising]);if(rising){start=crossing;}else if(start!=null){lunar.add([start,crossing]);start=null;}}
            }previous=next;
        }
        if(start!=null){lunar.add([start,24]);}
        if(cfg["solarManual"]||!cfg["autoSky"]){solar=[view.parseHour(cfg["dawn"]),view.parseHour(cfg["sunrise"]),view.parseHour(cfg["sunset"]),view.parseHour(cfg["dusk"])];}
    }
    function dayBand(dc,start,end){
        if(end<start){end+=24;}var r=cfg["dayBandDiameter"]/2,w=cfg["dayBandWidth"],raw=view.rgb(cfg["dayBandColor"]),opacity=cfg["dayBandOpacity"],c=0;
        for(var ci=0;ci<3;ci++){var shift=ci*8;c+=(((raw>>shift)&255)*opacity+((0x34383e>>shift)&255)*(1-opacity)).toNumber()<<shift;}
        if(cfg["dayBandStyle"].equals("solid")){view.band(dc,r,start,end,w,c,false);return;}
        var step=Bounds.max(15,cfg["dayBandMinutes"].toNumber())/60.0,gap=Bounds.max(0.1,Bounds.min(0.7,cfg["dayBandGap"]/100.0));
        for(var h=Math.floor(start/step)*step;h<end;h+=step){
            var a=Bounds.max(start,h+step*gap/2),b=Bounds.min(end,h+step-step*gap/2),mid=h+step/2;
            if(b<=a){continue;}
            if(cfg["dayBandStyle"].equals("dotted")){if(mid<start||mid>end){continue;}var p=view.point(r,view.hourAngle(mid));view.color(dc,c);dc.fillCircle(p[0],p[1],Bounds.min(w/2,2*Math.PI*r*step/24*0.4));}
            else{var trim=cfg["dayBandStyle"].equals("dashed")?Bounds.min((b-a)*0.2,w/2/(r*Math.PI/12)):0;view.band(dc,r,a+trim,b-trim,w,c,cfg["dayBandStyle"].equals("dashed"));}
        }
    }
    function drawLunar(dc){
        if(!cfg["lunarRing"]||!cfg["autoSky"]){return;}
        var r=cfg["moonMatchDay"]?cfg["dayBandDiameter"]/2:cfg["lunarRadius"],c=view.blend(view.rgb(cfg["lunarColor"]),cfg["moonOpacity"]);
        for(var li=0;li<lunar.size();li++){var pair=lunar[li];view.band(dc,r,pair[0],pair[1],cfg["lunarWidth"],c,true);}
        for(var ei=0;ei<lunarEvents.size();ei++){var e=lunarEvents[ei],a=view.hourAngle(e[0]),p=view.point(r,a),q=view.point(r-8,a);view.line(dc,p[0],p[1],q[0],q[1],c,2);view.color(dc,e[1]?c:view.bg());dc.fillCircle(p[0],p[1],2.5);view.color(dc,c);dc.drawCircle(p[0],p[1],2.5);}
    }
    function draw(dc,hour,minute){
        if(!cfg["moonOnTop"]){drawLunar(dc);}
        if(cfg["solarRing"]&&solar[0]!=null&&solar[1]!=null&&solar[2]!=null&&solar[3]!=null){
            var r=cfg["dayBandDiameter"]/2;
            view.band(dc,r,0,24,7,0x34383e,false);view.band(dc,r,solar[0],solar[1],7,view.rgb(cfg["dawnColor"]),false);
            dayBand(dc,solar[1],solar[2]);view.band(dc,r,solar[2],solar[3],7,view.rgb(cfg["duskColor"]),false);
            for(var i=1;i<=2;i++){var c=view.rgb(cfg[i==1?"sunriseColor":"sunsetColor"]),dt=cfg["golden"]/60.0;if(dt>0){view.band(dc,r,solar[i]-dt,solar[i]+dt,7,c,false);}var a=view.hourAngle(solar[i]),p=view.point(r,a),q=view.point(r-9,a);view.line(dc,p[0],p[1],q[0],q[1],c,3);}
            var step=cfg.hasKey("scaleStep")?cfg["scaleStep"]:1;
            for(var h=0;h<24;h+=step){var p=view.point(cfg["scaleDiameter"]/2,view.hourAngle(h));view.timeText(dc,h.format("%02d"),p[0],p[1],"scale",view.rgb(cfg["scaleColor"]),0);}
            if(cfg["solarPointer"]){view.pointer(dc,(hour+minute/60.0-(cfg["solarTop"].equals("noon")?12:0))*15,cfg["solarPointerDiameter"]/2,cfg["solarPointerSize"],cfg["solarPointerShape"],view.rgb(cfg["solarPointerColor"]),cfg["solarPointerDirection"].equals("in"));}
        }
        if(cfg["moonOnTop"]){drawLunar(dc);}
        if(cfg["autoSky"]){marker(dc,false);marker(dc,true);}
    }
    function marker(dc,moon){
        var key=moon?"moon":"sun";if(!cfg[moon?"moonMarker":"sunMarker"]){return;}
        if(!RuntimeProfile.preview&&view.availableHeading()&&view.heading==null){return;}
        var heading=view.heading==null?0:view.heading,a=Orientation.angle(current[moon?1:0][0],heading);
        var p=view.point(cfg["markerSettings"][key+"Radius"],a),offset=cfg["markerOffsets"][key],r=cfg["markerSettings"][key+"Size"]/2.0,c=moon?0x8cbcff:0xf3df5a;
        if(offset!=null){p[0]+=offset["x"];p[1]+=offset["y"];}
        view.color(dc,c);if(!moon){dc.fillCircle(p[0],p[1],r);return;}
        dc.setPenWidth(1.5);dc.drawCircle(p[0],p[1],r);dc.setPenWidth(1);
        if(current[1][1]<=0.133){return;}view.color(dc,0x07090b);dc.fillCircle(p[0],p[1],r-0.5);
        var phase=current[2],wax=phase<0.5,cos=Math.cos(phase*2*Math.PI),points=[];
        for(var i=0;i<=24;i++){var theta=-Math.PI/2+i*Math.PI/24;points.add([p[0]+(wax?1:-1)*Math.cos(theta)*(r-1),p[1]+Math.sin(theta)*(r-1)]);}
        for(var i=24;i>=0;i--){var theta=-Math.PI/2+i*Math.PI/24;points.add([p[0]+(wax?1:-1)*cos*Math.cos(theta)*(r-1),p[1]+Math.sin(theta)*(r-1)]);}
        view.color(dc,c);dc.fillPolygon(points);
    }
}
