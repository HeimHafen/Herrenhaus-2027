import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const project = path.dirname(new URL(import.meta.url).pathname);
const b=readFileSync(path.join(project,'assets/imported-door/castle-style-door-optimized.glb'));
assert.equal(b.toString('ascii',0,4),'glTF');
const len=b.readUInt32LE(12);
const gltf=JSON.parse(b.subarray(20,20+len).toString('utf8'));
assert.ok(gltf.nodes.some(n=>n.name==='Frame.002'));
assert.ok(gltf.nodes.some(n=>n.name==='Frame.001'));

// Mock the name sanitation and hierarchy that GLTFLoader produces. This test
// executes the actual V23 door loader, not a duplicate reimplementation.
const js=readFileSync(path.join(project,'src/castle-door-import.js'),'utf8');
const {loadCastleDoor}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
function mockModel(sanitize) {
  class Obj {
    constructor(name='',isMesh=false){
      this.name=name;this.children=[];this.parent=null;this.userData={};this.isMesh=isMesh;
      this.position={x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});}};
      this.scale={setScalar(x){this.x=x;this.y=x;this.z=x;}};
      this.material={name: isMesh && /Glass/.test(name)? 'Glass' : 'Wood'};
    }
    add(o){this.children.push(o);o.parent=this;}
    traverse(fn){fn(this); for(const c of [...this.children]) c.traverse(fn);}
    updateMatrixWorld(){}
    attach(o){ if(o.parent) o.parent.children=o.parent.children.filter(c=>c!==o);this.add(o); }
  }
  const scene=new Obj('GLTF_Scene');
  const nodes=gltf.nodes.map(n=>new Obj(sanitize?n.name?.replace(/[^a-zA-Z0-9_-]/g,'_'):n.name,n.mesh!==undefined));
  gltf.nodes.forEach((n,i)=>{for(const child of n.children||[])nodes[i].add(nodes[child]);});
  for(const i of gltf.scenes[gltf.scene||0].nodes)scene.add(nodes[i]);
  return {root:scene,Group:class extends Obj{constructor(){super();}}};
}
for(const sanitize of [true,false]){
  const model=mockModel(sanitize);
  const scene={added:[],add(node){this.added.push(node);}};
  const FakeLoader=class{async loadAsync(url){assert.ok(url.endsWith('castle-style-door-optimized.glb'));return{scene:model.root};}};
  const door=await loadCastleDoor({Group:model.Group,DoubleSide:2}, FakeLoader, scene);
  assert.equal(scene.added.length,1);
  assert.equal(door.userData.leaves.length,2);
  assert.deepEqual(door.userData.missingLeafAssemblies,[]);
  assert.equal(door.userData.leaves[0].children.length,1);
  assert.equal(door.userData.leaves[1].children.length,1);
  assert.ok(/frame.?002/i.test(door.userData.leaves[0].children[0].name));
  assert.ok(/frame.?001/i.test(door.userData.leaves[1].children[0].name));
  assert.ok(door.userData.leaves[0].position.x < 0 && door.userData.leaves[1].position.x > 0);
  const meshNames=[];door.traverse(n=>{if(n.isMesh)meshNames.push(n.name);});
  assert.equal(meshNames.length,6); // four leaf meshes + fixed surround wood/glass
  console.log('PASS V23 model import: '+(sanitize?'GLTFLoader sanitized names':'original GLB names')+', 2 movable leaves, 6 meshes retained');
}
