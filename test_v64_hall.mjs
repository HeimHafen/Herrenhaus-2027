import { cellar } from './src/cellar.js';
import { WEST_CORE, GARDEN_ENTRANCE_OPENING } from './src/stair-layout.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { buildEmptyInterior } from './src/architecture.js';
import { beginStair, stairSurface, finishedStair } from './src/stair-navigation.js';
THREE.TextureLoader.prototype.load=function(path){
  assert.ok(fs.existsSync(path),path);
  return new THREE.Texture();
};
const {levels,structure,stairs,walls,corridor}=buildEmptyInterior(THREE,new THREE.Scene());
assert.equal(stairs.length,4);
const radius=.22;
for(const stair of stairs){
  assert.equal(stair.stoneRail,true);
  assert.equal(stair.far-stair.turn,2.08);
  assert.equal(beginStair(stairs,stair.stage,stair.laneA,stair.startA),stair);
  assert.equal(beginStair(stairs,stair.stage+1,stair.laneB,stair.start),stair);
  const samples=[];
  const sampleLine=(x0,z0,x1,z1)=>{
    for(let i=0;i<=50;i++) samples.push([x0+(x1-x0)*i/50,z0+(z1-z0)*i/50]);
  };
  const turn=stair.turn+.65;
  sampleLine(stair.laneA,stair.startA,stair.laneA,turn);
  sampleLine(stair.laneA,turn,stair.laneB,turn);
  sampleLine(stair.laneB,turn,stair.laneB,stair.start-.18);
  for(const [x,z] of samples){
    const y=stairSurface(stair,x,z);
    assert.ok(Number.isFinite(y));
    const floor=Math.max(0,Math.min(2,Math.round((y-.89)/4.6)));
    assert.ok(!walls[floor].some(w=>!w.rotY&&Math.abs(w.x-x)<w.hw+radius&&Math.abs(w.z-z)<w.hd+radius),
      'Wall in walking route at '+[stair.well,x,z,floor].join(', '));
  }
  assert.equal(finishedStair(stair,stair.laneB,stair.start-.18),stair.stage+1);
}
assert.ok(structure.children.filter(mesh=>mesh.name==="Westtreppe_Podest_Einfassung").every(mesh=>mesh.position.y>levels[0].top));
const floor=structure.getObjectByName('Gartengeschoss_Fischgraet_Eichenstaebe');
assert.ok(floor);
const bounds=new THREE.Box3().setFromObject(floor);
assert.ok(bounds.min.x<cellar.entryX-cellar.shaftHalf&&bounds.max.x>cellar.entryX+cellar.shaftHalf);
assert.ok(bounds.min.z<cellar.entryZ&&bounds.max.z>cellar.entryZ+cellar.openingLength);
assert.ok(!structure.children.some(mesh=>mesh.name.startsWith('Kellerabgang_')));
const vertices=floor.geometry.attributes.position;
const normals=floor.geometry.attributes.normal;
assert.ok(vertices.count>2000);
for(let i=0;i<vertices.count;i++){
  assert.ok(Math.abs(vertices.getY(i)-(levels[0].floor+.046))<.00001);
  assert.ok(normals.getY(i)>.99);
}
const doors=[[WEST_CORE.center,5.36],GARDEN_ENTRANCE_OPENING,[9.25,5.36]];
const panelBounds=new THREE.Box3(), transform=new THREE.Matrix4();
for(const panel of structure.children.filter(mesh=>mesh.name==='Steinbeige_Wandkassetten')){
  for(let i=0;i<panel.count;i++){
    panel.getMatrixAt(i,transform);
    panelBounds.setFromCenterAndSize(new THREE.Vector3(),new THREE.Vector3(1,1,1)).applyMatrix4(transform);
    if(panelBounds.min.z>.72||panelBounds.max.z<.52)continue;
    if(panelBounds.max.z<=.62001&&panelBounds.min.z<.51)continue;
    if(panelBounds.min.z>=.61999&&panelBounds.max.z>.73)continue;
    for(const [door,width] of doors){
      assert.ok(panelBounds.max.x<=door-width/2+.60||panelBounds.min.x>=door+width/2-.60,
        JSON.stringify({door,min:panelBounds.min,max:panelBounds.max}));
    }
  }
}
console.log('PASS – 4 stair routes, closed ground floor, aligned stone lattice and clear portals.');

const entranceX=z=>-1.60*(12.18-z)/(12.18+3.85);
for(let z=-3.85;z<12;z+=.04){
  const x=entranceX(z);
  assert.ok(!walls[0].some(w=>!w.rotY&&Math.abs(w.x-x)<w.hw&&Math.abs(w.z-z)<w.hd),
    `Sichtlinie zur Eichentür blockiert bei ${x}, ${z}`);
}
for(let z=.10;z<1.13;z+=.04){
  assert.ok(!walls[0].some(w=>!w.rotY&&Math.abs(w.x-cellar.entryX)<w.hw+.22&&Math.abs(w.z-z)<w.hd+.22),
    'Der Kellerabgang muss von der Halle erreichbar bleiben');
}
console.log('PASS – direkte Sichtlinie zur Eichentür und freier Weg ins Westzimmer.');

// Follow the angled flur from the opening through the operable inner door.
const passagePoint=v=>new THREE.Vector3(0,0,v).applyMatrix4(corridor.group.matrix);
corridor.group.updateMatrix();
const threshold=passagePoint(corridor.doorZ);
assert.ok(corridor.blocks(threshold.x,threshold.z,radius),'Closed inner door blocks its threshold');
const approach=passagePoint(corridor.doorZ-.98);
for(let frame=0;frame<60;frame++)corridor.update(approach.x,approach.z,true,1/60);
for(let v=-.65;v<=corridor.doorZ+.39;v+=.035){
  const {x,z}=passagePoint(v);
  assert.ok(!corridor.blocks(x,z,radius),'Open inner door clears the flur axis');
  assert.ok(!walls[0].some(w=>{
    const c=Math.cos(w.rotY||0),s=Math.sin(w.rotY||0),dx=x-w.x,dz=z-w.z;
    return Math.abs(c*dx-s*dz)<w.hw+radius&&Math.abs(s*dx+c*dz)<w.hd+radius;
  }),`The walking axis is clear at ${v.toFixed(2)}`);
}
console.log('PASS – inner oak door closes and opens a walkable passage.');
