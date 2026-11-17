import {writeFileSync} from 'node:fs';
import {buildSouvenirs} from './souvenirs.js';
const result=buildSouvenirs(()=>[1,1,1],true);
writeFileSync(new URL('souvenir-placements.js',import.meta.url),'// Generated resting positions; rebuild with node prepare-souvenirs.mjs.\nexport const placements='+JSON.stringify(result.placements)+';\n');
console.log(`Prepared ${result.placements.length} nonintersecting souvenir placements.`);
