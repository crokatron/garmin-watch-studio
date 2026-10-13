using Toybox.Graphics;
using Toybox.WatchUi;
using Toybox.Math;

// Handwritten renderer for generated glyph atlases; untouched by regeneration.
class DesignGraphics {
    var images={};
    var currentFont=-1;
    var table;
    function initialize() {}
    function bitmap(resource) {
        if(!images.hasKey(resource)){images[resource]=WatchUi.loadResource(resource);}
        return images[resource];
    }
    function glyph(font,char) {
        if(currentFont!=font){table=null;table=WatchUi.loadResource(ApprovedLayout.glyphs[font]);currentFont=font;}
        var key=char.toCharArray()[0].toNumber().toString();
        return table.hasKey(key)?table[key]:table["63"];
    }
    function width(font,value) {
        var total=0.0;
        var chars=value.toCharArray();for(var i=0;i<chars.size();i++){var g=glyph(font,chars[i].toString());if(g!=null){total+=g[6];}}
        return total;
    }
    function image(dc,resource,x,y,angle,factor,ox,oy,tint) {
        var transform=new Graphics.AffineTransform();
        transform.translate(x.toFloat(),y.toFloat());transform.rotate(angle.toFloat());
        transform.scale(factor.toFloat(),factor.toFloat());transform.translate(ox.toFloat(),oy.toFloat());
        var options={:transform=>transform,:filterMode=>Graphics.FILTER_MODE_BILINEAR};
        if(tint!=null){options[:tintColor]=tint;}
        dc.drawBitmap2(0,0,bitmap(resource),options);
    }
    function letter(dc,font,char,x,y,angle,color) {
        var g=glyph(font,char);if(g==null){return;}
        var transform=new Graphics.AffineTransform();
        transform.translate(x.toFloat(),y.toFloat());transform.rotate(angle.toFloat());
        transform.translate((g[4]-g[0]).toFloat(),(g[5]-g[1]).toFloat());
        dc.drawBitmap2(0,0,bitmap(ApprovedLayout.fontImages[font]),{
            :bitmapX=>g[0],:bitmapY=>g[1],:bitmapWidth=>g[2],:bitmapHeight=>g[3],
            :tintColor=>color,:filterMode=>Graphics.FILTER_MODE_BILINEAR,:transform=>transform});
    }
    // align: -1 left, 0 center, 1 right. Rotation is clockwise, in radians.
    function text(dc,font,value,x,y,color,align,angle) {
        var advance=align<0?0:align>0?-width(font,value):-width(font,value)/2;
        var chars=value.toCharArray();for(var i=0;i<chars.size();i++){
            var char=chars[i].toString(),g=glyph(font,char);if(g==null){continue;}
            letter(dc,font,char,x+advance*Math.cos(angle),y+advance*Math.sin(angle),angle,color);advance+=g[6];
        }
    }
    function radial(dc,font,value,radius,angle,reverse,color) {
        var advance=-width(font,value)/2,dir=reverse?-1:1;
        var chars=value.toCharArray();for(var i=0;i<chars.size();i++){
            var char=chars[i].toString(),g=glyph(font,char);if(g==null){continue;}
            var a=angle+dir*(advance+g[6]/2)/radius,rotation=a+dir*Math.PI/2;
            var x=227+radius*Math.cos(a)-g[6]/2*Math.cos(rotation),y=227+radius*Math.sin(a)-g[6]/2*Math.sin(rotation);
            letter(dc,font,char,x,y,rotation,color);advance+=g[6];
        }
    }
}
