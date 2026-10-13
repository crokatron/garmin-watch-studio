/* Offline fixture snapshots. Never infer a live result from a scheduled start. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StudioEvents=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function timestamp(event,offset=0){
    if(!event?.date||event.timeConfirmed===false)return NaN;
    return Date.parse(event.date+'Z')-Number(event.utcOffset??offset)*3600000;
  }
  function next(field,now,offset=0){
    const rows=field.eventSchedule?.length?field.eventSchedule:field.eventPreview?[field.eventPreview]:[];
    return rows.filter(e=>!e.isCancelled&&!e.isPostponed&&timestamp(e,offset)>now).sort((a,b)=>timestamp(a,offset)-timestamp(b,offset))[0]||null;
  }
  function text(field,now,offset=0){
    const event=next(field,now,offset);if(!event)return 'UPDATE SCHEDULE';
    const stamp=timestamp(event,offset),at=new Date(stamp+offset*3600000),pad=n=>String(n).padStart(2,'0'),date=pad(at.getUTCDate())+'/'+pad(at.getUTCMonth()+1);
    if(field.eventMode!=='countdown')return event.title+' '+date+' '+pad(at.getUTCHours())+':'+pad(at.getUTCMinutes());
    const total=Math.ceil((stamp-now)/60000),days=Math.floor(total/1440),hours=Math.floor(total%1440/60),minutes=total%60;
    return event.title+' '+date+' · '+(days?days+'d '+hours+'h':hours?hours+'h '+minutes+'m':minutes+'m');
  }
  return {timestamp,next,text};
});
