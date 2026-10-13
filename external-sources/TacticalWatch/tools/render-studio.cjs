// Render studio references only; does not generate native resources or run Garmin.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {dependency}=require('./dependencies.cjs');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'.test-output/studio-review');fs.mkdirSync(out,{recursive:true});
 const {chromium}=dependency('playwright'),executablePath=process.env.WATCH_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',chromium.executablePath()].find(fs.existsSync);
 const browser=await chromium.launch({executablePath,headless:true});
 try{const page=await browser.newPage({viewport:{width:1600,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
  await page.goto(pathToFileURL(path.join(root,'Review-Readability.html')).href);await page.waitForSelector('#aodAdd',{state:'attached'});await page.evaluate(()=>document.fonts.ready);
  for(const mode of ['day','night','aod']){
   await page.evaluate(m=>{document.getElementById({day:'showDay',night:'showNight',aod:'showAod'}[m]).click();render(true);},mode);
   await page.locator('#face').screenshot({path:path.join(out,mode+'.png')});
  }
  if(errors.length)throw Error(errors.join('\n'));
  console.log('Studio reference images saved to '+out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
