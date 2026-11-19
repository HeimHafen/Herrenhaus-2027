import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
const f=readFileSync(new URL('./src/facade.js', import.meta.url),'utf8');
const m=readFileSync(new URL('./src/main.js', import.meta.url),'utf8');
const sourcePanels=[
  'surface(revealX,y,z,.118,h+.28,w+.34,limestoneShadow)',
  'surface(axis,y,outerZ,w+.20,h+.26,.065,limestoneShadow)',
  'surface(axis,y,-12.005,w+.18,h+.24,.060,limestoneShadow)',
];
for(const expression of sourcePanels)
  assert(!f.includes(expression),`solid shadow panel still present: ${expression}`);
assert.equal((f.match(/for\(const e of \[-1,1\]\)/g)||[]).length>=3,true,
  'three elevations require four-sided reveals');
for(const t of ['northBounce','southBounce'])assert(m.includes(t),`missing ${t}`);
assert(m.includes('buildEmptyInterior') && m.includes('instanceStaticBoxes'));
console.log('PASS – no solid window shadow rectangles; three perimeter-only reveals');
console.log('PASS – front and rear bounce lights; interior builder retained');
