const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {dependency}=require('../tools/dependencies.cjs');
test('AOD add, remove, position and drag are independent of normal fields and survive reload',async()=>{
 const root=path.resolve(__dirname,'..'),{chromium}=dependency('playwright');
 const executablePath=process.env.WATCH_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',chromium.executablePath()].find(fs.existsSync);
 const browser=await chromium.launch({executablePath,headless:true});
 try{const page=await browser.newPage({viewport:{width:1600,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'Review-Readability.html')).href);await page.waitForSelector('#aodAdd',{state:'attached'});
  const before=await page.evaluate(()=>JSON.stringify(d.fields.map(f=>[f.id,f.x,f.y])));
  const initialCount=await page.evaluate(()=>d.aodLayout.fields.length);
  await page.click('[data-tab="AOD"]');await page.selectOption('#aodAddSource','Heart rate');await page.click('#aodAdd');
  const id=await page.evaluate(()=>d.aodLayout.fields.at(-1).id);
  assert.equal(await page.evaluate(()=>d.aodLayout.fields.length),initialCount+1);
  await page.locator(`input[data-aod-id="${id}"][data-aod-key="x"]`).fill('180');await page.locator(`input[data-aod-id="${id}"][data-aod-key="x"]`).press('Tab');
  assert.equal(await page.evaluate(id=>d.aodLayout.fields.find(f=>f.id===id).x,id),180);
  const target=page.locator(`[data-aod-item="${id}"]`);await target.scrollIntoViewIfNeeded();const box=await target.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+30,box.y+box.height/2-20,{steps:3});await page.mouse.up();
  assert((await page.evaluate(id=>d.aodLayout.fields.find(f=>f.id===id).x,id))>180);
  assert.equal(await page.evaluate(()=>JSON.stringify(d.fields.map(f=>[f.id,f.x,f.y]))),before);
  const exported=await page.evaluate(()=>JSON.stringify(d));await page.reload();await page.evaluate(json=>{d=JSON.parse(json);sync();},exported);await page.click('[data-tab="AOD"]');
  assert.equal(await page.locator(`[data-aod-item="${id}"]`).count(),1);
  await page.locator(`[data-aod-remove="${id}"]`).click();assert.equal(await page.locator(`[data-aod-item="${id}"]`).count(),0);
  assert.equal(await page.evaluate(()=>d.aodFieldIds.length),initialCount);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
