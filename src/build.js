// node build.js  → 產生 ../換裝派對.html（單檔、離線可用）
const fs=require('fs'),path=require('path');
const r=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const app=['data.js','face.js','character.js','room.js','street.js','house.js','sound.js','app.js'].map(r).join('\n');
fs.writeFileSync(path.join(__dirname,'_app.bundle.js'),app);
const fontCss=(()=>{try{return r('font.css')}catch(e){return ''}})();
const html=r('index.tpl.html').replace('/*FONT*/',()=>fontCss).replace('/*THREE*/',()=>r('three.min.js').replace(/<\/script/gi,'<\\/script')).replace('/*APP*/',()=>app.replace(/<\/script/gi,'<\\/script'));
fs.writeFileSync(path.join(__dirname,'..','歡樂派對.html'),html);
fs.writeFileSync(path.join(__dirname,'..','index.html'),html);
console.log('OK',(html.length/1024|0)+'KB');
