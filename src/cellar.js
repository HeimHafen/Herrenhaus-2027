import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const cellar = Object.freeze({
  index:3, name:'Gewölbekeller', floor:-4.42,
  start:0, end:8, far:25.4, centre:0, shaftHalf:.835, hallHalf:1.88,
  entryX:-9.50, entryZ:1.13, openingLength:4.28
});
const steps=30;
const radius=.23;
export function cellarWalkable(x,z,inCellar){
  const offset=Math.abs(x-cellar.entryX);
  x=z-cellar.entryZ;
  const inShaft=x>=cellar.start && x<cellar.end &&
    offset<cellar.shaftHalf-radius;
  if(!inCellar)return inShaft;
  const pier=Math.abs((x-cellar.end-.8+1.425)%2.85-1.425)<.45 && x>=cellar.end+.35;
  return inShaft || (x>=cellar.end && x<cellar.far-radius &&
    offset<(x<cellar.end+.32?cellar.shaftHalf-radius:cellar.hallHalf-radius-(pier?.17:0)));
}

export function cellarHeight(z,upperFloor){
  return flightHeight(z-cellar.entryZ,upperFloor);
}

function flightHeight(x,upperFloor){
  const t=Math.max(0,Math.min(1,(x-cellar.start)/(cellar.end-cellar.start)));
  return upperFloor+(cellar.floor-upperFloor)*t;
}

// Four rectangles retain the surface around the stair opening.
export function aroundCellarShaft(x1,x2,z1,z2){
  const {entryX,entryZ,shaftHalf,openingLength}=cellar;
  const left=entryX-shaftHalf,right=entryX+shaftHalf;
  return [[x1,left,z1,z2],[right,x2,z1,z2],
    [left,right,z1,entryZ],[left,right,entryZ+openingLength,z2]];
}

