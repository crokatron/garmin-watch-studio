using Toybox.Test;
(:test) class RefreshTestData {
    var calls=0;
    function refresh(force){if(force){calls++;}}
}
(:test) function testRefreshHitAndSleep(logger){
    var view=new TacticalWatchView();
    view.cfg={"refreshControl"=>{"enabled"=>true,"x"=>227,"y"=>385,"width"=>164,"height"=>34}};
    view.data=new RefreshTestData();view.sky.skyDay=123;
    Test.assert(!view.refreshAt([227,227]));Test.assertEqual(view.data.calls,0);
    view.asleep=true;Test.assert(!view.refreshAt([227,385]));view.asleep=false;
    Test.assert(!view.refreshAt([120,385]));Test.assert(!view.refreshAt([334,385]));
    Test.assert(!view.refreshAt([227,343]));Test.assert(!view.refreshAt([227,427]));
    Test.assert(view.refreshAt([121,344]));Test.assertEqual(view.data.calls,1);Test.assertEqual(view.sky.skyDay,-1);
    Test.assert(view.refreshAt([333,426]));Test.assertEqual(view.data.calls,1);
    Test.assert(view.refreshAt([227,385]));Test.assertEqual(view.data.calls,1);
    view.cfg["refreshControl"]["enabled"]=false;Test.assert(!view.refreshAt([227,385]));return true;
}
