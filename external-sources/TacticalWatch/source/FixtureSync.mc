using Toybox.Application;
using Toybox.Background;
using Toybox.Communications;
using Toybox.Lang;
using Toybox.System;
using Toybox.Time;
using Toybox.Time.Gregorian;

(:background)
module FixtureSync {
    const TEAM="e976cfc2-f80b-4c1a-8472-838cd54f0fbc";
    function queue() {
        try {
            var at=Time.now().value()+5,last=Background.getLastTemporalEventTime();
            if(last!=null&&at<last.value()+300){at=last.value()+300;}
            Background.registerForTemporalEvent(new Time.Moment(at));return true;
        }catch(e){return false;}
    }
    function cached(feed){return Application.Storage.getValue("fixtures-v1-"+feed);}
    function save(feed,rows,code){
        if(rows==null&&code==200){code=-2;} // Invalid JSON/schema is a failed refresh.
        var previous=cached(feed);
        if(rows!=null){previous={"events"=>rows,"updated"=>Time.now().value()};}
        if(previous==null){previous={"events"=>[],"updated"=>0};}
        previous["code"]=code;
        Application.Storage.setValue("fixtures-v1-"+feed,previous);
    }
    // Both feeds publish UTC. Refuse absent/offset dates rather than inventing a time.
    function utc(s){
        if(!(s instanceof Lang.String)||s.length()<19){return null;}
        if(s.length()>19&&!s.substring(19,s.length()).equals("Z")){return null;}
        if(!s.substring(4,5).equals("-")||!s.substring(7,8).equals("-")||!s.substring(10,11).equals("T")||!s.substring(13,14).equals(":")||!s.substring(16,17).equals(":")){return null;}
        for(var digit=0;digit<19;digit++){
            if(digit==4||digit==7||digit==10||digit==13||digit==16){continue;}
            if("0123456789".find(s.substring(digit,digit+1))==null){return null;}
        }
        try {
            var y=s.substring(0,4).toNumber(),m=s.substring(5,7).toNumber(),d=s.substring(8,10).toNumber(),h=s.substring(11,13).toNumber(),n=s.substring(14,16).toNumber(),sec=s.substring(17,19).toNumber();
            if(y<2020||y>2037||m<1||m>12||d<1||d>31||h<0||h>23||n<0||n>59||sec<0||sec>59){return null;}
            var days=[31,(y%4==0&&(y%100!=0||y%400==0))?29:28,31,30,31,30,31,31,30,31,30,31];
            if(d>days[m-1]){return null;}
            var result=Gregorian.moment({:year=>y,:month=>m,:day=>d,:hour=>h,:minute=>n,:second=>sec});
            var check=Gregorian.utcInfo(result,Time.FORMAT_SHORT);
            if(check.year!=y||check.month!=m||check.day!=d){return null;}
            return result.value();
        }catch(e){return null;}
    }
    function shortName(s){
        var names={"South Africa"=>"RSA","New Zealand"=>"NZL","Australia"=>"AUS","Argentina"=>"ARG","Italy"=>"ITA","France"=>"FRA","Ireland"=>"IRE","England"=>"ENG","Scotland"=>"SCO","Wales"=>"WAL"};
        if(names.hasKey(s)){return names[s];}
        s=s.toUpper();return s.length()>3?s.substring(0,3):s;
    }
    function f1(data){
        try {
            var races=data["MRData"]["RaceTable"]["Races"],rows=[];
            if(!(races instanceof Lang.Array)){return null;}
            for(var i=0;i<races.size()&&i<2;i++){
                var r=races[i],title=shortName(r["Circuit"]["Location"]["country"]);
                var keys=["FirstPractice","SecondPractice","ThirdPractice","SprintQualifying","Sprint","Qualifying","Race"],labels=["FP1","FP2","FP3","SQ","S","Q","R"];
                for(var j=0;j<keys.size();j++){
                    var session=j==6?r:r[keys[j]];
                    if(session==null||session["date"]==null||session["time"]==null){continue;}
                    var stamp=utc(session["date"]+"T"+session["time"]);
                    if(stamp==null){return null;}
                    rows.add([stamp,title+" "+labels[j]]);
                }
            }
            return races.size()>0&&rows.size()==0?null:rows;
        }catch(e){return null;}
    }
    function rugby(data){
        try {
            var items=data["items"],rows=[];
            if(!(items instanceof Lang.Array)){return null;}
            for(var i=0;i<items.size()&&i<6;i++){
                var match=items[i];
                if(match["isCancelled"]==true||match["isPostponed"]==true){continue;}
                var teams=match["teams"],ours=false,opponent=null;
                for(var j=0;j<teams.size();j++){
                    if(teams[j]["teamId"].equals(TEAM)){ours=true;}else{opponent=teams[j]["name"];}
                }
                if(!ours||opponent==null){continue;}
                var stamp=utc(match["utcDate"]);if(stamp==null){return null;}
                rows.add([stamp,shortName(opponent)]);
            }
            return rows;
        }catch(e){return null;}
    }
    function next(rows,now){
        var result=null;
        for(var i=0;i<rows.size();i++){var r=rows[i];if(r[0]>now&&(result==null||r[0]<result[0])){result=r;}}
        return result;
    }
}

(:background)
class FixtureService extends System.ServiceDelegate {
    function initialize(){ServiceDelegate.initialize();}
    function onTemporalEvent(){
        // Register before networking: a dropped connection must not stop future updates.
        Background.registerForTemporalEvent(new Time.Duration(3600));
        try {Communications.makeWebRequest("https://api.jolpi.ca/ergast/f1/current/next/",null,{:responseType=>Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON},method(:onF1));}
        catch(e){FixtureSync.save("f1",null,-1);requestRugby();}
    }
    function onF1(code,data){
        var rows=code==200?FixtureSync.f1(data):null;
        if(rows!=null&&rows.size()==0){
            var year=Gregorian.utcInfo(Time.now(),Time.FORMAT_SHORT).year+1;
            try {Communications.makeWebRequest("https://api.jolpi.ca/ergast/f1/"+year.toString()+"/1/",null,{:responseType=>Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON},method(:onNextSeason));return;}
            catch(e){FixtureSync.save("f1",null,-1);requestRugby();return;}
        }
        FixtureSync.save("f1",rows,code);requestRugby();
    }
    function onNextSeason(code,data){FixtureSync.save("f1",code==200?FixtureSync.f1(data):null,code);requestRugby();}
    function requestRugby(){
        var date=Gregorian.utcInfo(Time.now(),Time.FORMAT_SHORT);
        var start=date.year.toString()+"-"+date.month.format("%02d")+"-"+date.day.format("%02d");
        var params={"startDate"=>start,"endDate"=>(date.year+1).toString()+"-12-31T23:59:59","pageIndex"=>0,"pageSize"=>6,"IsAscending"=>"true","teamOneId"=>FixtureSync.TEAM};
        try {Communications.makeWebRequest("https://springboks.rugby/api/match-centre/matches",params,{:responseType=>Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON},method(:onRugby));}
        catch(e){FixtureSync.save("rugby",null,-1);Background.exit(true);}
    }
    function onRugby(code,data){FixtureSync.save("rugby",code==200?FixtureSync.rugby(data):null,code);Background.exit(true);}
}
