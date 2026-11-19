import { addLimestoneFloor, createLimestoneFloor } from './garden-hall.js?v=68';
import { ENTRY_WINDOW_BAYS, ENTRY_WINDOW_INNER_FACE, NORTH_OPENING_WIDTH,
  WINDOW_STOREYS, openingHeight } from './window-layout.js?v=33';

export function buildEntrySalons(THREE,scene,walls){
  const rooms=new THREE.Group();
  rooms.name='Salons_am_Haupteingang';
  scene.add(rooms);
  const loader=new THREE.TextureLoader();
  const relief=loader.load('./assets/entry-finish/kalkputz-relief.jpg');
  relief.wrapS=relief.wrapT=THREE.RepeatWrapping;
  relief.repeat.set(3,3);
  const material=(color,roughness=.85,glow=0)=>new THREE.MeshStandardMaterial({
    color,roughness,emissive:color,emissiveIntensity:glow
  });
  const floor=createLimestoneFloor(THREE);
  const ceiling=material(0xf1e6d3,.87,.16);
  const trim=material(0xe4d9c5,.72,.095);
  const walnut=material(0x68452e,.53);
  const bronze=new THREE.MeshStandardMaterial({color:0x836441,metalness:.49,roughness:.43});
  const shade=material(0xffdcab,.6,.85);
  const bookColors=[0x594e37,0x77513f,0x5f6958,0x9a7b56].map(color=>material(color));
  const y0=.938,y1=4.965,z0=.715,z1=ENTRY_WINDOW_INNER_FACE-.012;
  const windowY=WINDOW_STOREYS[0].y, windowH=openingHeight(0,'north');

  for(const {left,right,x:windowX} of ENTRY_WINDOW_BAYS){
    if(windowX<0)continue; // The west bay now lights the stairwell.
    const side=Math.sign(windowX), west=side<0;
    const room=new THREE.Group();
    room.name=west?'Westzimmer_Lesesalon':'Ostzimmer_Schreibsalon';
    rooms.add(room);
    const wall=material(west?0xc9bba0:0xd1b6a0,.89,.14);
    wall.bumpMap=relief;
    wall.bumpScale=.005;
    const upholstery=material(west?0x58604a:0x75564d,.92);
    // The western stair enclosure projects into the nominal room line.
    const l=left+.092,r=right-.092,c=(l+r)/2;
    function mesh(geometry,mat,x,y,z){
      const object=new THREE.Mesh(geometry,mat);
      object.position.set(x,y,z);
      object.receiveShadow=true;
      room.add(object);
      return object;
    }
    function box(mat,x,y,z,w,h,d,blocks=false){
      if(blocks)walls.push({x,z,hw:w/2,hd:d/2});
      return mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z);
    }
    function sidePanel(x,a,b,low=y0,high=y1,skirting=true){
      box(wall,x,(low+high)/2,(a+b)/2,.027,high-low,b-a);
      if(skirting)box(trim,x+Math.sign(c-x)*.016,y0+.069,(a+b)/2,.035,.138,b-a);
    }

    // One world-aligned pattern across the existing threshold and alcove.
    addLimestoneFloor(THREE,room,floor,c,y0+.003,(z0+z1)/2,r-l,z1-z0);
    box(ceiling,c,y1+.013,(z0+z1)/2,r-l,.026,z1-z0);
    box(wall,c,(y0+y1)/2,z0,r-l,y1-y0,.026);
    box(trim,c,y0+.069,z0+.019,r-l,.138,.038);

    for(const [x,door,width] of west?[[l,2.2,1.45],[r,2.4,1.50]]:[[l,2.4,1.52],[r,2.45,1.50]]){
      const a=door-width/2,b=door+width/2;
      sidePanel(x,z0,a);
      if(west&&x===l){
        sidePanel(x,b,3.9);
        sidePanel(x+.38,3.9,7.75);
        sidePanel(x,7.75,z1);
        for(const z of [3.9,7.75]){
          box(wall,x+.19,(y0+y1)/2,z,.38,y1-y0,.027);
        }
      }else{
        sidePanel(x,b,z1);
      }
      sidePanel(x,a,b,.89+2.6,y1,false);
      for(const edge of [a,b])box(trim,x+Math.sign(c-x)*.019,(y0+3.49)/2,edge,.034,3.49-y0,.067);
      box(trim,x+Math.sign(c-x)*.019,3.52,door,.034,.06,width+.065);
      box(trim,x+Math.sign(c-x)*.027,y1-.042,(z0+z1)/2,.073,.084,z1-z0);
    }

    function frontPanel(a,b,low,high){
      box(wall,(a+b)/2,(low+high)/2,z1,b-a,high-low,.026);
    }
    const windowLeft=windowX-NORTH_OPENING_WIDTH/2;
    const windowRight=windowX+NORTH_OPENING_WIDTH/2;
    frontPanel(l,windowLeft,y0,y1);
    frontPanel(windowRight,r,y0,y1);
    frontPanel(windowLeft,windowRight,y0,windowY-windowH/2);
    frontPanel(windowLeft,windowRight,windowY+windowH/2,y1);
    box(trim,c,y0+.069,z1-.019,r-l,.138,.038);
    box(trim,c,y1-.042,z1-.027,r-l,.084,.073);

    // A pair of related rooms with different uses. Keep the path beside
    // the furniture open from the doors to the existing window recess.
    const inner=west?r:l;
    const seatX=inner+side*.49,seatZ=7.85;
    box(walnut,seatX,y0+.25,seatZ,.77,.20,1.88,true);
    box(upholstery,seatX,y0+.43,seatZ,.73,.19,1.84);
    box(upholstery,inner+side*.16,y0+.68,seatZ,.22,.59,1.88);
    for(const z of [seatZ-.85,seatZ+.85]){
      box(upholstery,seatX,y0+.63,z,.76,.25,.17);
      for(const x of [seatX-.27,seatX+.27])box(walnut,x,y0+.103,z,.07,.206,.07);
    }
    const deskX=inner+side*.43, deskZ=5.25;
    box(walnut,deskX,y0+.76,deskZ,.63,.068,1.40,true);
    box(walnut,deskX,y0+.67,deskZ,.55,.13,1.30);
    for(const x of [deskX-.24,deskX+.24])for(const z of [deskZ-.60,deskZ+.60]){
      box(walnut,x,y0+.342,z,.063,.685,.063);
    }
    const lampZ=deskZ-.46;
    mesh(new THREE.CylinderGeometry(.09,.105,.04,20),bronze,deskX,y0+.813,lampZ);
    mesh(new THREE.CylinderGeometry(.015,.02,.32,16),bronze,deskX,y0+.98,lampZ);
    mesh(new THREE.CylinderGeometry(.105,.164,.20,24),shade,deskX,y0+1.19,lampZ);
    for(let i=0;i<4;i++){
      box(bookColors[i],deskX+.03,y0+.825+i*.028,deskZ+.32,.17,.027,.24-i*.009);
    }
    const lamp=new THREE.PointLight(0xffd4a2,5.0,3.6,2);
    lamp.position.set(deskX-side*.12,y0+1.17,lampZ);
    room.add(lamp);
    const bounce=new THREE.PointLight(0xffe5c8,7.5,3.7,2);
    bounce.position.set(c,y0+2.45,8.7);
    room.add(bounce);
  }
}
