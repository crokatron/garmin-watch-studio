const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),file=path.join(root,'Watch-Face-Designer.html');
const start='<!-- BEGIN NATIVE WATCH OPTIONS -->',end='<!-- END NATIVE WATCH OPTIONS -->';
let html=fs.readFileSync(file,'utf8');
const backup=path.join(root,'.local-backup/before-readability');fs.mkdirSync(backup,{recursive:true});
if(!fs.existsSync(path.join(backup,'Watch-Face-Designer.html')))fs.writeFileSync(path.join(backup,'Watch-Face-Designer.html'),html);
if(html.includes(start)){const a=html.indexOf(start),b=html.indexOf(end,a);if(b<0)throw Error('Incomplete extension marker');html=html.slice(0,a)+html.slice(b+end.length);}
const script=fs.readFileSync(path.join(__dirname,'editor-watch-options.js'),'utf8');
if(script.includes('</script>'))throw Error('Unsafe embedded script');
html=html.replace('</html>',start+'<script>\n'+script+'\n</script>'+end+'</html>');
fs.writeFileSync(file,html);
console.log('Preserved original editor and embedded additive offline watch controls.');
