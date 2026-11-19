import { buildOakEntrance } from './oak-door.js?v=20261119-v39-deckfalz';
import { addStonePanelling } from './garden-hall.js?v=82';

// Local Z follows the hall towards the inner oak door; the exterior portal
// remains farther north, reached by turning out of this passage.
export function buildStairCorridor(THREE,structure,level,walls,plaster,stone,trim){
  const x=-1.77,z=.64,yaw=.82,base=level.floor+.046;
  const c=Math.cos(yaw),s=Math.sin(yaw);
  const group=new THREE.Group();
  group.name='Westtreppenhalle_Eichenflur';
  group.position.set(x,base,z);
  group.rotation.y=yaw;
  structure.add(group);
  const world=(u,v)=>({x:x+c*u+s*v,z:z-s*u+c*v});
  const ceiling=2.58,half=1.09,doorZ=4.86,thickness=.18;
  function box(name,mat,u,y,v,w,h,d,solid=false){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.name=name;
    mesh.position.set(u,y,v);
    mesh.castShadow=mesh.receiveShadow=true;
    group.add(mesh);
    if(solid)walls.push({...world(u,v),hw:w/2,hd:d/2,rotY:yaw});
  }

  // Panelled returns define the flur opening on both sides, with a real
  // side opening under the counterflight and another on the opposite side.
  const spans=[];
  const ceilingStart=-.30, ceilingEnd=doorZ+.21;
  const ceilingDepth=ceilingEnd-ceilingStart, ceilingCenter=(ceilingEnd+ceilingStart)/2;
  for(const side of [-1,1]){
    const u=side*(half+thickness/2);
    for(const [from,to] of [[-.20,.90],[2.03,doorZ+.11]]){
      box('Eichenflur_Wand',plaster,u,ceiling/2,(from+to)/2,thickness,ceiling,to-from,true);
      spans.push({x:side*half,z:(from+to)/2,length:to-from,alongX:false,side:-side});
    }
    box('Eichenflur_Seitentuersturz',plaster,u,2.35,1.465,thickness,.46,1.13);
    box('Eichenflur_Eingangsfassung',trim,u,1.27,-.23,.19,2.54,.16);
    box('Eichenflur_Deckengesims',trim,side*(half-.025),2.52,ceilingCenter,.09,.085,ceilingDepth);
  }
  // Return the entrance wall into the hall so the side room reads as a
  // narrow doorway and the flur as one framed opening.
  const wallPlane=-.18, wallFace=wallPlane-thickness/2;
  const pierEdge=-3.23, portalEdge=-1.265, upperEdge=1.22;
  box('Eichenflur_Linkes_Wandfeld',plaster,1.84,2.02,wallPlane,1.25,4.04,thickness,true);
  spans.push({x:1.84,z:wallFace,length:1.25,alongX:true,side:-1});
  spans.push({x:(pierEdge+portalEdge)/2,z:wallFace,length:portalEdge-pierEdge,alongX:true,side:-1});
  // The oblique foreground wall frames the near side room from the hall.
  const sideReturn=1.60, sideHead=2.66;
  for(const [a,b] of [[-2.34,-1.42],[-.42,wallFace]]){
    box('Eichenflur_Vordere_Seitenwand',plaster,sideReturn,2.02,(a+b)/2,.17,4.04,b-a,true);
    spans.push({x:sideReturn-.085,z:(a+b)/2,length:b-a,alongX:false,side:-1});
  }
  box('Eichenflur_Nebentuersturz',plaster,sideReturn,(sideHead+4.04)/2,-.92,.17,4.04-sideHead,1);
  for(const edge of [-1.42,-.42]){
    box('Eichenflur_Nebentuer_Gewaende',trim,sideReturn-.091,sideHead/2,edge,.042,sideHead,.11);
  }
  box('Eichenflur_Nebentuer_Kopfprofil',trim,sideReturn-.091,sideHead,-.92,.042,.09,1.11);
  addStonePanelling(THREE,group,0,spans);
  box('Eichenflur_Vordere_Kronleiste',trim,sideReturn-.11,3.99,-1.30,.105,.084,2.08);
  box('Eichenflur_Decke',plaster,0,ceiling+.07,ceilingCenter,2*half+.36,.14,ceilingDepth);
  box('Eichenflur_Sturz',plaster,0,2.66,-.21,2.49,.13,.21);

  // The wall over the portal and the paneled pier share a single face.
  // Its sloped cut ends below the return flight instead of stepping back.
  const nearHead=2.27;
  box('Eichenflur_Abgesenkter_Sturz',plaster,0,(nearHead+2.60)/2,wallPlane,2.49,2.60-nearHead,thickness);
  box('Eichenflur_Schmales_Sturzprofil',trim,0,nearHead,wallFace-.02,2.49,.038,.061);
  for(const side of [-1,1]){
    box('Eichenflur_Schmales_Gewaende',stone,side*1.17,nearHead/2,wallFace-.014,.053,nearHead,.092);
  }
  const face=new THREE.Shape();
  face.moveTo(pierEdge,0);
  for(const [u,y] of [[portalEdge,0],[portalEdge,2.60],[upperEdge,2.60],
    [upperEdge,4.055],[-.92,4.055],[-1.29,3.33],[-2.55,2.19],[pierEdge,1.31]])face.lineTo(u,y);
  face.closePath();
  const masonry=new THREE.Mesh(new THREE.ExtrudeGeometry(face,{depth:thickness,bevelEnabled:false}),plaster);
  masonry.name='Eichenflur_Durchgehende_Wand_unter_Gegenlauf';
  masonry.position.z=wallFace;
  masonry.castShadow=masonry.receiveShadow=true;
  group.add(masonry);
  walls.push({...world((pierEdge+portalEdge)/2,wallPlane),hw:(portalEdge-pierEdge)/2,hd:thickness/2,rotY:yaw});
  for(const [height,depth] of [[3.974,.08],[4.008,.11],[4.042,.14]]){
    box('Eichenflur_Kronleiste',trim,.77,height,wallFace,3.37,.035,depth);
  }

  const door=buildOakEntrance(THREE,group);
  door.name='Eichenflur_Innere_Doppeltuer';
  const widthScale=.64,heightScale=.576;
  door.scale.set(widthScale,heightScale,.64);
  door.position.set(0,-door.userData.opening.thresholdY*heightScale,doorZ-12.13*.64);
  const openingHalf=1.32*widthScale;
  for(const side of [-1,1]){
    const jambWidth=half-openingHalf;
    box('Eichenflur_Tuerwange',plaster,side*(half+openingHalf)/2,ceiling/2,doorZ,
      jambWidth,ceiling,.22,true);
    box('Eichenflur_Holzfassung',trim,side*(openingHalf+.031),1.16,doorZ-.125,.063,2.32,.11);
  }
  box('Eichenflur_Tuersturz',plaster,0,2.46,doorZ,openingHalf*2,.24,.22);
  box('Eichenflur_Tuerkopfprofil',trim,0,2.315,doorZ-.125,openingHalf*2+.12,.063,.11);

  const frame=new THREE.MeshStandardMaterial({color:0x806044,roughness:.65});
  const picture=new THREE.MeshStandardMaterial({color:0x514336,roughness:.93});
  for(const side of [-1,1]){
    box('Eichenflur_Bildrahmen',frame,side*(half-.024),1.56,2.48,.048,.52,.37);
    box('Eichenflur_Bild',picture,side*(half-.051),1.56,2.48,.015,.43,.28);
  }
  for(const v of [.6,2.35,3.45]){
    const light=new THREE.PointLight(0xffeacc,7.3,4.4,2);
    light.position.set(0,2.28,v);
    group.add(light);
  }
  let angle=0;
  function local(px,pz){
    const dx=px-x,dz=pz-z;
    return [c*dx-s*dz,s*dx+c*dz];
  }
  return {
    group, doorZ, leaves:door.userData.leaves,
    update(px,pz,onGround,dt){
      const [u,v]=local(px,pz);
      const goal=onGround&&Math.abs(u)<1.24&&Math.abs(v-doorZ)<1.42?1.48:0;
      if(angle===goal)return false;
      angle=THREE.MathUtils.damp(angle,goal,10,dt);
      if(Math.abs(goal-angle)<.002)angle=goal;
      door.userData.leaves[0].rotation.y=-angle;
      door.userData.leaves[1].rotation.y=angle;
      return true;
    },
    blocks(px,pz,radius){
      const [u,v]=local(px,pz);
      for(const side of [-1,1]){
        const dx=u-side*openingHalf,dz=v-doorZ;
        const ca=Math.cos(angle),sa=Math.sin(angle);
        const along=-side*dx*ca+dz*sa;
        const across=side*dx*sa+dz*ca;
        if(along>-radius&&along<openingHalf+radius&&Math.abs(across)<.12+radius)return true;
      }
      return false;
    }
  };
}
