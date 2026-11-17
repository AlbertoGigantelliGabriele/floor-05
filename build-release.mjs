// Content-addressed module URLs prevent a browser/CDN mixing old and new scene files.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,[new URL('prepare-souvenirs.mjs',import.meta.url).pathname],{stdio:'inherit'});
const root=new URL('./',import.meta.url),files={};
for(const source of ['souvenir-layout.js','layout.js','materials.js','packing.js','souvenir-placements.js','souvenirs.js','architecture.js','footsteps.js','engine.js']){
  let content=readFileSync(new URL(source,root),'utf8');
  for(const [dependency,built] of Object.entries(files)){
    const pattern=new RegExp("\\./"+dependency.replaceAll('.','\\.')+"(?:\\?[^'\"]*)?",'g');
    content=content.replace(pattern,'./'+built);
  }
  const hash=createHash('sha256').update(content).digest('hex').slice(0,12);
  const filename=source.replace('.js','.'+hash+'.js');
  writeFileSync(new URL(filename,root),content);files[source]=filename;
}
const index=new URL('index.html',root);
writeFileSync(index,readFileSync(index,'utf8').replace(/src="engine[^" ]*\.js(?:\?[^" ]*)?"/,`src="${files['engine.js']}"`));
writeFileSync(new URL('release.json',root),JSON.stringify(files,null,2)+'\n');
console.log(JSON.stringify(files));
