// Independent runtime regression test: exercises the actual facade builder
// with a light THREE-compatible object mock and detects temporal dead zones.
// No network, WebGL, npm dependencies, or iPhone required.
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {buildEntranceFanlight} from './src/entrance-fanlight.js';
import {buildHeritageOrnaments} from './src/heritage-ornaments.js';
class Vector {
  constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
  set(x,y,z){Object.assign(this,{x,y,z});return this;}
  length(){return Math.hypot(this.x,this.y,this.z);}
}
class Mesh {
  constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=new Vector();this.rotation=new Vector();this.scale=new Vector(1,1,1);this.name='';this.castShadow=false;this.receiveShadow=false;this.isMesh=true;}
}
class Group {constructor(){this.children=[];this.userData={};this.name='';}add(...m){this.children.push(...m);}}
class BoxGeometry {constructor(w,h,d){this.type='BoxGeometry';this.parameters={width:w,height:h,depth:d};}}
class Shape {constructor(){this.points=[];}moveTo(x,y){this.points.push([x,y]);}lineTo(x,y){this.points.push([x,y]);}closePath(){}}
class ExtrudeGeometry {constructor(shape,opts){this.type='ExtrudeGeometry';this.shape=shape;this.opts=opts;}}
class ShapeGeometry {constructor(shape){this.type='ShapeGeometry';this.shape=shape;}}
class SphereGeometry {constructor(r){this.type='SphereGeometry';this.radius=r;}}
class TorusGeometry {constructor(r){this.type='TorusGeometry';this.radius=r;}}
class Curve {constructor(points){this.points=points;}}
class TubeGeometry {constructor(curve,segments,radius){this.type='TubeGeometry';this.curve=curve;this.radius=radius;}}
class PointLight {constructor(){this.position=new Vector();}}
class Material {constructor(opts){this.userData={};this.opts=opts;}}
const THREE={Mesh,Group,BoxGeometry,Shape,ShapeGeometry,ExtrudeGeometry,SphereGeometry,TorusGeometry,TubeGeometry,CatmullRomCurve3:Curve,Vector3:Vector,Vector2:Vector,PointLight,MeshStandardMaterial:Material};
const fakeMat=name=>({name,userData:{}});
const mats={facadeWall:fakeMat('facadeWall'),trim:fakeMat('trim'),roof:fakeMat('roof'),shade:fakeMat('shade'),paintedSash:fakeMat('paintedSash'),soffit:fakeMat('soffit'),dressedStone:fakeMat('dressedStone'),stairStone:fakeMat('stairStone'),nosingStone:fakeMat('nosingStone'),steel:fakeMat('steel'),windowStone:fakeMat('windowStone'),ornamentStone:fakeMat('ornamentStone'),capitalFinish:fakeMat('capitalFinish')};
const stubs={
  buildEntranceFanlight,
  buildOakEntrance:()=>new Group(),
  buildSouthPortico:()=>new Group(),
  createExteriorMaterialLibrary:()=>mats,
  buildExteriorDetails:()=>{},
  buildHeritageOrnaments,
  createRealisticExteriorGlass:()=>({name:'glass',userData:{isExteriorGlass:true}}),
  WINDOW_STOREYS:[{floor:0,y:2.75,height:2.5},{floor:1,y:7.6,height:2.6},{floor:2,y:11.9,height:1.6}],
  SIDE_WINDOW_AXES:[-9,-5,-1,3,7],
  SOUTH_WINDOW_AXES:[-20,-15,-10,-5,0,5,10,15,20],
  NORTH_WINDOW_AXES:[-20,-15,-10,-5,0,5,10,15,20],
  PORTICO_DOOR_AXES:[-5,0,5]
};
const imported=readFileSync(new URL('./src/facade.js',import.meta.url),'utf8');
const js=imported.replace(/^import .*?;\s*$/gm,'').replace('export function buildFacade','function buildFacade');
const callback=new Function(...Object.keys(stubs), `${js}\nreturn buildFacade;`);
const builder=callback(...Object.values(stubs));
const scene=new Group(),originalModel={traverse(fn){for(let i=0;i<540;i++)fn({isMesh:true,name:`Cube.${String(i).padStart(3,'0')}`,visible:true});}};
const result=builder(THREE,scene,{},originalModel);
assert(result.exterior,'the facade must build without temporal dead zone errors');
assert.equal(result.fanlight,null,'obsolete separate arched fanlight must not be constructed');
assert.equal(result.door,null,'legacy procedurally generated wooden door must not be constructed');
assert(result.legacyWindowInserts?.children.length>10,'procedural window fallback must remain available');
const fitted=result.exterior.children.filter(obj=>obj.name?.startsWith('V22_Gewaende_Steinspandrel_'));
assert.equal(fitted.length,2,'two fitted sandstone corner spandrels surround the real door arch');
assert(!scene.children.some(x=>x instanceof PointLight),'No old exterior lantern lights');
console.log(`PASS – V22 facade constructs without temporal dead zone or obsolete entrance arch; ${result.legacyWindowInserts.children.length} fallback window components`);
assert.equal(result.heritage.sculptedWindows,18);
console.log('PASS – two fitted stone spandrels, 18 heritage windows and no procedural front door');
// In V13 test mode, one authored window is omitted, preventing duplicate geometry.
globalThis.location={search:'?view=historic-window'};
const preview=builder(THREE,new Group(),{},originalModel);
assert.equal(preview.heritage.sculptedWindows,17);
delete globalThis.location;
console.log('PASS – one imported-window test bay suppresses the existing decorative surround');
