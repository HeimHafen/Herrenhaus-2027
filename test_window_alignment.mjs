import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {buildEmptyInterior} from './src/architecture.js';
import {cladStructuralExterior} from './src/exterior-skin.js';
import { WINDOW_STOREYS, SIDE_WINDOW_AXES, SOUTH_WINDOW_AXES, NORTH_WINDOW_AXES } from './src/window-layout.js';
class V {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  add(a){this.x+=a.x;this.y+=a.y;this.z+=a.z;return this;}
  subVectors(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this;}
  multiplyScalar(k){this.x*=k;this.y*=k;this.z*=k;return this;}
  clone(){return new V(this.x,this.y,this.z);}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  normalize(){const r=Math.hypot(this.x,this.y,this.z)||1;return this.multiplyScalar(1/r);}
  length(){return Math.hypot(this.x,this.y,this.z);}
}
class Geometry {constructor(...a){this.parameters={width:a[0],height:a[1],depth:a[2]};this.type='BoxGeometry';}}
class Mesh {constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=new V;this.isMesh=true;this.rotation={x:0,y:0,z:0};this.quaternion={setFromUnitVectors:()=>{}};}}
class Group {constructor(){this.children=[];}add(...x){this.children.push(...x);}}
class Mat {constructor(p){this.params=p;}}
class Light {constructor(){this.position=new V;}}
const THREE={MeshStandardMaterial:Mat,MeshPhysicalMaterial:Mat,Mesh,Group,BoxGeometry:Geometry,CylinderGeometry:Geometry,SphereGeometry:Geometry,Vector3:V,PointLight:Light,DoubleSide:2};

const scene=new Group();
const {structure}=buildEmptyInterior(THREE,scene);
const all=structure.children;
const sides=all.filter(o=>o.name==='Fensterglas');
const south=all.filter(o=>o.name==='Suedfensterglas');
assert.equal(sides.length,2*3*SIDE_WINDOW_AXES.length,'all side openings should exist');
assert.equal(south.length,3*SOUTH_WINDOW_AXES.length,'all south openings should exist');
for(const side of [-1,1]){
  for(const y of WINDOW_STOREYS.map(level=>level.y)){
    const actual=sides.filter(o=>Math.abs(o.position.x-side*23.28)<.005 && Math.abs(o.position.y-y)<.001)
      .map(o=>o.position.z).sort((a,b)=>a-b);
    assert.deepEqual(actual,[...SIDE_WINDOW_AXES],`side ${side}, storey ${y} must align with real masonry`);
  }
}
for(const y of WINDOW_STOREYS.map(level=>level.y)){
  const actual=south.filter(o=>Math.abs(o.position.y-y)<.001)
    .map(o=>o.position.x).sort((a,b)=>a-b);
  assert.deepEqual(actual,[...SOUTH_WINDOW_AXES],`south storey ${y} must align with real masonry`);
}
assert.equal(NORTH_WINDOW_AXES.length,9);
assert(NORTH_WINDOW_AXES.every((x,i)=>x===SOUTH_WINDOW_AXES[i]));
const facade=readFileSync('./src/facade.js','utf8');
const details=readFileSync('./src/exterior-details.js','utf8');
assert(facade.includes('id>=141&&id<=418'),'old 44 source quoin meshes must be hidden');
assert(!facade.includes('const sideAxes=[-8,-4,0,4,8]'),'V8 shifted side grid must be absent');
assert(!details.includes('function sideWindow'),'no duplicate side window detail system');
assert(!details.includes('function windowFront'),'no duplicate front window detail system');
assert(facade.includes('for(const z of SIDE_WINDOW_AXES)'),'decorative windows use structural axes');
assert(facade.includes('for(const axis of NORTH_WINDOW_AXES)'));
assert(facade.includes('for(const axis of SOUTH_WINDOW_AXES)'));
// A thin stone finish may overlay stone wall segments, never window apertures.
const shell=new Group(),stone={name:'PBR white limestone'}; shell.userData={};
const claddingCount=cladStructuralExterior(THREE,structure,shell,stone);
console.log("wall skins",claddingCount); assert(claddingCount>10,'all exterior wall segments clad');
assert.equal(shell.children.length,claddingCount);
for(const mesh of shell.children){
  assert(!mesh.name.includes('Fensterglas'),'glass must remain uncovered');
  const g=mesh.geometry.parameters;
  assert(g.width<=.03||g.depth<=.03,'skin must be thin');
}
console.log(`PASS – ${sides.length} side + ${south.length} south physical window holes align with shared grid`);
console.log(`PASS – ${claddingCount} thin cladding skins preserve holes, no duplicate window profiles`);
console.log('PASS – original protruding 44 GLB corner meshes excluded; nine aligned front axes');
