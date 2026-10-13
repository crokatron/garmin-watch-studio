using Toybox.ActivityMonitor;
using Toybox.SensorHistory;
using Toybox.UserProfile;
using Toybox.Weather;
using Toybox.Time;
using Toybox.Time.Gregorian;
using Toybox.System;
using Toybox.Math;
using Toybox.Activity;
class WatchData {
    var values = {};
    var refreshed = -1;
    var lastHeading=null;
    var headingChangedAt=null;
    function initialize() {}
    function resetHeading(){headingChangedAt=null;}
    function heading(){
        // Passive API only: no sensor activation or hidden activity recording.
        // This is a diagnostic safeguard, not a sensor-provided freshness guarantee.
        try {
            return acceptHeading(Activity.getActivityInfo().currentHeading,System.getTimer());
        }catch(e){lastHeading=null;headingChangedAt=null;return null;}
    }
    function acceptHeading(r,tick){
        try {
            if(r==null||r!=r||Bounds.abs(r)>100){lastHeading=null;headingChangedAt=null;return null;}
            var degrees=r*180.0/Math.PI;degrees-=Math.floor(degrees/360)*360;

            if(lastHeading!=null&&Bounds.abs(degrees-lastHeading)>0.05){headingChangedAt=tick;}
            lastHeading=degrees;
            if(headingChangedAt==null||tick-headingChangedAt<0||tick-headingChangedAt>15000){return null;}
            return degrees;
        }catch(e){lastHeading=null;headingChangedAt=null;return null;}
    }
    function number(v) { return v == null ? "--" : Math.round(v).toNumber().toString(); }
    function sample(iterator, maxAge) {
        var s = iterator.next();
        if (s == null || s.data == null || s.data > 1000000 || s.data < -10000) { return null; }
        if (s has :when) { if (s.when != null && Time.now().value()-s.when.value()>maxAge) { return null; } }
        return s.data;
    }
    function refresh(force) {
        if(RuntimeProfile.preview){return;}
        var now = Time.now().value();
        if (!force && now-refreshed<60) { return; }
        refreshed=now;values={};
        try { values["hr"]=sample(SensorHistory.getHeartRateHistory({:period=>1}),600); } catch(e) {}
        try { if (SensorHistory has :getOxygenSaturationHistory) { values["spo2"]=sample(SensorHistory.getOxygenSaturationHistory({:period=>1}),86400); } } catch(e) {}
        try { values["altitude"]=sample(SensorHistory.getElevationHistory({:period=>1}),3600); } catch(e) {}
        try { var p=UserProfile.getProfile(); values["rhr"]=p.averageRestingHeartRate; } catch(e) {}
        try { var a=ActivityMonitor.getInfo(); values["steps"]=a.steps;values["goal"]=a.stepGoal;values["distance"]=a.distance;values["calories"]=a.calories;values["floors"]=a.floorsClimbed; } catch(e) {}
        try {
            var w=Weather.getCurrentConditions();
            if (w!=null && w.observationTime!=null && now-w.observationTime.value()<10800) {
                values["temp"]=w.temperature;values["hi"]=w.highTemperature;values["lo"]=w.lowTemperature;
                values["humidity"]=w.relativeHumidity;values["uv"]=w.uvIndex;values["feels"]=w.feelsLikeTemperature;
                values["wind"]=w.windSpeed;values["windBearing"]=w.windBearing;values["pop"]=w.precipitationChance;values["condition"]=w.condition;
            }
        } catch(e) {}
    }
    function fixture(id,source) {
        var next=null,mode="date";
        for(var ei=0;ei<ApprovedLayout.events.size();ei++) {var event=ApprovedLayout.events[ei];
            if(event[0].equals(id)){mode=event[3];}
            if (event[0].equals(id) && event[1]>Time.now().value() && (next==null || event[1]<next[1])) {next=event;}
        }
        if(!RuntimeProfile.preview){
            var feed=source.equals("Next F1 session")?"f1":"rugby",cache=FixtureSync.cached(feed);
            if(cache!=null&&cache["updated"]>0){
                var row=FixtureSync.next(cache["events"],Time.now().value());
                if(row!=null){next=[id,row[0],row[1],mode];}
                else{return Time.now().value()-cache["updated"]>7200||cache["code"]!=200?"SYNC NEEDED":"SCHEDULE TBD";}
            }
        }
        if(next==null){return "SYNC NEEDED";}
        if(next[3].equals("countdown")){
            var total=Math.ceil((next[1]-Time.now().value())/60.0).toNumber(),days=total/1440,hours=(total%1440)/60,minutes=total%60,t=Gregorian.info(new Time.Moment(next[1]),Time.FORMAT_SHORT);
            var remaining=days>0?days.toString()+"d "+hours.toString()+"h":hours>0?hours.toString()+"h "+minutes.toString()+"m":minutes.toString()+"m";
            return next[2]+" "+t.day.format("%02d")+"/"+t.month.format("%02d")+" · "+remaining;
        }
        var t=Gregorian.info(new Time.Moment(next[1]),Time.FORMAT_SHORT);
        return next[2]+" "+t.day.format("%02d")+"/"+t.month.format("%02d")+" "+t.hour.format("%02d")+":"+t.min.format("%02d");
    }
    function field(source) {
        if(source.equals("Heart rate")){return number(values["hr"])+(ApprovedLayout.config.hasKey("heartRateUnits")&&!ApprovedLayout.config["heartRateUnits"]?"":" bpm");}
        if(source.equals("Resting heart rate")){return "RHR "+number(values["rhr"]);}
        if(source.equals("Pulse Ox")){return number(values["spo2"])+"%";}
        if(source.equals("Respiration")){return "-- brpm";}
        if(source.equals("Altitude")){return number(values["altitude"])+" m";}
        if(source.equals("Air quality index")){return "AQI --";}
        if(source.equals("Weather + PoP")||source.equals("Weather condition")){
            var conditions=["CLEAR","PART CLOUD","MOST CLOUD","RAIN","SNOW","WINDY","STORMS","WINTRY","FOG","HAZY","HAIL","SHOWERS","STORMS","PRECIP","LT RAIN","HVY RAIN","LT SNOW","HVY SNOW","RAIN/SNOW","RAIN/SNOW","CLOUDY","RAIN/SNOW","PART CLEAR","MOST CLEAR","LT SHOWERS","SHOWERS","HVY SHOWERS","SHOWERS?","STORMS?","MIST","DUST","DRIZZLE","TORNADO","SMOKE","ICE","SAND","SQUALL","SANDSTORM","ASH","HAZE","FAIR","HURRICANE","TROP STORM","SNOW?","RAIN/SNOW?","RAIN?","SNOW?","RAIN/SNOW?","FLURRIES","FRZ RAIN","SLEET","ICE/SNOW","THIN CLOUD","--"];
            var condition=values["condition"];return condition==null||condition<0||condition>=conditions.size()?"WX --":conditions[condition];
        }
        if(source.equals("Temperature Hi/Lo + Current")){return number(values["temp"])+"°C / H "+number(values["hi"])+"° L "+number(values["lo"])+"°";}
        if(source.equals("Humidity")){return number(values["humidity"])+"%";}
        if(source.equals("Rain probability")){return number(values["pop"])+"%";}
        if(source.equals("Steps")){return number(values["steps"]);}
        if(source.equals("Step goal")){return number(values["goal"]);}
        if(source.equals("Distance")){return (values["distance"]==null?"--":(values["distance"]/100000.0).format("%.1f"))+" km";}
        if(source.equals("Total calories")){return number(values["calories"])+" kcal";}
        if(source.equals("Floors climbed")){return number(values["floors"]);}
        if(source.equals("Seconds")){return System.getClockTime().sec.format("%02d");}
        if(source.equals("Battery percentage")){return statusValue("iconBattery")+"%";}
        if(source.equals("Battery days remaining")){return statusValue("iconDays")+"d";}
        if(source.equals("Notifications")){return statusValue("iconNotifications");}
        if(source.equals("Bluetooth state")){return status("iconBluetooth")?"CONNECTED":"DISCONNECTED";}
        if(source.equals("Alarm state")){return status("iconAlarm")?"ALARM ON":"ALARM OFF";}
        if(source.equals("DND state")){var v=status("iconDnd");return v==null?"--":v?"DND ON":"DND OFF";}
        if(source.equals("UV index")){return "UV "+number(values["uv"]);}
        if(source.equals("Feels-like temperature")){return "FEELS "+number(values["feels"])+"°C";}
        if(source.equals("Wind speed / direction")){
            var dirs=["N","NE","E","SE","S","SW","W","NW"];
            var bearing=values["windBearing"];
            return (values["wind"]==null?"--":number(values["wind"]*3.6))+" km/h "+(bearing==null?"--":dirs[((bearing+22.5)/45).toNumber()%8]);
        }
        if(source.equals("Steps + Daily goal")){return number(values["steps"])+" / "+number(values["goal"]);}
        if(source.equals("Distance + Step progress")){
            var pct="--";if(values["steps"]!=null && values["goal"]!=null && values["goal"]>0){pct=number(values["steps"]*100.0/values["goal"]);}
            return (values["distance"]==null?"--":(values["distance"]/100000.0).format("%.1f"))+" km / "+pct+"%";
        }
        if(source.equals("UTC")){var u=Gregorian.utcInfo(Time.now(),Time.FORMAT_SHORT);return "UTC "+u.hour.format("%02d")+":"+u.min.format("%02d");}
        if(source.equals("Date")){var t=Gregorian.info(Time.now(),Time.FORMAT_SHORT);if(ApprovedLayout.config.hasKey("dateFormat")&&!ApprovedLayout.config["dateFormat"].equals("written")){var fmt=ApprovedLayout.config["dateFormat"],sep=fmt.equals("dmy-dot")?".":fmt.equals("dmy-dash")?"-":"/";return t.day.format("%02d")+sep+t.month.format("%02d")+sep+t.year.toString();}var days=["SUN","MON","TUE","WED","THU","FRI","SAT"];var months=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];return days[t.day_of_week-1]+" "+t.day.format("%02d")+" "+months[t.month-1];}
        return "--";
    }
    function fieldValue(f){
        var source=f["source"],value=source.find("Next ")==0?fixture(f["id"],source):field(source);
        if(ApprovedLayout.config["wheelchair"]&&(source.equals("Steps + Daily goal")||source.equals("Distance + Step progress"))){value="--";}
        if(f["displayMode"].equals("name")||f["displayMode"].equals("both")){value=f["name"]+" · "+value;}
        return value;
    }
    function status(key){
        if(RuntimeProfile.preview){
            var m=RuntimeProfile.marker;
            if(key.equals("iconBattery")||key.equals("iconDays")||key.equals("iconTrend")){return true;}
            if(key.equals("iconNotifications")){return m["notifications"]>0;}
            var mapping={"iconBluetooth"=>"bluetooth","iconAlarm"=>"alarm","iconDnd"=>"dnd"};
            if(mapping.hasKey(key)){return m[mapping[key]];}
            return RuntimeProfile.states[key]!=false;
        }
        var s=System.getDeviceSettings(),stats=System.getSystemStats();
        if(key.equals("iconBattery")){return true;}
        if(key.equals("iconDays")){return (stats has :batteryInDays)&&stats.batteryInDays!=null?true:null;}
        if(key.equals("iconNotifications")){return s.notificationCount>0;}
        if(key.equals("iconBluetooth")){return s.phoneConnected;}
        if(key.equals("iconAlarm")){return s.alarmCount>0;}
        if(key.equals("iconDnd")){return (s has :doNotDisturb)?s.doNotDisturb:null;}
        if(key.equals("iconCharging")){return (stats has :charging)?stats.charging:null;}
        if(key.equals("iconConnection")){return (s has :connectionAvailable)?s.connectionAvailable:null;}
        if(key.equals("iconWifi")||key.equals("iconLte")){
            if(!(s has :connectionInfo)){return null;}
            var connections=s.connectionInfo,kind=key.equals("iconWifi") ? :wifi : :lte;
            if(connections==null||!connections.hasKey(kind)){return null;}
            return connections[kind].state==System.CONNECTION_STATE_CONNECTED;
        }
        if(key.equals("iconTracking")){return (s has :activityTrackingOn)?s.activityTrackingOn:null;}
        if(key.equals("iconTones")){return (s has :tonesOn)?s.tonesOn:null;}
        if(key.equals("iconVibrate")){return (s has :vibrateOn)?s.vibrateOn:null;}
        if(key.equals("iconNight")){return (s has :isNightModeEnabled)?s.isNightModeEnabled:null;}
        if(key.equals("iconReadability")){return (s has :isEnhancedReadabilityModeEnabled)?s.isEnhancedReadabilityModeEnabled:null;}
        if(key.equals("iconGlances")){return (s has :isGlanceModeEnabled)?s.isGlanceModeEnabled:null;}
        return null; // Unknown is distinct from false. No preview-state fallback.
    }
    function statusValue(key){
        if(RuntimeProfile.preview){var m=RuntimeProfile.marker;if(key.equals("iconBattery")){return number(m["battery"]);}if(key.equals("iconDays")){return number(m["days"]);}if(key.equals("iconNotifications")){return number(m["notifications"]);}if(key.equals("iconAlarm")){return m["alarm"]?"1":"0";}return "";}
        var s=System.getDeviceSettings(),stats=System.getSystemStats();
        if(key.equals("iconBattery")){return number(stats.battery);}
        if(key.equals("iconDays")){return (stats has :batteryInDays)?number(stats.batteryInDays):"--";}
        if(key.equals("iconNotifications")){return number(s.notificationCount);}
        if(key.equals("iconAlarm")){return number(s.alarmCount);}
        return "";
    }
}
