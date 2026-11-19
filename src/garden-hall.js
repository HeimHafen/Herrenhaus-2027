import { buildEntranceFloor } from './entrance-floor.js?v=85';
import { addOakParquet } from './parquet.js?v=83';
import { HALL_NORTH, northOpenings } from './manor-plan.js?v=84';

function texture(THREE, file, color=false) {
  const map=new THREE.TextureLoader().load('./assets/'+file);
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  if(color)map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=8;
  return map;
}

export function createLimestoneFloor(THREE) {
  return new THREE.MeshPhysicalMaterial({
    map:texture(THREE,'entry-finish/kalkstein-schachbrett-v79.jpg',true),
    bumpMap:texture(THREE,'entry-finish/kalkstein-fugen-v66.jpg'),
    roughnessMap:texture(THREE,'entry-finish/kalkstein-rauheit-v79.jpg'),
    bumpScale:.00125,roughness:.84,clearcoat:.23,clearcoatRoughness:.37
  });
}

export function addLimestoneFloor(THREE,group,material,x,y,z,width,depth) {
  const geometry=new THREE.PlaneGeometry(width,depth);
  geometry.rotateX(-Math.PI/2);
  const uv=geometry.attributes.uv,vertices=geometry.attributes.position;
  const scale=Math.SQRT1_2/(4*.46);
  for(let i=0;i<uv.count;i++){
    const wx=vertices.getX(i)+x,wz=vertices.getZ(i)+z;
    uv.setXY(i,(wx+wz)*scale,(wx-wz)*scale);
  }
  const surface=new THREE.Mesh(geometry,material);
  surface.name='Gartengeschoss_Kalkstein_Schachbrett';
  surface.position.set(x,y,z);
  surface.receiveShadow=true;
  group.add(surface);
  return surface;
}

export function addStonePanelling(THREE,group,base,spans) {
  const grain=texture(THREE,'entry-finish/kalkputz-relief.jpg');
  const panel=new THREE.MeshStandardMaterial({
    color:0xbca991, roughness:.83, bumpMap:grain,bumpScale:.0007
  });
  const profile=new THREE.MeshStandardMaterial({color:0xd1bda4,roughness:.76});
  const tile=new THREE.BoxGeometry(1,1,1);
  const parts=new Map([[panel,[]],[profile,[]]]);
  for(const {x,z,length,alongX,side} of spans){
    const piece=(material,u,height,projection,width,h,d)=>{
      const transform=new THREE.Matrix4().makeScale(alongX?width:d,h,alongX?d:width);
      transform.setPosition(x+(alongX?u:side*projection),base+height,z+(alongX?side*projection:u));
      parts.get(material).push(transform);
    };
    piece(panel,0,.45,.013,length,.90,.026);
    piece(profile,0,.90,.027,length,.047,.033);
    piece(profile,0,.933,.034,length,.019,.049);
    piece(profile,0,.893,.033,length,.013,.041);
    piece(profile,0,.081,.030,length,.019,.042);
    piece(panel,0,.037,.032,length,.074,.049);
    const count=Math.max(1,Math.round(length/.74));
    const bay=length/count;
    if(bay<.24)continue;
    for(let i=0;i<count;i++){
      const u=(i+.5)*bay-length/2, inset=bay/2-.078;
      for(const offset of [-inset,inset])piece(profile,u+offset,.46,.029,.016,.62,.015);
      for(const height of [.15,.77])piece(profile,u,height,.029,2*inset+.016,.016,.015);
    }
  }
  for(const [material,matrices] of parts){
    const mesh=new THREE.InstancedMesh(tile,material,matrices.length);
    mesh.name='Steinbeige_Wandkassetten';
    mesh.receiveShadow=true;
    matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));
    group.add(mesh);
  }
}

export function buildGardenHall(THREE,group,level,walls,plaster,slabs,rooms) {
  plaster.bumpMap=texture(THREE,'entry-finish/kalkputz-relief.jpg');
  plaster.bumpScale=.00065;
  plaster.color.setHex(0xe5d6c2);

  const floor=level.floor+.046;
  const oak=new THREE.MeshPhysicalMaterial({
    map:texture(THREE,'wood/oak-2027-color.jpg',true),
    bumpMap:texture(THREE,'wood/oak-2027-bump.jpg'),
    bumpScale:.0008,vertexColors:true,roughness:.55,clearcoat:.14,clearcoatRoughness:.49
  });
  const stone=rooms.filter(room=>room.name==='Halle'||room.name==='Windfang');
  const [slab]=slabs;
  const {width,depth}=slab.geometry.parameters;
  const {x,z}=slab.position;
  const south=z-depth/2,north=z+depth/2;
  const breaks=[south,...new Set(stone.flatMap(room=>[room.z1,room.z2]).filter(edge=>edge>south&&edge<north)),north]
    .sort((a,b)=>a-b);
  const stoneRegions=[];
  for(let i=1;i<breaks.length;i++){
    const z1=breaks[i-1],z2=breaks[i];
    const band=stone.find(room=>room.z1<=(z1+z2)/2&&room.z2>=(z1+z2)/2);
    const plank=(a,b)=>addOakParquet(THREE,group,{
      geometry:{parameters:{width:b-a,depth:z2-z1}},position:{x:(a+b)/2,z:(z1+z2)/2}
    },floor,oak);
    if(band){
      stoneRegions.push({...band,z1,z2});
      plank(x-width/2,band.x1);
      plank(band.x2,x+width/2);
    }else plank(x-width/2,x+width/2);
  }
  buildEntranceFloor(THREE,group,floor,stoneRegions,{x1:-1.56,x2:1.56,z1:north,z2:12.34});
  for(const x of [-15,-6,0,7,16]){
    const bounce=new THREE.PointLight(0xfff2e4,7.5,8,2);
    bounce.position.set(x,level.floor+2.25,-.75);
    group.add(bounce);
  }

  const spans=[];
  const casing=new THREE.MeshStandardMaterial({color:0xd8cbbb,roughness:.81});
  for(const [x,width] of northOpenings[0]){
    const z=HALL_NORTH-.098;
    const trim=(px,y,w,h)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,.04),casing);
      mesh.position.set(px,y,z);
      mesh.receiveShadow=true;
      group.add(mesh);
    };
    const top=level.floor+2.60;
    for(const side of [-1,1])trim(x+side*(width/2+.048),(floor+top)/2,.094,top-floor);
    trim(x,top+.048,width+.19,.096);
  }
  const fittedRooms=new Set(['Privatkino','Haupttreppe','Nebentreppe']);
  for(const {geometry,position:{x,z}} of walls){
    const {width,depth}=geometry.parameters;
    const alongX=depth===.17;
    if(!alongX&&width!==.17)continue;
    for(const side of [-1,1]){
      const px=x+(alongX?0:side*.10), pz=z+(alongX?side*.10:0);
      const room=rooms.find(({x1,x2,z1,z2})=>px>x1&&px<x2&&pz>z1&&pz<z2);
      if(!room||fittedRooms.has(room.name))continue;
      const length=alongX?width:depth;
      const begin=(alongX?x:z)-length/2;
      const end=begin+length;
      if(end<=begin)continue;
      const middle=(begin+end)/2;
      spans.push({x:alongX?middle:x+side*.085,z:alongX?z+side*.085:middle,
        length:end-begin,alongX,side});
    }
  }
  addStonePanelling(THREE,group,floor,spans);
}
