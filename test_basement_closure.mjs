// Consistency checks of the lower-storey geometry and open travel paths.
// Runs with Node, without WebGL, iPhone or external dependencies.
import {buildEmptyInterior} from './src/architecture.js';
import {stairSurface,beginStair,finishedStair} from './src/stair-navigation.js';
import {writeFileSync} from 'node:fs';
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
class Mesh {constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=new V;this.rotation={x:0,y:0,z:0};this.quaternion={setFromUnitVectors:()=>{}};}}
class Group {constructor(){this.children=[];}add(...x){this.children.push(...x);}}
class Mat {constructor(p){this.params=p;}}
class Light {constructor(){this.position=new V;}}
const THREE={MeshStandardMaterial:Mat,MeshPhysicalMaterial:Mat,Mesh,Group,BoxGeometry:Geometry,CylinderGeometry:Geometry,SphereGeometry:Geometry,Vector3:V,PointLight:Light,DoubleSide:2};
const scene=new Group();
const {levels,walls,structure,wells,stairs}=buildEmptyInterior(THREE,scene);
const objs=structure.children;
const get=(name)=>objs.filter(o=>o.name===name);
const verify=(cond,label)=>{if(!cond)throw Error('Untergeschoss-Test fehlgeschlagen: '+label);};
const hit=(floor,x,z,r=.21)=>walls[floor].some(w=>{
  const dx=x-w.x,dz=z-w.z,c=Math.cos(w.rotY||0),s=Math.sin(w.rotY||0);
  return Math.abs(dx*c-dz*s)<w.hw+r&&Math.abs(dx*s+dz*c)<w.hd+r;
});
verify(get('Untergeschoss_Decke_Suedzone').length===1,'Suedzone besitzt geschlossene Deckenuntersicht');
verify(get('Untergeschoss_Decke_Nordsegment').length===3,'nordseitige Deckenabschnitte neben Treppenoeffnungen');
verify(get('Untergeschoss_Eingangsgang_Decke').length===1,'Eingangsgang-Decke');
verify(get('Treppenhaus_Deckenfeld').length===0,'kein Vollflaechen-Deckel im Treppenschacht');
verify(get('Untergeschoss_Geschlossene_Setzstufe_A').length===32,'32 geschlossene Setzstufen A');
verify(get('Untergeschoss_Geschlossene_Setzstufe_B').length===32,'32 geschlossene Setzstufen B');
verify(get('Untergeschoss_Geschlossene_Treppenuntersicht_A').length===2,'beide A-Lauf-Untersichten');
verify(get('Untergeschoss_Geschlossene_Treppenuntersicht_B').length===2,'beide B-Lauf-Untersichten');
verify(get('Treppenhaus_Wendepodest_Rahmen').length===0,'kein Marmorrahmen am Wendepodest');
verify(get('Rohbau_Eingangsgang_Glatte_Untersicht').length===1,'glatte Rohbau-Decke ueber der Eingangstuer');
verify(scene.children.every(o=>!(o instanceof Light)),'keine Innenraum-Punktlampen mehr');
verify(!objs.some(o=>/Marmor|Laeufer|Teppich|Leuchte|Kronleuchter|Bildrahmen|Gemaelde|Wandfeld/.test(o.name)),'keine Innenausstattung mehr');
verify(get('Eingangsgang_Wand').length===2,'Eingangsgang beidseitig geschlossen');
for(const x of [-20,-14,-5,5,14,20])verify(hit(0,x,7.95),`Nordwand bei x=${x} geschlossen`);
for(const z of [8.35,9.45,10.70,11.85]){
  verify(!hit(0,0,z),`Eingangsgang bei z=${z} frei`);
  verify(hit(0,-1.56,z)&&hit(0,1.56,z),`Seitliche Eingangsgang-Waende bei z=${z}`);
}
for(const x of [-19,-12.2,-3,3,12.2,19])verify(!hit(0,x,-2.15),`Untergeschoss Raumtuer bei x=${x} begehbar`);
for(const well of wells){
  for(const lane of [well.laneA,well.laneB]){
    for(const z of [2.0,3.5,5.4,7.0]){
      verify(!hit(0,lane,z),`Stairwell ${well.name} lane=${lane} z=${z} kollisionsfrei`);
      const underCeiling=get('Untergeschoss_Decke_Suedzone').concat(get('Untergeschoss_Decke_Nordsegment'),get('Untergeschoss_Eingangsgang_Decke')).some(o=>{
        const a=o.geometry.parameters;
        return Math.abs(lane-o.position.x)<a.width/2+.015&&Math.abs(z-o.position.z)<a.depth/2+.015;
      });
      verify(!underCeiling,`Treppenlauf ${well.name} ohne verdeckende Decke bei z=${z}`);
    }
  }
  const stage=stairs.find(t=>t.well===well.name&&t.stage===0);
  verify(stage&&beginStair(stairs,0,stage.laneA,1.2)===stage,`unteren Treppeneinstieg ${well.name}`);
  verify(beginStair(stairs,1,stage.laneB,1.2)===stage,`oberen Treppeneinstieg ${well.name}`);
  verify(Math.abs(stairSurface(stage,stage.laneA,stage.turn)-stage.mid)<.0001,'Zwischenpodesthoehe A');
  verify(Math.abs(stairSurface(stage,stage.laneB,stage.start)-stage.hi)<.0001,'Etagenhoehe B');
  verify(finishedStair(stage,stage.laneA,.92)===0&&finishedStair(stage,stage.laneB,.92)===1,'Wechsel in beide Richtungen');
}
const meshes=objs.filter(o=>o.geometry&&o.geometry.parameters&&o.geometry.type==='BoxGeometry').map(o=>({
  name:o.name,x:o.position.x,y:o.position.y,z:o.position.z,
  w:o.geometry.parameters.width,h:o.geometry.parameters.height,d:o.geometry.parameters.depth,
  ry:o.rotation?.y||0,rx:o.rotation?.x||0
}));
writeFileSync('basement_closure_geometry.json',JSON.stringify({levels,wells,stairs:stairs.map(s=>({well:s.well,stage:s.stage,lo:s.lo,mid:s.mid,hi:s.hi})),meshes,
  groundWalls:walls[0]},null,2));
console.log('PASS Untergeschoss geschlossen: 64 Setzstufen, 4 Untersichten, 2 Eingangsgangwaende, 5 Deckenfelder und glatte Eintritts-Untersicht, 2 Treppenhaeuser, 12 Tuer-/Eingangspositionen, Treppen frei.');
