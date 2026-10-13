using Toybox.Application;
using Toybox.WatchUi;
using Toybox.Background;
(:background)
class TacticalWatchApp extends Application.AppBase {
    function initialize() { AppBase.initialize(); }
    function getInitialView() {
        if(!RuntimeProfile.preview&&Background.getTemporalEventRegisteredTime()==null){FixtureSync.queue();}
        var view=new TacticalWatchView();return [view,new RefreshDelegate(view)];
    }
    function getServiceDelegate(){return [new FixtureService()];}
    function onBackgroundData(data){WatchUi.requestUpdate();}
}
class RefreshDelegate extends WatchUi.WatchFaceDelegate {
    var view;
    function initialize(v){WatchFaceDelegate.initialize();view=v;}
    function onPress(event){return view.refreshAt(event.getCoordinates());}
}
