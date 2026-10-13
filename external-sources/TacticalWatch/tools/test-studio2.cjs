const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('./dependencies.cjs').dependency('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.test-output/studio2');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[],requests=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await p.clock.install({time:new Date()});await p.goto(pathToFileURL(path.join(root,'Watch-Face-Studio.html')).href);await p.evaluate(()=>document.fonts.ready);
  const original=await p.evaluate(()=>studioDraft());assert(original.studio2?.enabled);
  assert.equal(await p.locator('[data-feature=scale24]').count(),0);assert.equal(await p.locator('[data-solar-segment]').count(),5);assert.equal(await p.locator('[data-solar-endpoint]').count(),2);
  await p.locator('#sPanel').getByRole('button',{name:'Sleep Score',exact:true}).click();
  const set=async(label,value)=>{const n=p.locator('#sPanel').getByLabel(label,{exact:true});await n.fill(String(value));await n.press('Tab');};
  await set('Minimum target width',100);await set('Minimum target height',60);
  assert.equal(await p.locator('[data-hold-target=sleep]').getAttribute('width'),'100');
  await p.locator('#sPanel').getByLabel('Follow radius',{exact:true}).check();
  const holdPoint=async()=>p.evaluate(()=>{const c=studioDraft().studio2.controls.find(c=>c.id==='sleep'),g=Studio2Model.geometry(c),a=g.angle*Math.PI/180;const x=c.x+46*Math.cos(a),y=c.y+46*Math.sin(a);const p=new DOMPoint(x,y).matrixTransform(document.querySelector('#face').getScreenCTM());return {x:p.x,y:p.y};});
  await p.locator('#sTestHold').click();let pt=await holdPoint();
  await p.mouse.move(pt.x,pt.y);await p.mouse.down();await p.waitForTimeout(720);await p.mouse.up();
  assert.match(await p.locator('#sActionText').textContent(),/open Sleep Score/);
  await p.locator('#sCloseAction').click();
  await p.locator('#sPanel').getByLabel('Hold action',{exact:true}).selectOption('stress');
  pt=await holdPoint();await p.mouse.move(pt.x,pt.y);await p.mouse.down();await p.waitForTimeout(720);await p.mouse.up();assert.match(await p.locator('#sActionText').textContent(),/open Stress/);
  await p.locator('#sCloseAction').click();await p.evaluate(()=>window.studioLastAction=null);
  await p.mouse.move(pt.x,pt.y);await p.mouse.down();await p.mouse.move(pt.x+60,pt.y-60);await p.waitForTimeout(720);await p.mouse.up();assert.equal(await p.evaluate(()=>window.studioLastAction),null);
  await p.locator('#sTestHold').click();
  await p.evaluate(c=>studioApply(c),original);await p.evaluate(()=>studio2Select('sleep'));
  const center=await p.evaluate(()=>{const p=new DOMPoint(142,385).matrixTransform(document.querySelector('#face').getScreenCTM());return {x:p.x,y:p.y};});
  await p.mouse.move(center.x,center.y);await p.mouse.down();await p.mouse.move(center.x+20,center.y-20,{steps:5});await p.mouse.up();
  assert.notEqual((await p.evaluate(()=>studioDraft())).studio2.controls.find(c=>c.id==='sleep').x,142);
  await p.locator('#sUndo').click();assert.equal((await p.evaluate(()=>studioDraft())).studio2.controls.find(c=>c.id==='sleep').x,142);
  await p.locator('#sPanel').getByLabel('Night',{exact:true}).uncheck();
  await p.locator('[data-simple-mode=night]').click();assert.equal(await p.locator('[data-interactive=sleep]').count(),0);
  await p.locator('[data-simple-mode=day]').click();await p.evaluate(()=>studio2Select('sleep'));
  await p.locator('#sPanel').getByLabel('Always-on',{exact:true}).check();await p.locator('[data-simple-mode=aod]').click();assert.equal(await p.locator('[data-interactive=sleep]').count(),1);
  await p.evaluate(()=>studio2Select('sleep'));await p.locator('#sPanel').getByRole('button',{name:'Preview hold action'}).click();assert.match(await p.locator('#sActionText').textContent(),/inactive/);await p.locator('#sCloseAction').click();
  await p.locator('[data-simple-mode=day]').click();await p.evaluate(()=>studio2Select('health'));
  for(const source of ['hr','bodyBattery','stress','sleep','recovery','training']){await p.locator('#sPanel').getByLabel('Display source',{exact:true}).selectOption(source);assert.equal((await p.evaluate(()=>studioDraft())).studio2.controls.find(c=>c.id==='health').source,source);}
  await p.locator('#sPanel').getByLabel('Preview availability',{exact:true}).uncheck();assert.match(await p.locator('[data-interactive=health]').textContent(),/—/);
  await p.evaluate(()=>studio2Select('wallet'));assert.match(await p.locator('#sPanel').textContent(),/no documented Wallet/);assert.equal(await p.locator('[data-interactive=wallet]').count(),1);assert.equal(await p.locator('[data-interactive=wallet]').getAttribute('data-launch-disabled'),'true');await p.locator('#sPanel').getByRole('button',{name:'Why unavailable?',exact:true}).click();assert.equal(await p.evaluate(()=>studioLastAction.available),false);await p.locator('#sCloseAction').click();
  await p.evaluate(c=>studioApply(c),original);await p.evaluate(()=>studio2Select('ribbon'));await set('Thickness (px)',5);await set('Arc span (°)',130);
  assert.equal(await p.locator('[data-solar-segment]').first().getAttribute('stroke-width'),'5');
  assert.equal(await p.locator('[data-solar-reference]').count(),4);assert.match(await p.locator('[data-solar-reference=sunrise]').textContent(),/RISE/);assert.match(await p.locator('#sSolarSchedule').textContent(),/Morning golden hour/);await p.locator('#sPreviewTime').fill('23:00');await p.locator('#sPreviewTime').press('Tab');assert.equal(await p.locator('[data-current-sun]').count(),0);assert.equal(await p.locator('[data-next-dawn]').count(),1);
  await p.clock.setSystemTime(new Date('2026-12-31T19:59:59Z'));await p.locator('#sUseNow').click();assert.equal(await p.locator('#sUseNow').textContent(),'Pause clock');assert.equal(await p.locator('#sPreviewTime').inputValue(),'23:59');await p.clock.runFor(2100);assert.equal(await p.locator('#sPreviewTime').inputValue(),'00:00');assert.equal((await p.evaluate(()=>studioDraft())).previewYear,2027);assert.equal((await p.evaluate(()=>studioDraft())).previewDay,1);await p.locator('#sUseNow').click();assert.equal(await p.evaluate(()=>document.getElementById('live').checked),false);await p.locator('#sUseNow').click();await p.locator('#sPreviewTime').fill('10:08');assert.equal(await p.evaluate(()=>document.getElementById('live').checked),false);assert.equal(await p.locator('#sUseNow').textContent(),'Use current time');await p.clock.setSystemTime(new Date());const save=p.waitForEvent('download');await p.locator('#sSave').click();const download=await save;await download.saveAs(path.join(out,'roundtrip.json'));
  const saved=JSON.parse(fs.readFileSync(path.join(out,'roundtrip.json')));assert.equal(saved.studio2.ribbon.span,130);
  await p.evaluate(c=>studioApply(c),original);await p.locator('#sImport').setInputFiles(path.join(out,'roundtrip.json'));assert.equal((await p.evaluate(()=>studioDraft())).studio2.ribbon.span,130);
  await p.getByRole('button',{name:'Discard',exact:true}).click();assert.equal((await p.evaluate(()=>studioDraft())).studio2.ribbon.span,120);
  await p.locator('#sImport').setInputFiles(path.join(out,'roundtrip.json'));await p.getByRole('button',{name:'Keep changes',exact:true}).click();await p.reload();assert.equal((await p.evaluate(()=>studioDraft())).studio2.ribbon.span,130);
  await p.evaluate(c=>studioApply(c),original);await p.locator('#sPreviewTime').fill('10:08');await p.locator('#sPreviewTime').press('Tab');await p.locator('[data-page=fields]').click();
  await p.screenshot({path:path.join(out,'workspace.png')});
  await p.evaluate(()=>studio2Select('sleep'));await p.screenshot({path:path.join(out,'hold-target.png')});
  for(const mode of ['day','night','aod']){
    await p.locator(`[data-simple-mode=${mode}]`).click();await p.evaluate(()=>render(true));assert.equal(await p.locator('[data-hold-target]').count(),0);await p.locator('#face').screenshot({path:path.join(out,mode+'.png')});
  }
  await p.locator('[data-simple-mode=day]').click();await p.locator('[data-page=ai]').click();await p.locator('#sPanel textarea').fill('Make the solar ribbon 3 px thick.');await p.locator('[data-page=fields]').click();await p.locator('[data-page=ai]').click();assert.equal(await p.locator('#sPanel textarea').inputValue(),'Make the solar ribbon 3 px thick.');
  await p.setViewportSize({width:390,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
  assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
  console.log('PASS: offline operation; solar day/night; expanded rotated hold target; action selection; cancelled hold; drag/undo; source choices; mode visibility; AOD no-launch; visible Wallet never launches; solar boundary labels/timings; current clock and date rollover; save/import/discard/reload; clean renders; Ask AI draft; mobile fit.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
