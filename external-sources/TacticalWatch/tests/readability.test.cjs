const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {dependency}=require('../tools/dependencies.cjs');
const {validate}=require('../tools/generate.cjs');
const root=path.resolve(__dirname,'..');
test('readability controls change preview and saved design independently',async()=>{
 const {chromium}=dependency('playwright');
 const executablePath=process.env.WATCH_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',chromium.executablePath()].find(fs.existsSync);
 const browser=await chromium.launch({executablePath,headless:true});
 try{const page=await browser.newPage();
  await page.goto(pathToFileURL(path.join(root,'Review-Readability.html')).href);await page.waitForSelector('#readDate');
  const result=await page.evaluate(()=>{
   const date=d.fields.find(f=>f.source==='Date'),hr=d.fields.find(f=>f.source==='Heart rate');
   const numeric=fieldVisual(date).text,heart=fieldVisual(hr).text;
   $('readNight').value='#aaff00';$('readNight').dispatchEvent(new Event('input'));
   $('showNight').click();const night=effectiveMode(),nightFill=$('face').querySelector('[data-id] text')?.getAttribute('fill');
   $('showDay').click();const day=effectiveMode();
   selected=hr.id;multiSelected.clear();$('centreX').click();const centred=d.fields.find(f=>f.id===hr.id).x;
   $('showAod').click();const aod=$('face').textContent;
   return {numeric,heart,night,day,nightFill,centred,aod,accent:d.accent,lume:d.lume,link:d.linkModes,ids:d.aodFieldIds};
  });
  assert.equal(result.numeric,'21/09/2026');assert.equal(result.heart,'68');assert.equal(result.night,'night');assert.equal(result.day,'day');assert.equal(result.nightFill,'#aaff00');assert.equal(result.centred,227);assert.equal(result.link,false);assert.notEqual(result.accent,result.lume);assert.match(result.aod,/HUM 65%/);assert.match(result.aod,/UV 7/);assert.equal(result.ids.length,5);
 }finally{await browser.close();}
});
test('invalid AOD field selections and date formats are rejected',()=>{
 const d=JSON.parse(fs.readFileSync(path.join(root,'design/readability-draft.json')));
 validate(d);assert.throws(()=>validate({...d,aodFieldIds:['missing']}));assert.throws(()=>validate({...d,aodFieldIds:[d.fields[0].id,d.fields[0].id]}));assert.throws(()=>validate({...d,dateFormat:'invalid'}));
});
