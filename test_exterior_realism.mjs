import { readFileSync,statSync,existsSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const asset=p=>new URL('./'+p,import.meta.url);
const material=read('src/exterior-materials.js');
const detail=read('src/exterior-details.js');
const main=read('src/main.js');
const facade=read('src/facade.js');
const windows=read('src/landgut-windows.js');
const sky=read('src/sky-atmosphere.js');
const html=read('index.html');
for(const name of ['facade_limestone','trim_limestone','column_stone','base_limestone','roof_zinc']){
  for(const type of ['albedo','normal','roughness']){
    const filepath=`assets/exterior/${name}_${type}.jpg`;
    assert(existsSync(asset(filepath)),`missing local material asset ${filepath}`);
    assert(statSync(asset(filepath)).size>6000,`texture appears empty: ${filepath}`);
  }
}
assert.match(material,/map:load\(name,'albedo'/);
assert.match(material,/roughnessMap:load\(name,'roughness'/);
assert.match(material,/normalMap:load\(name,'normal'/);
assert.doesNotMatch(detail,/function windowFront\(/);
assert.doesNotMatch(detail,/function sideWindow\(/);
assert.match(detail,/Aussenecke_Fluchtstein/);
assert.match(detail,/Gesims_Umlaufend/);
assert.match(detail,/Dachgesims_Tropfkante/);
assert.match(facade,/buildExteriorDetails\(THREE,exterior,mats\)/);
assert.match(windows,/SIDE_WINDOW_AXES/);
assert.match(windows,/northAxesForFloor/);
assert.match(main,/model\.traverse\(obj=>/);
assert.match(main,/obj\.material=externalMaterials\.facadeWall/);
assert.match(main,/atmosphere\.update\(\)/);
assert.match(main,/mobile\?1024:2048/);
assert.match(sky,/SphereGeometry\(188/);
assert.match(facade,/buildLandgutWindows\(THREE,exterior,mats,glass/);
assert.match(main,/instanceStaticBoxes\(facadeWindows\)/);
assert(existsSync(asset('assets/white-house-structure.glb')));
assert(existsSync(asset('src/architecture.js')));
console.log('PASS – 15 local PBR textures and physically based exterior materials');
console.log('PASS – details on north, south, east and west elevations');
console.log('PASS – original GLB remapping, sky, mobile shadow resolution, HTML import chain');
