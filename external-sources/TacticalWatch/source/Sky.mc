using Toybox.Math;
// Low-precision astronomy ported from the approved designer.
// Uses its explicit saved latitude/longitude; never assumes a live GPS fix.
module Sky {
    const R=0.0174532925199433;
    function horizontal(l,b,days,lat,lon) {
        var e=23.4397*R;
        var ra=Math.atan2(Math.sin(l)*Math.cos(e)-Math.tan(b)*Math.sin(e),Math.cos(l));
        var dec=Math.asin(Math.sin(b)*Math.cos(e)+Math.cos(b)*Math.sin(e)*Math.sin(l));
        var h=(280.16+360.9856235*days+lon)*R-ra;
        var p=lat*R;
        var az=Math.atan2(Math.sin(h),Math.cos(h)*Math.sin(p)-Math.tan(dec)*Math.cos(p))/R+540;
        return [az-Math.floor(az/360)*360,Math.asin(Math.sin(p)*Math.sin(dec)+Math.cos(p)*Math.cos(dec)*Math.cos(h))/R];
    }
    function position(epoch,lat,lon) {
        var days=epoch/86400.0d-10957.5d;
        var m=(357.5291+0.98560028*days)*R;
        var l=m+(1.9148*Math.sin(m)+0.02*Math.sin(2*m)+0.0003*Math.sin(3*m))*R+102.9372*R+Math.PI;
        var ml=(218.316+13.176396*days)*R+6.289*R*Math.sin((134.963+13.064993*days)*R);
        var mb=5.128*R*Math.sin((93.272+13.229350*days)*R);
        var phase=(ml-l)/(2*Math.PI);
        return [horizontal(l,0,days,lat,lon),horizontal(ml,mb,days,lat,lon),phase-Math.floor(phase)];
    }
}
