const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../studio/interaction-model.js'),{validate}=require('../tools/generate.cjs');
const baseline=require('../design/approved-layout.json');
test('native build refuses to silently discard Studio 2 interactions',()=>{
  assert.throws(()=>validate({...baseline,studio2:M.defaults()}),/interaction preview/);
  assert.doesNotThrow(()=>validate(baseline));
});
test('solar timeline crosses midnight, has no false night sun and handles missing events',()=>{
  const d={dawn:'05:00',sunrise:'06:00',sunset:'18:00',dusk:'19:00',golden:30};
  let s=M.solar(d,12);assert.equal(s.valid,true);assert.equal(s.position,.5);assert.equal(s.active,true);
  assert.deepEqual(s.segments.map(x=>[x.start,x.end]),[['05:00','05:30'],['05:30','06:30'],['06:30','17:30'],['17:30','18:30'],['18:30','19:00']]);
  assert.equal(M.solar(d,22).active,false);assert.equal(M.solar(d,3).active,false);
  s=M.solar({...d,dawn:'22:00',sunrise:'23:00',sunset:'04:00',dusk:'05:00'},2);assert.equal(s.valid,true);assert.equal(s.active,true);
  assert.equal(M.solar({...d,autoSky:true,skyNoEvents:true},12).valid,false);
  assert.equal(M.solar({...d,sunrise:'garbage'},12).valid,false);
  assert.equal(M.solar({...d,dusk:'05:00'},12).valid,false);
});
test('hold geometry includes padding and rotates with the visual; ellipses exclude corners',()=>{
  const c=M.defaults().controls[0];Object.assign(c,{x:227,y:227,width:20,height:20,padding:20,targetWidth:20,targetHeight:20,rotation:45});
  assert.equal(M.geometry(c).width,60);assert.equal(M.hit(c,252,227),true);assert.equal(M.hit(c,260,260),false);
  c.rotation=0;c.targetShape='ellipse';assert.equal(M.hit(c,252,252),false);assert.equal(M.hit(c,253,227),true);
  const r=M.defaults().ribbon,p=M.polar(r.cx,r.cy,r.radius,r.center);assert.equal(M.ribbonHit(r,p.x,p.y),true);assert.equal(M.ribbonHit(r,227,227),false);
});
test('invalid imports and fake Wallet routes cannot enable a launcher',()=>{
  const s=M.defaults();assert.doesNotThrow(()=>M.validate(s));s.controls[0].targetWidth=-1;assert.throws(()=>M.validate(s));
  assert.equal(M.action({source:'wallet',action:'notifications'}).available,false);
  assert.equal(M.action({source:'notifications',action:'wallet'}).available,false);
});
