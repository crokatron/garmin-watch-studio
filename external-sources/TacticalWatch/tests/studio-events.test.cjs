const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../studio/event-model.js');
const snapshot=require('../design/verified-events.json');
test('verified next events and Dubai conversion',()=>{
 const now=Date.parse('2026-09-29T18:00:00Z');
 assert.equal(E.text({eventSchedule:snapshot.f1},now,4),'MAL FP1 02/10 08:30');
 assert.equal(E.text({eventSchedule:snapshot.rugby},now,4),'ITA 07/11 15:40');
 assert.equal(E.text({eventSchedule:snapshot.rugby},Date.parse('2026-11-07T11:40:00Z'),4),'FRA 14/11 00:10');
});
test('expired single fixtures, cancellations and missing times cannot masquerade as upcoming',()=>{
 const old={title:'AUS',date:'2026-09-27T09:45',utcOffset:0};
 const now=Date.parse('2026-09-29T18:00:00Z');
 assert.equal(E.text({eventPreview:old},now,4),'UPDATE SCHEDULE');
 assert.equal(E.next({eventSchedule:[{...snapshot.f1[0],isCancelled:true},{...snapshot.f1[1],isPostponed:true},{...snapshot.f1[2],timeConfirmed:false}]},now),null);
 assert.equal(E.text({eventSchedule:snapshot.f1},Date.parse('2027-01-01T00:00:00Z'),4),'UPDATE SCHEDULE');
});
test('session rollover uses UTC, including the exact start boundary',()=>{
 const field={eventSchedule:[...snapshot.f1].reverse()};
 assert.equal(E.next(field,Date.parse('2026-10-02T04:29:59Z')).title,'MAL FP1');
 assert.equal(E.next(field,Date.parse('2026-10-02T04:30:00Z')).title,'MAL FP2');
 assert.equal(E.timestamp({date:'2026-10-02T12:30',utcOffset:8}),Date.parse('2026-10-02T04:30:00Z'));
});
