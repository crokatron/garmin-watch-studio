using Toybox.Math;
module Orientation {
    // True north is screen-up at heading 0; all bodies counter-rotate together.
    function angle(bearing,heading){return (bearing-heading-90)*Math.PI/180.0;}
}
(:test)
function testNorthAndSkyRotation(logger){
    for(var h=0;h<360;h+=90){
        var north=Orientation.angle(0,h),sun=Orientation.angle(125,h),moon=Orientation.angle(240,h);
        if(Bounds.abs((sun-north)*180/Math.PI-125)>0.001||Bounds.abs((moon-north)*180/Math.PI-240)>0.001){return false;}
    }
    return Math.cos(Orientation.angle(0,90)) < -0.999 && Math.sin(Orientation.angle(0,180)) > 0.999;
}
(:test)
function testHeadingMissingFrozenAndWake(logger){
    var d=new WatchData();
    if(d.acceptHeading(null,0)!=null||d.acceptHeading(0,10)!=null){return false;}
    var fresh=d.acceptHeading(Math.PI/2,1010);if(fresh==null||Bounds.abs(fresh-90)>0.01){return false;}
    if(d.acceptHeading(Math.PI/2,17000)!=null){return false;}
    d.acceptHeading(Math.PI,18000);d.resetHeading();
    return d.acceptHeading(Math.PI,19000)==null && d.acceptHeading(null,20000)==null;
}
(:test)
function testSkyChangesWithTime(logger){
    var a=Sky.position(1789970918,25.2048,55.2708),b=Sky.position(1789972718,25.2048,55.2708);
    logger.debug("Sun azimuth "+a[0][0]+" -> "+b[0][0]+"; Moon "+a[1][0]+" -> "+b[1][0]);
    return Bounds.abs(a[0][0]-b[0][0])>1 && Bounds.abs(a[1][0]-b[1][0])>1 && a[2]>=0 && a[2]<=1;
}
