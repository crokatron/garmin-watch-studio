using Toybox.Test;
using Toybox.Application;
(:test) function testFixtureDatesAndRollover(logger){
    Test.assertEqual(FixtureSync.utc("2026-09-29T00:00:00Z"),1790640000);
    Test.assertEqual(FixtureSync.utc("2026-09-29T00:00:00"),1790640000);
    Test.assert(FixtureSync.utc("2026-09-29")==null);
    Test.assert(FixtureSync.utc("2026-09-29T00:00:00+04:00")==null);
    Test.assert(FixtureSync.utc("2026-02-30T00:00:00Z")==null);
    var rows=[[100,"OLD"],[300,"LATER"],[200,"NEXT"]];
    Test.assertEqual(FixtureSync.next(rows,100)[1],"NEXT");
    Test.assertEqual(FixtureSync.next(rows,200)[1],"LATER");
    Test.assert(FixtureSync.next(rows,300)==null);return true;
}
(:test) function testFixtureParsing(logger){
    var race={"Circuit"=>{"Location"=>{"country"=>"Singapore"}},"date"=>"2026-10-11","time"=>"12:00:00Z","Qualifying"=>{"date"=>"2026-10-10","time"=>"13:00:00Z"},"Sprint"=>{"date"=>"2026-10-10"}};
    var f1=FixtureSync.f1({"MRData"=>{"RaceTable"=>{"Races"=>[race]}}});
    Test.assertEqual(f1.size(),2);Test.assertEqual(f1[0][1],"SIN Q");
    Test.assert(FixtureSync.f1({"error"=>"down"})==null);
    var match={"utcDate"=>"2026-11-07T11:40:00","teams"=>[{"teamId"=>FixtureSync.TEAM,"name"=>"Springboks"},{"teamId"=>"other","name"=>"Italy"}]};
    Test.assertEqual(FixtureSync.rugby({"items"=>[match]})[0][1],"ITA");
    match["isCancelled"]=true;Test.assertEqual(FixtureSync.rugby({"items"=>[match]}).size(),0);
    Test.assert(FixtureSync.rugby(null)==null);return true;
}
(:test) function testFixtureCachePreservesGoodData(logger){
    var key="fixtures-v1-test",old=Application.Storage.getValue(key);
    FixtureSync.save("test",[[2000000000,"FUTURE"]],200);
    FixtureSync.save("test",null,503);
    Test.assertEqual(FixtureSync.cached("test")["events"][0][1],"FUTURE");
    FixtureSync.save("test",null,200);Test.assertEqual(FixtureSync.cached("test")["code"],-2);
    FixtureSync.save("test",[],200);Test.assertEqual(FixtureSync.cached("test")["events"].size(),0);
    if(old==null){Application.Storage.deleteValue(key);}else{Application.Storage.setValue(key,old);}return true;
}