export function buildCellar(THREE,scene,upperFloor){
  const {start,end,far,centre,shaftHalf,hallHalf,floor}=cellar;
  const room=new THREE.Group();
  room.name='Klassizistischer_Gewoelbekeller';
  room.position.set(cellar.entryX,0,cellar.entryZ);
  room.rotation.y=-Math.PI/2;
  scene.add(room);
  const lamps=new THREE.Group();
  room.add(lamps);
  const loader=new THREE.TextureLoader();
  const batches=new Map();
  function masonry(asset,color,normalScale){
    const maps={};
    for(const [prop,suffix] of [['map','albedo'],['normalMap','normal'],['roughnessMap','roughness']]){
      const t=loader.load('./assets/heritage-v14/'+asset+'_'+suffix+'.jpg');
      t.wrapS=t.wrapT=THREE.RepeatWrapping;
      t.anisotropy=8;
      if(prop==='map')t.colorSpace=THREE.SRGBColorSpace;
      maps[prop]=t;
    }
    return new THREE.MeshStandardMaterial({...maps,color,vertexColors:true,roughness:.9,
      normalScale:new THREE.Vector2(normalScale,normalScale)});
  }
  const stone=masonry('facade_limestone',0xb8a185,.85);
  const arch=masonry('trim_limestone',0xd0b797,.64);
  const slab=masonry('base_limestone',0x92847a,.75);
  const grout=new THREE.MeshStandardMaterial({color:0x77644e,roughness:1,vertexColors:true});
  const oak=loader.load('./assets/wood/eiche-dunkel-v26.jpg');
  oak.wrapS=oak.wrapT=THREE.RepeatWrapping;
  oak.colorSpace=THREE.SRGBColorSpace;
  oak.anisotropy=8;
  const wood=new THREE.MeshStandardMaterial({map:oak,color:0x91765d,roughness:.83,vertexColors:true});
  const metal=new THREE.MeshStandardMaterial({color:0x866340,metalness:.65,roughness:.38,vertexColors:true});
  const glass=new THREE.MeshStandardMaterial({color:0xffdcaa,emissive:0xffb36a,emissiveIntensity:1.7,roughness:.75,vertexColors:true});
  let seed=718;
  function add(g,m,variation=.12){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const v=1-(seed/4294967296)*variation;
    const n=g.attributes.position.count;
    g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(n*3).fill(v),3));
    if(!batches.has(m))batches.set(m,[]);
    batches.get(m).push(g.index?g.toNonIndexed():g);
    if(g.index)g.dispose();
  }
  function box(m,x,y,z,w,h,d){
    const g=new THREE.BoxGeometry(w,h,d).translate(x,y,z);
    const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++){
      const u=Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i);
      const v=Math.abs(n.getY(i))>.5?p.getZ(i):p.getY(i);
      uv.setXY(i,u/.94,v/.94);
    }
    add(g,m);
  }
  function frustum(m,x,y,z,top,bottom,height){
    add(new THREE.CylinderGeometry(top,bottom,height,16).translate(x,y,z),m,0);
  }
  const spring=floor+2.08;
  function vaultBlock(m,x1,x2,a,b,r,ry,t){
    const pos=[],uv=[],indices=[];
    function face(point,flip=false){
      const base=pos.length/3;
      const segments=Math.max(4,Math.ceil((b-a)*24));
      for(let i=0;i<=segments;i++){
        const theta=a+(b-a)*i/segments;
        for(let j=0;j<2;j++){
          const [x,radius,relief]=point(j);
          pos.push(x,spring+(ry+relief)*Math.sin(theta),centre+radius*Math.cos(theta));
          uv.push(x/.94,(theta+relief)*r/.94);
        }
      }
      for(let i=0;i<segments;i++){
        const k=base+i*2;
        indices.push(...(flip?[k,k+1,k+2,k+1,k+3,k+2]:[k,k+2,k+1,k+1,k+2,k+3]));
      }
    }
    face(j=>[j?x2:x1,r,0],true);
    if(t>0){
      face(j=>[x1,r+j*t,j*t]);
      face(j=>[x2,r+j*t,j*t],true);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    g.setIndex(indices);
    g.computeVertexNormals();
    add(g,m);
  }
  // Point the inner face of the segmented barrel toward the walking aisle.
  grout.side=stone.side=arch.side=THREE.DoubleSide;
  vaultBlock(grout,end,far,0,Math.PI,hallHalf+.023,1.48+.023,0);
  for(let row=0;row<16;row++){
    const a=row*Math.PI/16+.006,b=(row+1)*Math.PI/16-.006;
    for(let x=end-(row%2)*.32;x<far;x+=.64){
      vaultBlock(stone,Math.max(end,x+.006),Math.min(far,x+.634),a,b,hallHalf,1.48,0);
    }
  }
  for(let x=end+.8;x<far-.3;x+=2.85){
    for(let j=0;j<13;j++){
      vaultBlock(arch,x-.19,x+.19,j*Math.PI/13+.003,(j+1)*Math.PI/13-.003,hallHalf-.17,1.30,.19);
    }
    for(const side of [-1,1]){
      const z=centre+side*(hallHalf-.07);
      box(arch,x,floor+1.07,z,.38,2.14,.24);
      box(arch,x,floor+.14,z,.49,.28,.33);
      box(arch,x,spring-.045,z,.49,.15,.34);
      const lx=x+.46,lz=centre+side*(hallHalf-.23);
      box(metal,lx,floor+1.60,centre+side*(hallHalf-.043),.10,.22,.05);
      frustum(metal,lx,floor+1.57,lz,.038,.050,.075);
      const arm=new THREE.CylinderGeometry(.020,.020,.22,10);
      arm.rotateX(Math.PI/2).translate(lx,floor+1.54,centre+side*(hallHalf-.13));
      add(arm,metal,0);
      frustum(glass,lx,floor+1.77,lz,.073,.101,.22);
      const light=new THREE.PointLight(0xffbf81,15,3.6,2);
      light.position.set(lx,floor+1.82,lz-side*.10);
      lamps.add(light);
    }
  }
  for(const side of [-1,1]){
    const z=centre+side*(hallHalf+.09);
    box(grout,(end+far)/2,floor+1.12,z,far-end,2.24,.16);
    for(let row=0;row<6;row++){
      for(let x=end-(row%2)*.43;x<far;x+=.86){
        const a=Math.max(end,x+.006),b=Math.min(far,x+.854);
        box(stone,(a+b)/2,floor+.18+row*.347,z,b-a,.335,.19);
      }
    }
  }
  box(stone,far+.05,floor+1.81,centre,.23,3.62,hallHalf*2+.27);
  // Planked arched oak door with wrought-iron straps.
  for(let j=0;j<11;j++){
    const z=(j-5)*.141,h=1.64+Math.sqrt(.79**2-z*z)*.72;
    box(wood,far-.10,floor+h/2,centre+z,.10,h,.138);
  }
  for(const h of [.58,1.43])box(metal,far-.158,floor+h,centre,.029,.086,1.41);
  box(metal,far-.173,floor+1.02,centre+.29,.075,.075,.095);
  box(grout,(end+far)/2,floor-.075,centre,far-end,.132,hallHalf*2);
  for(let row=0;row<6;row++){
    const z=centre+(row-2.5)*hallHalf/3;
    for(let x=end-(row%2)*.43;x<far;x+=.86){
      const a=Math.max(end,x+.006),b=Math.min(far,x+.854);
      box(slab,(a+b)/2,floor-.034,z,b-a,.067,hallHalf/3-.012);
    }
  }
  // Full-length lined shaft. The outer parapet protects the opening upstairs.
  for(let i=0;i<steps;i++){
    const a=start+(end-start)*i/steps,b=start+(end-start)*(i+1)/steps;
    const y=flightHeight(b,upperFloor);
    box(stone,(a+b)/2,y-.111,centre,b-a+.003,.222,shaftHalf*2);
    box(arch,a+.029,y-.013,centre,.060,.027,shaftHalf*2);
  }
  for(const side of [-1,1]){
    const z=centre+side*(shaftHalf+.05);
    box(stone,(start+end)/2,(upperFloor+floor)/2,z,end-start,upperFloor-floor,.11);

  }
  box(stone,start-.04,(floor+upperFloor)/2,centre,.12,upperFloor-floor,shaftHalf*2);
  for(const x of [2.25,4.6,6.9]){
    const y=flightHeight(x,upperFloor)+1.78;
    const light=new THREE.PointLight(0xffdfb6,12,4.8,2);
    light.position.set(x,y,centre);
    lamps.add(light);
  }
  // Close the wall above the opening to the underside of the garden slab.
  const headerBottom=floor+2.38;
  box(arch,end+.085,(upperFloor+headerBottom)/2,centre,.17,upperFloor-headerBottom,hallHalf*2+.16);
  // A shallow portal closes the shoulder gaps at the stair-to-hall junction.
  for(const side of [-1,1]){
    const width=hallHalf-shaftHalf;
    box(arch,end-.012,floor+1.19,centre+side*(shaftHalf+width/2),.19,2.38,width);
  }
  for(const [m,list] of batches){
    const mesh=new THREE.Mesh(mergeGeometries(list),m);
    mesh.receiveShadow=true;
    room.add(mesh);
    for(const g of list)g.dispose();
  }
  return {lamps};
}
